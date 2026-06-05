import express from 'express'
const router = express.Router()
import { getChatLogs } from '../controllers/chatLogController.js'
import { protect, admin } from '../middleware/authMiddleware.js'

// Admin-only: the assistant audit log may contain other users' (masked) activity.
router.route('/').get(protect, admin, getChatLogs)

export default router
