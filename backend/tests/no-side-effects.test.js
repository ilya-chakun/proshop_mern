// T0.4 acceptance: importing `app` (and `seeder`) must have NO import-time
// side-effects under test — no Mongo connection, no process.exit, no open port.
// Jest sets NODE_ENV='test' by default, which arms the guards in server.js.
import request from 'supertest'
import mongoose from 'mongoose'
import app from '../server.js'
import { seedInto, destroyInto } from '../seeder.js'

test('NODE_ENV is "test" so server.js side-effect guards are armed', () => {
  expect(process.env.NODE_ENV).toBe('test')
})

test('importing app does NOT open a Mongo connection', () => {
  // 0 = disconnected. If connectDB() had run at import, this would be 1/2.
  expect(mongoose.connection.readyState).toBe(0)
})

test('app is a usable express handler and serves without a DB', async () => {
  const res = await request(app).get('/')
  expect(res.status).toBe(200)
  expect(res.text).toContain('API is running')
})

test('a protected route returns 401 (not a crash) with no DB and no token', async () => {
  const res = await request(app).get('/api/orders/myorders')
  expect(res.status).toBe(401)
})

test('seeder exports pure helpers and did not auto-run on import', () => {
  // Reaching this line at all proves importing seeder.js did not call
  // process.exit() (that would have torn down the worker).
  expect(typeof seedInto).toBe('function')
  expect(typeof destroyInto).toBe('function')
})
