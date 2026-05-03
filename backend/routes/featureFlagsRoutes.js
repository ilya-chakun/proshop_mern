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

export default router
