import React, { useState } from 'react'
import { Button, Spinner, Alert } from 'react-bootstrap'

const N8N_URL = process.env.REACT_APP_N8N_WEBHOOK_URL
const N8N_API_KEY = process.env.REACT_APP_N8N_API_KEY

/**
 * Inline Auto-Pilot controls rendered inside each feature table row.
 * Compact button group + inline feedback alert.
 *
 * @param {object} props
 * @param {object} props.feature - Feature object with key, status, traffic_percentage.
 * @param {function} props.onUpdate - Callback after successful agent operation.
 */
const AutoPilotControls = ({ feature, onUpdate }) => {
  const [loading, setLoading] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const callAutoPilot = async (action, extras = {}) => {
    setLoading(action)
    setFeedback(null)

    try {
      const response = await fetch(`${N8N_URL}/feature-control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': N8N_API_KEY,
        },
        body: JSON.stringify({
          feature_id: feature.key,
          action,
          ...extras,
        }),
      })

      const result = await response.json()

      if (!response.ok || result.success === false) {
        setFeedback({
          type: 'danger',
          message: result.message || `HTTP ${response.status}`,
        })
        return
      }

      setFeedback({ type: 'success', message: result.message })
      if (onUpdate) {
        onUpdate(result.current_state)
      }
    } catch (e) {
      setFeedback({ type: 'danger', message: `Network error: ${e.message}` })
    } finally {
      setLoading(null)
    }
  }

  if (!feature) return null

  const btn = (action, label, variant, extras = {}) => (
    <Button
      variant={variant}
      size='sm'
      className='ps-autopilot-btn'
      onClick={(e) => {
        e.stopPropagation()
        callAutoPilot(action, extras)
      }}
      disabled={loading !== null}
    >
      {loading === action ? (
        <Spinner as='span' animation='border' size='sm' />
      ) : (
        label
      )}
    </Button>
  )

  return (
    <div className='ps-autopilot-inline'>
      <div className='ps-autopilot-buttons'>
        {btn('check', '🔍 Check', 'outline-info')}
        {btn('test', '🧪 Test', 'outline-warning', { target_state: 'Testing' })}
        {btn('rollback', '⛔ Off', 'outline-danger', { target_state: 'Disabled' })}
      </div>
      {feedback && (
        <Alert
          variant={feedback.type}
          className='ps-autopilot-feedback'
          dismissible
          onClose={() => setFeedback(null)}
        >
          {feedback.message}
        </Alert>
      )}
    </div>
  )
}

export default AutoPilotControls
