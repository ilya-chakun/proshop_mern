// Legacy-stack integration smoke test (permanent form of the M0.0 go/no-go gate):
// proves Mongoose 5.10.6 + mongodb-memory-server + the real userModel (bcrypt
// pre-save hook + matchPassword) round-trip on this Node/arch.
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import User from '../models/userModel.js'

let mongod

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri(), {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
  })
})

afterAll(async () => {
  await mongoose.disconnect()
  if (mongod) await mongod.stop()
})

test('Mongoose 5 connects and round-trips through the real User model', async () => {
  const u = await User.create({
    name: 'Smoke Admin',
    email: 'smoke@example.com',
    password: 'plaintext123',
    isAdmin: true,
  })

  const found = await User.findById(u._id)
  expect(found).not.toBeNull()
  // pre-save bcrypt hook must have hashed the password
  expect(found.password).not.toBe('plaintext123')
  // matchPassword method works both ways
  await expect(found.matchPassword('plaintext123')).resolves.toBe(true)
  await expect(found.matchPassword('wrong')).resolves.toBe(false)
})
