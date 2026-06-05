/**
 * ChatLog controller (PLAN §3.4 / M4 T4.3).
 *
 * Admin-only read API powering the "Assistant Logs" dashboard. Returns the
 * paginated turn history plus aggregate summary cards (local vs cloud split and
 * the $ saved by routing PII turns to the free local model).
 */

import asyncHandler from 'express-async-handler'
import ChatLog from '../models/chatLogModel.js'
import { baselineCloudCost } from '../assistant/pricing.js'

const PAGE_SIZE = 20

/**
 * @route   GET /api/chatlogs
 * @access  Private/Admin
 * @query   pageNumber
 */
const getChatLogs = asyncHandler(async (req, res) => {
  const page = Number(req.query.pageNumber) || 1
  const count = await ChatLog.countDocuments({})

  const logs = await ChatLog.find({})
    .sort({ createdAt: -1 })
    .limit(PAGE_SIZE)
    .skip(PAGE_SIZE * (page - 1))

  // Summary across ALL rows (not just the page) for the dashboard cards.
  const all = await ChatLog.find({}).select(
    'route costUsd promptTokens completionTokens'
  )
  let localCount = 0
  let cloudCount = 0
  let actualCost = 0
  let baselineCost = 0 // what an all-cloud system would have cost
  for (const l of all) {
    actualCost += l.costUsd || 0
    if (l.route === 'local') {
      localCount += 1
      // This PII turn ran FREE locally; price what it WOULD have cost on cloud.
      baselineCost += baselineCloudCost({
        promptTokens: l.promptTokens || 0,
        completionTokens: l.completionTokens || 0,
      })
    } else {
      cloudCount += 1
      // Cloud turns would cost the same in an all-cloud baseline → no saving/loss.
      baselineCost += l.costUsd || 0
    }
  }

  res.json({
    logs,
    page,
    pages: Math.ceil(count / PAGE_SIZE),
    summary: {
      total: count,
      localCount,
      cloudCount,
      actualCostUsd: Number(actualCost.toFixed(6)),
      baselineCloudCostUsd: Number(baselineCost.toFixed(6)),
      savedUsd: Number((baselineCost - actualCost).toFixed(6)),
    },
  })
})

export { getChatLogs }
