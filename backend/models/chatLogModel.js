/**
 * ChatLog model (PLAN §3.4 / M4 T4.1).
 *
 * One row per assistant turn. Powers the Admin "Assistant Logs" dashboard and
 * the privacy-router proof: which model handled the turn, why it was routed
 * there, what PII was detected (stored MASKED — we never re-leak what we just
 * protected), and the cost (local route ⇒ $0.00).
 */

import mongoose from 'mongoose'

const detectedPIISchema = mongoose.Schema(
  {
    type: { type: String, required: true }, // email | phone | card | postal | intent
    masked: { type: String, required: true }, // e.g. "j***@example.com" — never the raw value
  },
  { _id: false }
)

const toolCallSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    args: { type: Object, default: {} },
  },
  { _id: false }
)

const chatLogSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    userName: { type: String, required: true },
    message: { type: String, required: true },
    detectedPII: [detectedPIISchema],
    route: { type: String, required: true, enum: ['local', 'cloud'] },
    reason: { type: String, required: true },
    model: { type: String, default: '' },
    response: { type: String, default: '' },
    toolCalls: [toolCallSchema],
    latencyMs: { type: Number, default: 0 },
    costUsd: { type: Number, default: 0 },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    mode: { type: String, default: 'mock' }, // mock | live
  },
  { timestamps: true }
)

const ChatLog = mongoose.model('ChatLog', chatLogSchema)

export default ChatLog
