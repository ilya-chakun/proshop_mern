import express from 'express'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FEATURES_PATH = path.resolve(__dirname, '..', 'features.json')

const router = express.Router()

router.get('/', async (req, res, next) => {
  try {
    const raw = await fs.readFile(FEATURES_PATH, 'utf8')
    res.json(JSON.parse(raw))
  } catch (err) {
    next(err)
  }
})

router.get('/:name', async (req, res, next) => {
  try {
    const raw = await fs.readFile(FEATURES_PATH, 'utf8')
    const all = JSON.parse(raw)
    const feature = all[req.params.name]

    if (!feature) {
      return res
        .status(404)
        .json({ message: `Feature '${req.params.name}' not found` })
    }

    res.json({ name: req.params.name, ...feature })
  } catch (err) {
    next(err)
  }
})

// POST /api/feature-flags/state — change feature status
router.post('/state', async (req, res, next) => {
  try {
    console.log('POST /state body:', JSON.stringify(req.body))
    const { feature_name, state } = req.body
    const validStates = ['Disabled', 'Testing', 'Enabled']
    if (!feature_name || !state) {
      return res.status(400).json({ message: 'feature_name and state required' })
    }
    if (!validStates.includes(state)) {
      return res.status(400).json({ message: `Invalid state. Must be one of: ${validStates.join(', ')}` })
    }

    const raw = await fs.readFile(FEATURES_PATH, 'utf8')
    const all = JSON.parse(raw)
    if (!all[feature_name]) {
      return res.status(404).json({ message: `Feature '${feature_name}' not found` })
    }

    const previous = all[feature_name].status
    all[feature_name].status = state
    all[feature_name].last_modified = new Date().toISOString().slice(0, 10)
    if (state === 'Disabled') {
      all[feature_name].traffic_percentage = 0
    }

    await fs.writeFile(FEATURES_PATH, JSON.stringify(all, null, 2))
    res.json({ feature_name, previous_state: previous, new_state: state })
  } catch (err) {
    next(err)
  }
})

// POST /api/feature-flags/traffic — adjust traffic percentage
router.post('/traffic', async (req, res, next) => {
  try {
    const { feature_name } = req.body
    const percentage = Number(req.body.percentage)
    if (!feature_name || req.body.percentage === undefined) {
      return res.status(400).json({ message: 'feature_name and percentage required' })
    }
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      return res.status(400).json({ message: 'percentage must be 0-100' })
    }

    const raw = await fs.readFile(FEATURES_PATH, 'utf8')
    const all = JSON.parse(raw)
    if (!all[feature_name]) {
      return res.status(404).json({ message: `Feature '${feature_name}' not found` })
    }
    if (all[feature_name].status === 'Disabled' && percentage > 0) {
      return res.status(400).json({ message: 'Cannot set traffic > 0 on Disabled feature' })
    }

    all[feature_name].traffic_percentage = percentage
    all[feature_name].last_modified = new Date().toISOString().slice(0, 10)

    await fs.writeFile(FEATURES_PATH, JSON.stringify(all, null, 2))
    res.json({ feature_name, traffic_percentage: percentage, status: all[feature_name].status })
  } catch (err) {
    next(err)
  }
})

export default router
