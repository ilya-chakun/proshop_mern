import React, { useEffect, useMemo, useState, useCallback } from 'react'
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
} from 'react-bootstrap'

const STATUS_OPTIONS = ['All', 'Enabled', 'Testing', 'Disabled']

/**
 * Maps a feature status string to a CSS badge class.
 * @param {string} status - One of 'Enabled', 'Testing', or 'Disabled'.
 * @returns {string} CSS class name for the badge.
 */
const badgeClass = (status) => {
  const map = {
    Enabled: 'ps-badge ps-badge-enabled',
    Testing: 'ps-badge ps-badge-testing',
    Disabled: 'ps-badge ps-badge-disabled',
  }
  return map[status] || 'ps-badge ps-badge-disabled'
}

/**
 * Renders a single skeleton table row for the loading state.
 * @param {object} props
 * @param {number} props.index - Row index for the key.
 * @returns {React.ReactElement}
 */
const SkeletonRow = ({ index }) => (
  <tr key={`skel-${index}`}>
    <td>
      <div className='ps-skeleton ps-skeleton-text' style={{ width: '80%' }} />
      <div className='ps-skeleton ps-skeleton-text-sm' style={{ width: '50%' }} />
    </td>
    <td><div className='ps-skeleton ps-skeleton-badge' /></td>
    <td><div className='ps-skeleton ps-skeleton-slider' /></td>
    <td><div className='ps-skeleton ps-skeleton-text-sm' style={{ width: '70%' }} /></td>
    <td><div className='ps-skeleton ps-skeleton-text-sm' style={{ width: '40%' }} /></td>
  </tr>
)

/**
 * Admin Feature Dashboard screen.
 * Displays feature flags from /api/feature-flags with search, filter,
 * status toggle, and traffic slider controls.
 *
 * Route: /admin/featuredashboard (admin-only)
 */
