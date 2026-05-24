import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useSelector } from 'react-redux'
import {
  Table,
  Container,
  Alert,
  Row,
  Col,
  Form,
  Button,
  ButtonGroup,
  Pagination,
} from 'react-bootstrap'
import AutoPilotControls from '../components/AutoPilotControls'

const STATUS_OPTIONS = ['All', 'Enabled', 'Testing', 'Disabled']
const PAGE_SIZE = 6

/**
 * Maps a feature status string to a CSS badge class.
 * @param {string} status
 * @returns {string}
 */
const badgeClass = (status) => {
  const map = {
    Enabled: 'ps-badge ps-badge-enabled',
    Testing: 'ps-badge ps-badge-testing',
    Disabled: 'ps-badge ps-badge-disabled',
  }
  return map[status] || 'ps-badge ps-badge-disabled'
}

/** Status emoji prefix */
const statusEmoji = (s) =>
  s === 'Enabled' ? '✅ ' : s === 'Testing' ? '🧪 ' : '⛔ '

/** Left-border color for table row */
const rowBorderColor = (s) =>
  s === 'Enabled'
    ? 'var(--ps-success)'
    : s === 'Testing'
    ? 'var(--ps-info)'
    : 'var(--ps-border)'

/**
 * Skeleton row for loading state.
 */
const SkeletonRow = ({ index }) => (
  <tr key={`skel-${index}`}>
    <td><div className='ps-skeleton ps-skeleton-text' style={{ width: '80%' }} /></td>
    <td><div className='ps-skeleton ps-skeleton-badge' /></td>
    <td><div className='ps-skeleton ps-skeleton-slider' /></td>
    <td><div className='ps-skeleton ps-skeleton-text-sm' style={{ width: '40%' }} /></td>
  </tr>
)

/**
 * Admin Feature Dashboard screen.
 * Route: /admin/featuredashboard (admin-only)
 */
