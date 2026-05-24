import React, { useState } from 'react'
import { Card, Button, Alert, Spinner } from 'react-bootstrap'

const N8N_URL = process.env.REACT_APP_N8N_WEBHOOK_URL
const N8N_API_KEY = process.env.REACT_APP_N8N_API_KEY

/**
 * Auto-Pilot Controls for a selected feature flag.
 * Sends commands to n8n WF1 webhook and displays agent feedback.
 *
 * @param {object} props
 * @param {object} props.feature - Feature object with key, name, status fields.
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

  if (!feature) {
    return null
  }

  return (
    <Card className='mt-3'>
      <Card.Body>
        <Card.Title>
          Auto-Pilot Controls:{' '}
          <code>{feature.key}</code>
        </Card.Title>

        <div className='d-flex' style={{ gap: '8px', flexWrap: 'wrap' }}>
          <Button
            variant='info'
            size='sm'
            onClick={() => callAutoPilot('check')}
            disabled={loading !== null}
          >
            {loading === 'check' ? (
              <><Spinner as='span' animation='border' size='sm' /> Checking...</>
            ) : (
              'Run Check'
            )}
          </Button>

          <Button
            variant='warning'
            size='sm'
            onClick={() => callAutoPilot('test', { target_state: 'Testing' })}
            disabled={loading !== null}
          >
            {loading === 'test' ? (
              <><Spinner as='span' animation='border' size='sm' /> Enabling...</>
            ) : (
              'Test Mode'
            )}
          </Button>

          <Button
            variant='danger'
            size='sm'
            onClick={() => callAutoPilot('rollback', { target_state: 'Disabled' })}
            disabled={loading !== null}
          >
            {loading === 'rollback' ? (
              <><Spinner as='span' animation='border' size='sm' /> Rolling back...</>
            ) : (
              'Rollback Feature'
            )}
          </Button>
        </div>

        {feedback && (
          <Alert
            variant={feedback.type}
            className='mt-2 mb-0'
            dismissible
            onClose={() => setFeedback(null)}
          >
            {feedback.message}
          </Alert>
        )}
      </Card.Body>
    </Card>
  )
}

export default AutoPilotControls