const FeatureDashboardScreen = ({ history }) => {
  const [features, setFeatures] = useState({})
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  /* Local overrides for UI-level changes (not persisted to backend) */
  const [statusOverrides, setStatusOverrides] = useState({})
  const [trafficOverrides, setTrafficOverrides] = useState({})

  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin

  useEffect(() => {
    if (!userInfo || !userInfo.isAdmin) {
      history.push('/login')
    }
  }, [history, userInfo])

  const loadFeatures = useCallback(() => {
    setError(null)
    setLoading(true)

    fetch('/api/feature-flags')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        setFeatures(data)
        setLoading(false)
      })
      .catch((fetchError) => {
        setError(fetchError.message)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    loadFeatures()
  }, [loadFeatures])

  const rows = useMemo(
    () =>
      Object.entries(features)
        .map(([key, feature]) => ({ key, ...feature }))
        .sort((left, right) => left.key.localeCompare(right.key)),
    [features]
  )

  const filteredRows = useMemo(() => {
    const searchValue = search.trim().toLowerCase()
    return rows.filter((feature) => {
      const effectiveStatus = statusOverrides[feature.key] || feature.status
      const matchesStatus =
        statusFilter === 'All' || effectiveStatus === statusFilter
      const haystack =
        `${feature.key} ${feature.name}`.toLowerCase()
      const matchesSearch = searchValue === '' || haystack.includes(searchValue)
      return matchesStatus && matchesSearch
    })
  }, [rows, search, statusFilter, statusOverrides])

  const summary = useMemo(() => {
    const counts = { total: 0, Enabled: 0, Testing: 0, Disabled: 0 }
    rows.forEach((feature) => {
      const effectiveStatus = statusOverrides[feature.key] || feature.status
      counts.total += 1
      counts[effectiveStatus] = (counts[effectiveStatus] || 0) + 1
    })
    return counts
  }, [rows, statusOverrides])

  const handleStatusChange = (key, newStatus) => {
    setStatusOverrides((prev) => ({ ...prev, [key]: newStatus }))
  }

  const handleTrafficChange = (key, value) => {
    setTrafficOverrides((prev) => ({ ...prev, [key]: Number(value) }))
  }

  const resetFilters = () => {
    setSearch('')
    setStatusFilter('All')
  }

  /* Announce filter results to screen readers */
  const resultCount = filteredRows.length

  /* ── Loading State ───────────────────────────────────── */
  if (loading) {
    return (
      <Container className='py-3'>
        <h1>Feature Dashboard</h1>
        <Table className='ps-table' responsive>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Traffic %</th>
              <th>Last Modified</th>
              <th>Dependencies</th>
            </tr>
          </thead>
          <tbody>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <SkeletonRow key={i} index={i} />
            ))}
          </tbody>
        </Table>
      </Container>
    )
  }

  /* ── Error State ─────────────────────────────────────── */
  if (error && rows.length === 0) {
    return (
      <Container className='py-3'>
        <h1>Feature Dashboard</h1>
        <div className='ps-error-state' role='alert'>
          <p style={{ marginBottom: 'var(--ps-space-2)' }}>
            <strong>Failed to load feature flags.</strong> {error}
          </p>
          <Button
            variant='outline-danger'
            onClick={loadFeatures}
            aria-label='Retry loading feature flags'
          >
            Try again
          </Button>
        </div>
      </Container>
    )
  }

  /* ── Main UI ─────────────────────────────────────────── */
  return (
    <Container className='py-3'>
      <Row className='align-items-center' style={{ marginBottom: 'var(--ps-space-3)' }}>
        <Col>
          <h1 style={{ marginBottom: 'var(--ps-space-1)' }}>Feature Dashboard</h1>
          {/* Inline summary stats — no colored-border cards */}
          <div className='ps-stats-bar' aria-label='Feature flag summary'>
            <span>
              Total: <strong>{summary.total}</strong>
            </span>
            <span>
              Enabled: <strong style={{ color: 'var(--ps-success)' }}>{summary.Enabled}</strong>
            </span>
            <span>
              Testing: <strong style={{ color: 'var(--ps-info)' }}>{summary.Testing}</strong>
            </span>
            <span>
              Disabled: <strong style={{ color: 'var(--ps-muted)' }}>{summary.Disabled}</strong>
            </span>
          </div>
        </Col>
        <Col xs='auto'>
          <Button
            variant='outline-primary'
            onClick={loadFeatures}
            aria-label='Refresh feature list'
          >
            Refresh
          </Button>
        </Col>
      </Row>

      {error && (
        <Alert variant='danger' style={{ marginBottom: 'var(--ps-space-2)' }}>
          Error loading feature flags: {error}
        </Alert>
      )}

      {/* Search + Filter */}
      <div
        className='ps-card'
        style={{ marginBottom: 'var(--ps-space-3)' }}
      >
        <Row className='align-items-end'>
          <Col md={8} style={{ marginBottom: 'var(--ps-space-2)' }}>
            <Form.Group controlId='featureSearch' style={{ marginBottom: 0 }}>
              <Form.Label className='small' style={{ color: 'var(--ps-text-muted)' }}>
                Search features
              </Form.Label>
              <Form.Control
                type='text'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='search_v2, checkout, stripe...'
                aria-label='Search features by name'
              />
            </Form.Group>
          </Col>
          <Col md={4} style={{ marginBottom: 'var(--ps-space-2)' }}>
            <Form.Label className='small' style={{ color: 'var(--ps-text-muted)' }}>
              Filter by status
            </Form.Label>
            <div>
              <ButtonGroup
                role='group'
                aria-label='Filter features by status'
              >
                {STATUS_OPTIONS.map((option) => (
                  <Button
                    key={option}
                    variant={
                      statusFilter === option ? 'primary' : 'outline-secondary'
                    }
                    size='sm'
                    onClick={() => setStatusFilter(option)}
                    aria-pressed={statusFilter === option}
                  >
                    {option}
                  </Button>
                ))}
              </ButtonGroup>
            </div>
          </Col>
        </Row>
      </div>

      {/* Screen reader live region for result count */}
      <div
        aria-live='polite'
        className='sr-only'
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
        }}
      >
        {resultCount} features shown
      </div>

      {/* Feature Table */}
      <Table className='ps-table' responsive>
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Traffic %</th>
            <th>Last Modified</th>
            <th>Dependencies</th>
          </tr>
        </thead>
        <tbody>
          {filteredRows.length === 0 ? (
            <tr>
              <td colSpan='5'>
                <div className='ps-empty-state'>
                  <p style={{ marginBottom: 'var(--ps-space-1)' }}>
                    No features match the current filters.
                  </p>
                  <Button
                    variant='link'
                    onClick={resetFilters}
                    style={{ color: 'var(--ps-primary)' }}
                  >
                    Reset filters
                  </Button>
                </div>
              </td>
            </tr>
          ) : (
            filteredRows.map((feature) => {
              const effectiveStatus =
                statusOverrides[feature.key] || feature.status
              const effectiveTraffic =
                trafficOverrides[feature.key] !== undefined
                  ? trafficOverrides[feature.key]
                  : feature.traffic_percentage

              return (
                <tr key={feature.key}>
                  {/* Name */}
                  <td>
                    <code style={{ fontSize: 'var(--ps-text-xs)' }}>
                      {feature.key}
                    </code>
                    <div
                      className='small'
                      style={{ color: 'var(--ps-text-muted)' }}
                    >
                      {feature.name}
                    </div>
                  </td>

                  {/* Status with dropdown */}
                  <td>
                    <span
                      className={badgeClass(effectiveStatus)}
                      role='status'
                      style={{ marginBottom: 'var(--ps-space-1)', display: 'inline-block' }}
                    >
                      {effectiveStatus}
                    </span>
                    <Form.Control
                      as='select'
                      size='sm'
                      value={effectiveStatus}
                      onChange={(e) =>
                        handleStatusChange(feature.key, e.target.value)
                      }
                      aria-label={`Change status for ${feature.name}`}
                      style={{
                        width: '120px',
                        fontSize: 'var(--ps-text-xs)',
                        marginTop: '4px',
                      }}
                    >
                      <option value='Disabled'>Disabled</option>
                      <option value='Testing'>Testing</option>
                      <option value='Enabled'>Enabled</option>
                    </Form.Control>
                  </td>

                  {/* Traffic Slider */}
                  <td>
                    <div className='d-flex align-items-center'>
                      <input
                        type='range'
                        className='ps-range'
                        min='0'
                        max='100'
                        value={effectiveTraffic}
                        onChange={(e) =>
                          handleTrafficChange(feature.key, e.target.value)
                        }
                        aria-label={`Traffic percentage for ${feature.name}`}
                        aria-valuetext={`${effectiveTraffic} percent`}
                        style={{ width: '100px' }}
                      />
                      <span
                        className='ml-2'
                        style={{
                          minWidth: '40px',
                          fontSize: 'var(--ps-text-xs)',
                          fontWeight: 500,
                        }}
                      >
                        {effectiveTraffic}%
                      </span>
                    </div>
                  </td>

                  {/* Last Modified */}
                  <td style={{ fontSize: 'var(--ps-text-xs)', color: 'var(--ps-text-muted)' }}>
                    {feature.last_modified}
                  </td>

                  {/* Dependencies */}
                  <td>
                    {(feature.dependencies || []).length === 0 ? (
                      <span style={{ color: 'var(--ps-text-muted)' }}>—</span>
                    ) : (
                      (feature.dependencies || []).map((dep) => (
                        <span
                          key={dep}
                          className='ps-badge ps-badge-disabled'
                          style={{
                            marginRight: 'var(--ps-space-1)',
                            fontSize: '12px',
                          }}
                        >
                          {dep}
                        </span>
                      ))
                    )}
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </Table>
    </Container>
  )
}

export default FeatureDashboardScreen
