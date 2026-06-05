// M4 (T4.2/T4.3) acceptance: every /assistant/chat turn persists exactly one
// ChatLog with the correct route + cost (local ⇒ $0), and GET /api/chatlogs is
// admin-only (non-admin → 401) and returns the rows + summary cards.

import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import request from 'supertest'

let app
let mongod
let ChatLog
let admin
let jane
let generateToken

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret-m7-logs'
  process.env.PROVIDER_MODE = 'mock'

  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri(), {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
  })

  const User = (await import('../models/userModel.js')).default
  ChatLog = (await import('../models/chatLogModel.js')).default
  generateToken = (await import('../utils/generateToken.js')).default
  app = (await import('../server.js')).default

  admin = await User.create({
    name: 'Admin',
    email: 'admin@example.com',
    password: '123456',
    isAdmin: true,
  })
  jane = await User.create({ name: 'Jane Doe', email: 'jane@example.com', password: '123456' })
})

afterAll(async () => {
  await mongoose.disconnect()
  if (mongod) await mongod.stop()
})

const auth = (u) => `Bearer ${generateToken(u._id)}`

describe('ChatLog persistence + admin dashboard API', () => {
  test('a LOCAL turn persists one row with costUsd === 0', async () => {
    await ChatLog.deleteMany({})
    const res = await request(app)
      .post('/api/assistant/chat')
      .set('Authorization', auth(jane))
      .send({ message: 'Where is my order?' })

    expect(res.status).toBe(200)
    expect(res.body.route).toBe('local')
    expect(res.body.costUsd).toBe(0)

    const rows = await ChatLog.find({})
    expect(rows).toHaveLength(1)
    expect(rows[0].route).toBe('local')
    expect(rows[0].costUsd).toBe(0)
    expect(rows[0].userName).toBe('Jane Doe')
    // PII/tool args stored, but raw response too — masked PII only in detectedPII.
    expect(rows[0].reason).toBeTruthy()
  })

  test('a CLOUD turn persists a row with costUsd > 0', async () => {
    await ChatLog.deleteMany({})
    const res = await request(app)
      .post('/api/assistant/chat')
      .set('Authorization', auth(jane))
      .send({ message: 'Do you have the Airpods Wireless Bluetooth Headphones in stock?' })

    expect(res.status).toBe(200)
    expect(res.body.route).toBe('cloud')
    expect(res.body.costUsd).toBeGreaterThan(0)

    const rows = await ChatLog.find({})
    expect(rows).toHaveLength(1)
    expect(rows[0].route).toBe('cloud')
    expect(rows[0].costUsd).toBeGreaterThan(0)
  })

  test('GET /api/chatlogs is admin-only', async () => {
    const nonAdmin = await request(app)
      .get('/api/chatlogs')
      .set('Authorization', auth(jane))
    expect(nonAdmin.status).toBe(401)

    const anon = await request(app).get('/api/chatlogs')
    expect(anon.status).toBe(401)
  })

  test('admin lists logs with pagination + summary cards', async () => {
    await ChatLog.deleteMany({})
    // one local (free) + one cloud (paid)
    await request(app)
      .post('/api/assistant/chat')
      .set('Authorization', auth(jane))
      .send({ message: 'Where is my order?' })
    await request(app)
      .post('/api/assistant/chat')
      .set('Authorization', auth(jane))
      .send({ message: 'Do you have the Airpods Wireless Bluetooth Headphones in stock?' })

    const res = await request(app)
      .get('/api/chatlogs')
      .set('Authorization', auth(admin))

    expect(res.status).toBe(200)
    expect(res.body.logs.length).toBe(2)
    expect(res.body.page).toBe(1)
    expect(res.body.summary.total).toBe(2)
    expect(res.body.summary.localCount).toBe(1)
    expect(res.body.summary.cloudCount).toBe(1)
    // routing PII turns to the free local model saves money vs all-cloud baseline.
    expect(res.body.summary.savedUsd).toBeGreaterThan(0)
  })
})
