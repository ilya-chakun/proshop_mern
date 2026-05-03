import React, { useEffect, useMemo, useState, useCallback } from 'react'
import {
  Table,
  Badge,
  Container,
  Spinner,
  Alert,
  Row,
  Col,
  Card,
  Form,
  Button,
} from 'react-bootstrap'

const STATUS_OPTIONS = ['All', 'Enabled', 'Testing', 'Disabled']

const FeaturesListScreen = () => {
  const [features, setFeatures] = useState({})
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const loadFeatures = useCallback((isRefresh = false) => {
    setError(null)
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

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
        setRefreshing(false)
      })
      .catch((fetchError) => {
        setError(fetchError.message)
        setLoading(false)
        setRefreshing(false)
      })
  }, [])

  useEffect(() => {
    loadFeatures()
  }, [loadFeatures])

  const statusVariant = (status) =>
    status === 'Enabled' ? 'success' : status === 'Testing' ? 'warning' : 'secondary'

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
      const matchesStatus = statusFilter === 'All' || feature.status === statusFilter
      const haystack = `${feature.key} ${feature.name} ${(feature.dependencies || []).join(' ')}`.toLowerCase()
      const matchesSearch = searchValue === '' || haystack.includes(searchValue)
      return matchesStatus && matchesSearch
    })
  }, [rows, search, statusFilter])

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, feature) => {
        acc.total += 1
        acc[feature.status] = (acc[feature.status] || 0) + 1
        if ((feature.dependencies || []).length > 0) {
          acc.withDependencies += 1
        }
        return acc
      },
      { total: 0, Enabled: 0, Testing: 0, Disabled: 0, withDependencies: 0 }
    )
  }, [rows])

  if (loading) {
    return (
      <Container className='py-3'>
        <Spinner animation='border' /> Loading…
      </Container>
    )
  }

  return (
    <Container className='py-3'>
      <Row className='align-items-center mb-3'>
        <Col md={8}>
          <h1 className='mb-1'>Feature Flags</h1>
          <p className='text-muted mb-0'>
            Live runtime snapshot from <code>backend/features.json</code> via{' '}
            <code>GET /api/feature-flags</code>.
          </p>
        </Col>
        <Col md={4} className='text-md-right mt-3 mt-md-0'>
          <Button variant='outline-primary' onClick={() => loadFeatures(true)} disabled={refreshing}>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
        </Col>
      </Row>

      {error && (
        <Alert variant='danger' className='mb-3'>
          Error loading feature flags: {error}
        </Alert>
      )}

      <Row className='mb-3'>
        <Col md={3} sm={6} className='mb-3'>
          <Card body>
            <div className='text-muted small'>Total flags</div>
            <div className='h3 mb-0'>{summary.total}</div>
          </Card>
        </Col>
        <Col md={3} sm={6} className='mb-3'>
          <Card body>
            <div className='text-muted small'>Enabled</div>
            <div className='h3 mb-0 text-success'>{summary.Enabled}</div>
          </Card>
        </Col>
        <Col md={3} sm={6} className='mb-3'>
          <Card body>
            <div className='text-muted small'>Testing</div>
            <div className='h3 mb-0 text-warning'>{summary.Testing}</div>
          </Card>
        </Col>
        <Col md={3} sm={6} className='mb-3'>
          <Card body>
            <div className='text-muted small'>With dependencies</div>
            <div className='h3 mb-0'>{summary.withDependencies}</div>
          </Card>
        </Col>
      </Row>

      <Card className='mb-3'>
        <Card.Body>
          <Row>
            <Col md={8} className='mb-3 mb-md-0'>
              <Form.Group controlId='featureSearch' className='mb-0'>
                <Form.Label className='small text-muted'>Search by key, label, or dependency</Form.Label>
                <Form.Control
                  type='text'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder='semantic_search, checkout, stripe…'
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId='statusFilter' className='mb-0'>
                <Form.Label className='small text-muted'>Status</Form.Label>
                <Form.Control
                  as='select'
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Table striped hover responsive>
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Traffic %</th>
            <th>Last modified</th>
            <th>Dependencies</th>
          </tr>
        </thead>
        <tbody>
          {filteredRows.length === 0 ? (
            <tr>
              <td colSpan='5' className='text-center text-muted py-4'>
                No feature flags match the current filters.
              </td>
            </tr>
          ) : (
            filteredRows.map((feature) => (
              <tr key={feature.key}>
                <td>
                  <code>{feature.key}</code>
                  <div className='small text-muted'>{feature.name}</div>
                </td>
                <td>
                  <Badge variant={statusVariant(feature.status)}>{feature.status}</Badge>
                </td>
                <td>{feature.traffic_percentage}%</td>
                <td>{feature.last_modified}</td>
                <td>
                  {(feature.dependencies ?? []).length === 0 ? (
                    <span className='text-muted'>—</span>
                  ) : (
                    (feature.dependencies ?? []).map((dependency) => (
                      <Badge key={dependency} variant='light' className='mr-1 mb-1'>
                        <code>{dependency}</code>
                      </Badge>
                    ))
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      <p className='text-muted mt-3 mb-0'>
        <small>
          Source of truth: <code>backend/features.json</code>. Runtime changes come from the feature-flags MCP
          server and become visible here after refresh.
        </small>
      </p>
    </Container>
  )
}

export default FeaturesListScreen
