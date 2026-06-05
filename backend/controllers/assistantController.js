/**
 * Assistant controller (PLAN §3.3 / M3).
 *
 * POST /api/assistant/chat  (protect) — runs one agent turn for the signed-in
 * user. ChatLog persistence (M4) is layered on top of this in T4.2.
 */

import asyncHandler from 'express-async-handler'
import { runAssistant } from '../assistant/agent.js'
import { estimateCostUsd } from '../assistant/pricing.js'
import ChatLog from '../models/chatLogModel.js'

/**
 * @route   POST /api/assistant/chat
 * @access  Private (protect)
 * @body    { message: string }
 */
const chat = asyncHandler(async (req, res) => {
  const { message } = req.body
  if (!message || !String(message).trim()) {
    res.status(400)
    throw new Error('message is required')
  }

  const mode = process.env.PROVIDER_MODE || 'mock'
  const result = await runAssistant({ message, user: req.user, mode })

  // PII is stored MASKED — never re-leak what the router just protected.
  const detectedPII = result.matches.map((m) => ({ type: m.type, masked: m.masked }))

  // HARD RULE: local route ⇒ costUsd === 0 (enforced inside estimateCostUsd).
  const costUsd = estimateCostUsd({
    route: result.route,
    model: result.model,
    promptTokens: result.usage.promptTokens,
    completionTokens: result.usage.completionTokens,
  })

  const log = await ChatLog.create({
    user: req.user._id,
    userName: req.user.name,
    message,
    detectedPII,
    route: result.route,
    reason: result.reason,
    model: result.model,
    response: result.content,
    toolCalls: result.toolCalls.map((t) => ({ name: t.name, args: t.args })),
    latencyMs: result.latencyMs,
    costUsd,
    promptTokens: result.usage.promptTokens,
    completionTokens: result.usage.completionTokens,
    mode,
  })

  res.json({
    id: log._id,
    greetingFor: req.user.name,
    route: result.route,
    reason: result.reason,
    model: result.model,
    response: result.content,
    toolCalls: result.toolCalls,
    detectedPII,
    latencyMs: result.latencyMs,
    costUsd,
  })
})

export { chat }
