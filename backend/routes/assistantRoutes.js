import express from 'express'
const router = express.Router()
import { chat } from '../controllers/assistantController.js'
import { protect } from '../middleware/authMiddleware.js'

// All assistant endpoints require a signed-in user: the agent's scoped tools
// derive TRUSTED_UID from req.user._id (set by `protect`).
router.route('/chat').post(protect, chat)

export default router