const FeatureDashboardScreen = ({ history }) => {
  const [features, setFeatures] = useState({})
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [activityLog, setActivityLog] = useState([])
  const [changedKeys, setChangedKeys] = useState({})
  const [autoRefresh, setAutoRefresh] = useState(true)
  const prevFeaturesRef = useRef({})

  const [statusOverrides, setStatusOverrides] = useState({})
  const [trafficOverrides, setTrafficOverrides] = useState({})

  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin

  useEffect(() => {
    if (!userInfo || !userInfo.isAdmin) {
      history.push('/login')
    }
  }, [history, userInfo])

  const loadFeatures = useCallback((isPolling = false) => {
    setError(null)
    if (!isPolling) setLoading(true)

    fetch('/api/feature-flags')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => {
        /* Detect which features changed since last load */
        const prev = prevFeaturesRef.current
        const changed = {}
        Object.entries(data).forEach(([key, f]) => {
          const old = prev[key]
          if (old && (old.status !== f.status || old.traffic_percentage !== f.traffic_percentage)) {
            changed[key] = true
            /* Auto-log the change */
            setActivityLog((log) => [
              {
                time: new Date().toLocaleTimeString(),
                feature: key,
                message: old.status !== f.status
                  ? `Status: ${old.status} → ${f.status}`
                  : `Traffic: ${old.traffic_percentage}% → ${f.traffic_percentage}%`,
              },
              ...log,
            ].slice(0, 20))
          }
        })
        if (Object.keys(changed).length > 0) {
          setChangedKeys(changed)
          setTimeout(() => setChangedKeys({}), 2000)
        }
        prevFeaturesRef.current = data
        setFeatures(data)
        setLoading(false)
      })
      .catch((e) => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    loadFeatures()
  }, [loadFeatures])

  /* Auto-refresh every 3s when enabled */
  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(() => loadFeatures(true), 3000)
    return () => clearInterval(id)
  }, [autoRefresh, loadFeatures])

  const rows = useMemo(
    () =>
      Object.entries(features)
        .map(([key, feature]) => ({ key, ...feature }))
        .sort((a, b) => a.key.localeCompare(b.key)),
    [features]
  )

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((f) => {
      const status = statusOverrides[f.key] || f.status
      if (statusFilter !== 'All' && status !== statusFilter) return false
      if (q && !`${f.key} ${f.name} ${f.description || ''}`.toLowerCase().includes(q))
        return false
      return true
    })
  }, [rows, search, statusFilter, statusOverrides])

  /* Pagination */
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const page = Math.min(currentPage, totalPages)
  const pagedRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  /* Reset page on filter change */
  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter])

  const summary = useMemo(() => {
    const c = { total: 0, Enabled: 0, Testing: 0, Disabled: 0 }
    rows.forEach((f) => {
      const s = statusOverrides[f.key] || f.status
      c.total += 1
      c[s] = (c[s] || 0) + 1
    })
    return c
  }, [rows, statusOverrides])

  const handleStatusChange = (key, s) => {
    setStatusOverrides((p) => ({ ...p, [key]: s }))
  }

  const handleTrafficChange = (key, v) => {
    setTrafficOverrides((p) => ({ ...p, [key]: Number(v) }))
  }

  /** Add entry to activity log (from AutoPilotControls callback) */
  const addActivity = useCallback((entry) => {
    setActivityLog((prev) => [entry, ...prev].slice(0, 10))
  }, [])

  const resetFilters = () => {
    setSearch('')
    setStatusFilter('All')
  }

  /* ── Loading ─────────────────────────────────────── */
  if (loading) {
    return (
      <Container className='py-3'>
        <h1>🚩 Feature Flag Dashboard</h1>
        <Table className='ps-table' responsive>
          <thead>
            <tr>
              <th>Feature</th><th>Status</th><th>Traffic</th><th>Modified</th>
            </tr>
          </thead>
          <tbody>
            {[0, 1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} index={i} />)}
          </tbody>
        </Table>
      </Container>
    )
  }

  /* ── Error ───────────────────────────────────────── */
  if (error && rows.length === 0) {
    return (
      <Container className='py-3'>
        <h1>🚩 Feature Flag Dashboard</h1>
        <div className='ps-error-state' role='alert'>
          <p><strong>Failed to load feature flags.</strong> {error}</p>
          <Button variant='outline-danger' onClick={loadFeatures}>Try again</Button>
        </div>
      </Container>
    )
  }

  /* ── Main ────────────────────────────────────────── */
  return (
    <Container className='py-3'>
      {/* Header */}
      <Row className='align-items-center' style={{ marginBottom: 16 }}>
        <Col>
          <h1 style={{ marginBottom: 4 }}>🚩 Feature Flag Dashboard</h1>
          <p style={{ color: 'var(--ps-text-muted)', margin: 0, fontSize: 14 }}>
            Manage feature flags with AI-powered Auto-Pilot
          </p>
        </Col>
        <Col xs='auto' className='d-flex align-items-center' style={{ gap: 8 }}>
          <Form.Check
            type='switch'
            id='auto-refresh-switch'
            label={autoRefresh ? '🔴 Live' : 'Auto'}
            checked={autoRefresh}
            onChange={() => setAutoRefresh(!autoRefresh)}
            style={{ fontSize: 13 }}
          />
          <Button variant='outline-primary' size='sm' onClick={() => loadFeatures()}>↻ Refresh</Button>
        </Col>
      </Row>

      {/* ── Summary Cards ────────────────────────── */}
      <Row style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Features', count: summary.total, cls: 'ps-summary-total', icon: '📊' },
          { label: 'Enabled', count: summary.Enabled, cls: 'ps-summary-enabled', icon: '✅' },
          { label: 'Testing', count: summary.Testing, cls: 'ps-summary-testing', icon: '🧪' },
          { label: 'Disabled', count: summary.Disabled, cls: 'ps-summary-disabled', icon: '⛔' },
        ].map((c) => (
          <Col xs={6} md={3} key={c.label} style={{ marginBottom: 8 }}>
            <div className={`ps-summary-card ${c.cls}`}>
              <div className='ps-summary-icon'>{c.icon}</div>
              <div className='ps-summary-number'>{c.count}</div>
              <div className='ps-summary-label'>{c.label}</div>
              {c.label !== 'Total Features' && summary.total > 0 && (
                <div className='ps-summary-pct'>
                  {Math.round((c.count / summary.total) * 100)}%
                </div>
              )}
            </div>
          </Col>
        ))}
      </Row>

      {error && (
        <Alert variant='danger' style={{ marginBottom: 16 }}>
          Error loading feature flags: {error}
        </Alert>
      )}

      {/* ── Search + Filter ──────────────────────── */}
      <div className='ps-card' style={{ marginBottom: 24 }}>
        <Row className='align-items-end'>
          <Col md={8} style={{ marginBottom: 8 }}>
            <Form.Group controlId='featureSearch' style={{ marginBottom: 0 }}>
              <Form.Label className='small' style={{ color: 'var(--ps-text-muted)' }}>
                Search features
              </Form.Label>
              <Form.Control
                type='text'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='search_v2, checkout, stripe...'
              />
            </Form.Group>
          </Col>
          <Col md={4} style={{ marginBottom: 8 }}>
            <Form.Label className='small' style={{ color: 'var(--ps-text-muted)' }}>
              Filter by status
            </Form.Label>
            <div>
              <ButtonGroup>
                {STATUS_OPTIONS.map((opt) => (
                  <Button
                    key={opt}
                    variant={statusFilter === opt ? 'primary' : 'outline-secondary'}
                    size='sm'
                    onClick={() => setStatusFilter(opt)}
                  >
                    {opt}
                  </Button>
                ))}
              </ButtonGroup>
            </div>
          </Col>
        </Row>
      </div>

      {/* ── Feature Table ────────────────────────── */}
      <Table className='ps-table' responsive>
        <thead>
          <tr>
            <th style={{ width: '35%' }}>Feature</th>
            <th>Status</th>
            <th>Traffic</th>
            <th>🤖 AI</th>
            <th>Modified</th>
          </tr>
        </thead>
        <tbody>
          {pagedRows.length === 0 ? (
            <tr>
              <td colSpan='5'>
                <div className='ps-empty-state'>
                  <p>No features match the current filters.</p>
                  <Button variant='link' onClick={resetFilters}>Reset filters</Button>
                </div>
              </td>
            </tr>
          ) : (
            pagedRows.map((feature) => {
              const effectiveStatus = statusOverrides[feature.key] || feature.status
              const effectiveTraffic =
                trafficOverrides[feature.key] !== undefined
                  ? trafficOverrides[feature.key]
                  : feature.traffic_percentage
              return (
                <tr
                  key={feature.key}
                  className={changedKeys[feature.key] ? 'ps-row-flash' : ''}
                  style={{
                    cursor: 'pointer',
                    borderLeft: `4px solid ${rowBorderColor(effectiveStatus)}`,
                  }}
                >
                  {/* Feature name + description */}
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>
                      {feature.name || feature.key}
                    </div>
                    <code style={{ fontSize: 11, color: 'var(--ps-text-muted)' }}>
                      {feature.key}
                    </code>
                    {feature.description && (
                      <div
                        className='ps-feature-desc'
                        title={feature.description}
                      >
                        {feature.description.length > 90
                          ? feature.description.slice(0, 90) + '…'
                          : feature.description}
                      </div>
                    )}
                    {(feature.dependencies || []).length > 0 && (
                      <div style={{ marginTop: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--ps-text-muted)' }}>deps: </span>
                        {feature.dependencies.map((dep) => (
                          <span key={dep} className='ps-dep-badge'>{dep}</span>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Status badge + selector */}
                  <td>
                    <span
                      className={badgeClass(effectiveStatus)}
                      style={{ fontSize: 13, padding: '4px 10px', display: 'inline-block', marginBottom: 4 }}
                    >
                      {statusEmoji(effectiveStatus)}{effectiveStatus}
                    </span>
                    <Form.Control
                      as='select'
                      size='sm'
                      value={effectiveStatus}
                      onChange={(e) => handleStatusChange(feature.key, e.target.value)}
                      style={{ width: 110, fontSize: 12 }}
                    >
                      <option value='Disabled'>Disabled</option>
                      <option value='Testing'>Testing</option>
                      <option value='Enabled'>Enabled</option>
                    </Form.Control>
                  </td>

                  {/* Traffic bar + slider */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div className='ps-traffic-bar'>
                        <div
                          className='ps-traffic-fill'
                          style={{
                            width: `${effectiveTraffic}%`,
                            background:
                              effectiveTraffic > 50
                                ? 'var(--ps-success)'
                                : effectiveTraffic > 0
                                ? 'var(--ps-info)'
                                : 'var(--ps-border)',
                          }}
                        />
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 14, minWidth: 36 }}>
                        {effectiveTraffic}%
                      </span>
                    </div>
                    <input
                      type='range'
                      className='ps-range'
                      min='0' max='100'
                      value={effectiveTraffic}
                      onChange={(e) => handleTrafficChange(feature.key, e.target.value)}
                      style={{ width: 90, marginTop: 4 }}
                    />
                  </td>

                  {/* AI Auto-Pilot */}
                  <td onClick={(e) => e.stopPropagation()} style={{ minWidth: 140 }}>
                    <AutoPilotControls
                      feature={feature}
                      onUpdate={(result) => {
                        addActivity({
                          time: new Date().toLocaleTimeString(),
                          feature: feature.key,
                          message: typeof result === 'string' ? result : 'Action completed',
                        })
                        loadFeatures()
                      }}
                    />
                  </td>

                  {/* Last modified */}
                  <td style={{ fontSize: 12, color: 'var(--ps-text-muted)', whiteSpace: 'nowrap' }}>
                    {feature.last_modified}
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </Table>

      {/* ── Pagination ───────────────────────────── */}
      {totalPages > 1 && (
        <div className='d-flex justify-content-between align-items-center' style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: 'var(--ps-text-muted)' }}>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredRows.length)} of {filteredRows.length}
          </span>
          <Pagination size='sm' className='mb-0'>
            <Pagination.Prev
              disabled={page <= 1}
              onClick={() => setCurrentPage(page - 1)}
            />
            {[...Array(totalPages)].map((_, i) => (
              <Pagination.Item
                key={i + 1}
                active={page === i + 1}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </Pagination.Item>
            ))}
            <Pagination.Next
              disabled={page >= totalPages}
              onClick={() => setCurrentPage(page + 1)}
            />
          </Pagination>
        </div>
      )}

      {/* ── Activity Feed ────────────────────────── */}
      {activityLog.length > 0 && (
        <div className='ps-activity-feed' style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 8 }}>
            📋 Activity Log
          </h3>
          {activityLog.map((entry, i) => (
            <div key={i} className='ps-activity-entry'>
              <span className='ps-activity-time'>{entry.time}</span>
              <code className='ps-activity-feature'>{entry.feature}</code>
              <span className='ps-activity-msg'>{entry.message}</span>
            </div>
          ))}
        </div>
      )}
    </Container>
  )
}

export default FeatureDashboardScreen
