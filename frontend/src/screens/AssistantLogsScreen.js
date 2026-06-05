import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { Table, Container, Alert, Row, Col, Button, Form, Badge } from 'react-bootstrap'

/**
 * Admin "Assistant Logs" dashboard (PLAN M4 / T4.4).
 * Route: /admin/assistant-logs (admin-only)
 *
 * Shows every assistant turn the privacy router handled: the message, detected
 * (masked) PII, the routing REASON, which model ran it (local vs cloud), the
 * answer, latency and cost. Summary cards prove the privacy/cost win: how many
 * turns stayed local and how many $ that saved vs an all-cloud baseline.
 *
 * GOTCHA (vs FeatureDashboard, which hits a PUBLIC endpoint): /api/chatlogs is
 * `protect, admin`, so EVERY fetch MUST send `Authorization: Bearer <token>`.
 */
const fmtUsd = (n) => `$${Number(n || 0).toFixed(4)}`

const AssistantLogsScreen = ({ history }) => {
  const [logs, setLogs] = useState([])
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin

  useEffect(() => {
    if (!userInfo || !userInfo.isAdmin) {
      history.push('/login')
    }
  }, [history, userInfo])

  const loadLogs = useCallback(
    (isPolling = false) => {
      if (!userInfo || !userInfo.token) return
      setError(null)
      if (!isPolling) setLoading(true)

      fetch('/api/chatlogs', {
        // GOTCHA 8: admin endpoint needs the bearer token or it 401s.
        headers: { Authorization: `Bearer ${userInfo.token}` },
      })
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`)
          return r.json()
        })
        .then((data) => {
          setLogs(data.logs || [])
          setSummary(data.summary || null)
          setLoading(false)
        })
        .catch((e) => {
          setError(e.message)
          setLoading(false)
        })
    },
    [userInfo]
  )

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(() => loadLogs(true), 3000)
    return () => clearInterval(id)
  }, [autoRefresh, loadLogs])

  const cards = useMemo(() => {
    if (!summary) return []
    return [
      { label: 'Total Turns', value: summary.total, icon: '💬' },
      { label: 'Local (private)', value: summary.localCount, icon: '🔒' },
      { label: 'Cloud', value: summary.cloudCount, icon: '☁️' },
      { label: 'Saved vs all-cloud', value: fmtUsd(summary.savedUsd), icon: '💰' },
    ]
  }, [summary])

  if (loading) {
    return (
      <Container className='py-3'>
        <h1>
          <span role='img' aria-label='robot'>🤖</span> Assistant Logs
        </h1>
        <p style={{ color: 'var(--ps-text-muted)' }}>Loading…</p>
      </Container>
    )
  }

  if (error && logs.length === 0) {
    return (
      <Container className='py-3'>
        <h1>
          <span role='img' aria-label='robot'>🤖</span> Assistant Logs
        </h1>
        <div className='ps-error-state' role='alert'>
          <p><strong>Failed to load assistant logs.</strong> {error}</p>
          <Button variant='outline-danger' onClick={() => loadLogs()}>Try again</Button>
        </div>
      </Container>
    )
  }

  return (
    <Container className='py-3'>
      <Row className='align-items-center' style={{ marginBottom: 16 }}>
        <Col>
          <h1 style={{ marginBottom: 4 }}>
            <span role='img' aria-label='robot'>🤖</span> Assistant Logs
          </h1>
          <p style={{ color: 'var(--ps-text-muted)', margin: 0, fontSize: 14 }}>
            Privacy router audit — PII turns stay on the local model (free); clean
            catalog turns go to cloud.
          </p>
        </Col>
        <Col xs='auto' className='d-flex align-items-center' style={{ gap: 8 }}>
          <Form.Check
            type='switch'
            id='logs-auto-refresh'
            label={autoRefresh ? '🔴 Live' : 'Auto'}
            checked={autoRefresh}
            onChange={() => setAutoRefresh(!autoRefresh)}
            style={{ fontSize: 13 }}
          />
          <Button variant='outline-primary' size='sm' onClick={() => loadLogs()}>↻ Refresh</Button>
        </Col>
      </Row>

      {/* Summary cards */}
      <Row style={{ marginBottom: 24 }}>
        {cards.map((c) => (
          <Col xs={6} md={3} key={c.label} style={{ marginBottom: 8 }}>
            <div className='ps-summary-card'>
              <div className='ps-summary-icon'>{c.icon}</div>
              <div className='ps-summary-number'>{c.value}</div>
              <div className='ps-summary-label'>{c.label}</div>
            </div>
          </Col>
        ))}
      </Row>

      {error && (
        <Alert variant='danger' style={{ marginBottom: 16 }}>
          Error refreshing logs: {error}
        </Alert>
      )}

      <Table className='ps-table' responsive striped hover size='sm'>
        <thead>
          <tr>
            <th>When</th>
            <th>User</th>
            <th>Message</th>
            <th>PII</th>
            <th>Reason</th>
            <th>Route</th>
            <th>Model</th>
            <th>Response</th>
            <th>Latency</th>
            <th>Cost</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr>
              <td colSpan='10'>
                <div className='ps-empty-state'>
                  <p>No assistant turns logged yet. Try the chat widget.</p>
                </div>
              </td>
            </tr>
          ) : (
            logs.map((log) => (
              <tr key={log._id}>
                <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                  {new Date(log.createdAt).toLocaleTimeString()}
                </td>
                <td style={{ fontSize: 12 }}>{log.userName}</td>
                <td style={{ maxWidth: 220 }}>{log.message}</td>
                <td>
                  {(log.detectedPII || []).length === 0 ? (
                    <span style={{ color: 'var(--ps-text-muted)' }}>—</span>
                  ) : (
                    log.detectedPII.map((p, i) => (
                      <Badge key={i} variant='warning' style={{ marginRight: 4 }}>
                        {p.type}:{p.masked}
                      </Badge>
                    ))
                  )}
                </td>
                <td style={{ maxWidth: 200, fontSize: 12 }}>{log.reason}</td>
                <td>
                  <Badge variant={log.route === 'local' ? 'success' : 'info'}>
                    {log.route === 'local' ? '🔒 local' : '☁️ cloud'}
                  </Badge>
                </td>
                <td style={{ fontSize: 12 }}>{log.model}</td>
                <td style={{ maxWidth: 260, fontSize: 12 }}>{log.response}</td>
                <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{log.latencyMs} ms</td>
                <td
                  style={{
                    whiteSpace: 'nowrap',
                    fontWeight: 600,
                    color: log.costUsd === 0 ? 'var(--ps-success)' : 'inherit',
                  }}
                >
                  {fmtUsd(log.costUsd)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </Container>
  )
}

export default AssistantLogsScreen
