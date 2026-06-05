import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import colors from 'colors'
import users from './data/users.js'
import products from './data/products.js'
import User from './models/userModel.js'
import Product from './models/productModel.js'
import Order from './models/orderModel.js'
import connectDB from './config/db.js'

dotenv.config()

/**
 * Pure, reusable seed routine. Operates on the models' active mongoose
 * connection (caller is responsible for connecting first). Does NOT touch
 * process.exit, so the verify harness / tests can call it in-process.
 *
 * NOTE: uses insertMany (matching the original importData), which BYPASSES the
 * userModel pre('save') bcrypt hook — this is intentional because data/users.js
 * already ships pre-hashed passwords.
 *
 * @returns {Promise<{users: object[], products: object[], adminUser: import('mongoose').Types.ObjectId}>}
 */
export const seedInto = async () => {
  await Order.deleteMany()
  await Product.deleteMany()
  await User.deleteMany()

  const createdUsers = await User.insertMany(users)
  const adminUser = createdUsers[0]._id

  const sampleProducts = products.map((product) => {
    return { ...product, user: adminUser }
  })

  const createdProducts = await Product.insertMany(sampleProducts)

  return { users: createdUsers, products: createdProducts, adminUser }
}

/**
 * Remove all seeded collections. Pure (no process.exit).
 */
export const destroyInto = async () => {
  await Order.deleteMany()
  await Product.deleteMany()
  await User.deleteMany()
}

const importData = async () => {
  try {
    await seedInto()
    console.log('Data Imported!'.green.inverse)
    process.exit()
  } catch (error) {
    console.error(`${error}`.red.inverse)
    process.exit(1)
  }
}

const destroyData = async () => {
  try {
    await destroyInto()
    console.log('Data Destroyed!'.red.inverse)
    process.exit()
  } catch (error) {
    console.error(`${error}`.red.inverse)
    process.exit(1)
  }
}

/**
 * True only when this file is executed directly (`node backend/seeder [-d]`),
 * not when imported by tests / the verify harness. Compares argv[1] to this
 * module path, tolerating the missing `.js` extension in the npm scripts.
 */
const isRunDirectly = () => {
  if (!process.argv[1]) return false
  const invoked = path.resolve(process.argv[1]).replace(/\.js$/, '')
  const self = fileURLToPath(import.meta.url).replace(/\.js$/, '')
  return invoked === self
}

if (isRunDirectly()) {
  // CLI mode: connect to the real DB, then import or destroy.
  connectDB()
  if (process.argv[2] === '-d') {
    destroyData()
  } else {
    importData()
  }
}
