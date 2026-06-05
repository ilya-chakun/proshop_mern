// M3 (T3.2) acceptance: the /api/assistant/chat endpoint end-to-end in mock mode.
//   - 401 without a valid JWT (protect guards TRUSTED_UID).
//   - public-catalog question  -> routes CLOUD, runs getProducts, answers Airpods.
//   - private "where is my order" -> routes LOCAL, runs SCOPED getMyOrders, and the
//     tool result contains ONLY the signed-in user's orders (DZ2 invariant, live path).

import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import request from 'supertest'

let app
let mongod
let jane
let john
let generateToken

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret-m7'
  process.env.PROVIDER_MODE = 'mock'

  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri(), {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
  })

  // Import AFTER env + connection so models bind to the in-memory DB.
  const User = (await import('../models/userModel.js')).default
  const Order = (await import('../models/orderModel.js')).default
  generateToken = (await import('../utils/generateToken.js')).default
  app = (await import('../server.js')).default

  jane = await User.create({ name: 'Jane Doe', email: 'jane@example.com', password: '123456' })
  john = await User.create({ name: 'John Doe', email: 'john@example.com', password: '123456' })

  const order = (user, label) => ({
    user: user._id,
    orderItems: [
      { name: label, qty: 1, image: '/i.jpg', price: 5, product: new mongoose.Types.ObjectId() },
    ],
    shippingAddress: { address: 'a', city: 'c', postalCode: '00000', country: 'US' },
    paymentMethod: 'PayPal',
    totalPrice: 5,
    isPaid: true,
    paidAt: new Date(),
  })
  await Order.create(order(jane, 'JANE-ORDER'))
  await Order.create(order(john, 'JOHN-ORDER'))
})

afterAll(async () => {
  await mongoose.disconnect()
  if (mongod) await mongod.stop()
})

const auth = (user) => `Bearer ${generateToken(user._id)}`

describe('POST /api/assistant/chat', () => {
  test('401 without a token', async () => {
    const res = await request(app)
      .post('/api/assistant/chat')
      .send({ message: 'Where is my order?' })
    expect(res.status).toBe(401)
  })

  test('400 when message is missing', async () => {
    const res = await request(app)
      .post('/api/assistant/chat')
      .set('Authorization', auth(jane))
      .send({})
    expect(res.status).toBe(400)
  })

  test('public-catalog question routes to CLOUD and answers about Airpods', async () => {
    const res = await request(app)
      .post('/api/assistant/chat')
      .set('Authorization', auth(jane))
      .send({ message: 'Do you have the Airpods Wireless Bluetooth Headphones in stock?' })

    expect(res.status).toBe(200)
    expect(res.body.route).toBe('cloud')
    expect(res.body.greetingFor).toBe('Jane Doe')
    expect(res.body.response).toMatch(/Airpods/i)
    expect(res.body.detectedPII).toHaveLength(0)
    expect(res.body.toolCalls.map((t) => t.name)).toContain('getProducts')
  })

  test('"Where is my order?" routes LOCAL and scoped getMyOrders returns only my orders', async () => {
    const res = await request(app)
      .post('/api/assistant/chat')
      .set('Authorization', auth(jane))
      .send({ message: 'Where is my order?' })

    expect(res.status).toBe(200)
    expect(res.body.route).toBe('local')
    const call = res.body.toolCalls.find((t) => t.name === 'getMyOrders')
    expect(call).toBeDefined()
    // The SCOPED tool returned ONLY Jane's order — never John's.
    const names = call.result.flatMap((o) => o.items.map((i) => i.name))
    expect(names).toContain('JANE-ORDER')
    expect(names).not.toContain('JOHN-ORDER')
  })

  test('PII in the message is detected and reported masked', async () => {
    const res = await request(app)
      .post('/api/assistant/chat')
      .set('Authorization', auth(jane))
      .send({ message: 'My email is jane@example.com — can you resend my last receipt?' })

    expect(res.status).toBe(200)
    expect(res.body.route).toBe('local')
    expect(res.body.detectedPII.map((p) => p.type)).toContain('email')
    // Raw PII must not appear in the masked report.
    const masked = res.body.detectedPII.find((p) => p.type === 'email').masked
    expect(masked).not.toBe('jane@example.com')
  })
})
