// M3 (T3.1) acceptance: scoped tools are bound to a TRUSTED_UID and CANNOT be
// widened to another user — getMyOrders(uidA) never returns uidB's orders, even
// if the model tries to pass a different id as an argument.

import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import User from '../models/userModel.js'
import Product from '../models/productModel.js'
import Order from '../models/orderModel.js'
import {
  buildToolExecutors,
  getProducts,
  getMyOrders,
  getMyProfile,
} from '../assistant/tools.js'

let mongod
let alice
let bob

const makeOrder = (user, label) => ({
  user: user._id,
  orderItems: [
    {
      name: label,
      qty: 1,
      image: '/img.jpg',
      price: 10,
      product: new mongoose.Types.ObjectId(),
    },
  ],
  shippingAddress: { address: 'a', city: 'c', postalCode: '00000', country: 'US' },
  paymentMethod: 'PayPal',
  totalPrice: 10,
})

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri(), {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
  })
  alice = await User.create({
    name: 'Alice',
    email: 'alice@example.com',
    password: 'pw',
  })
  bob = await User.create({
    name: 'Bob',
    email: 'bob@example.com',
    password: 'pw',
  })
  await Order.create(makeOrder(alice, 'ALICE-ORDER'))
  await Order.create(makeOrder(bob, 'BOB-ORDER'))
  await Product.create({
    user: alice._id,
    name: 'Airpods Wireless Bluetooth Headphones',
    image: '/a.jpg',
    brand: 'Apple',
    category: 'Electronics',
    description: 'buds',
    price: 89.99,
    countInStock: 3,
  })
})

afterAll(async () => {
  await mongoose.disconnect()
  if (mongod) await mongod.stop()
})

describe('scoped tools — tenant isolation', () => {
  test('getMyOrders returns ONLY the trusted user\'s orders', async () => {
    const aliceOrders = await getMyOrders(alice._id)
    expect(aliceOrders).toHaveLength(1)
    expect(aliceOrders[0].items[0].name).toBe('ALICE-ORDER')

    const bobOrders = await getMyOrders(bob._id)
    expect(bobOrders).toHaveLength(1)
    expect(bobOrders[0].items[0].name).toBe('BOB-ORDER')
  })

  test('executor IGNORES any model-supplied id (cannot widen scope)', async () => {
    // Agent binds executors to Alice. A malicious tool-call arg tries Bob's id.
    const executors = buildToolExecutors(alice._id)
    const result = await executors.getMyOrders({ userId: String(bob._id) })
    expect(result).toHaveLength(1)
    expect(result[0].items[0].name).toBe('ALICE-ORDER') // still Alice's, not Bob's
  })

  test('getMyProfile is scoped and never returns the password', async () => {
    const profile = await getMyProfile(alice._id)
    expect(profile).toEqual({
      name: 'Alice',
      email: 'alice@example.com',
      isAdmin: false,
    })
    expect(profile.password).toBeUndefined()
  })
})

describe('public catalog tool', () => {
  test('getProducts searches name/brand/category', async () => {
    const hits = await getProducts({ query: 'Airpods' })
    expect(hits.length).toBeGreaterThan(0)
    expect(hits[0]).toMatchObject({ brand: 'Apple', countInStock: 3 })
  })
  test('getProducts with no query lists catalog', async () => {
    const all = await getProducts({})
    expect(all.length).toBeGreaterThan(0)
  })
})
