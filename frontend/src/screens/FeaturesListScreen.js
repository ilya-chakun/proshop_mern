import React, { useEffect, useState } from 'react'
import { Table, Badge, Container, Spinner, Alert } from 'react-bootstrap'

const FeaturesListScreen = () => {
  const [features, setFeatures] = useState({})
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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

  const statusVariant = (status) =>
    status === 'Enabled' ? 'success' : status === 'Testing' ? 'warning' : 'secondary'

  if (loading) {
    return (
      <Container className='py-3'>
        <Spinner animation='border' /> Loading…
      </Container>
    )
  }

  if (error) {
    return (
      <Container className='py-3'>
        <Alert variant='danger'>Error: {error}</Alert>
      </Container>
    )
  }

  return (
    <Container className='py-3'>
      <h1>Feature Flags</h1>
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
          {Object.entries(features).map(([key, feature]) => (
            <tr key={key}>
              <td>
                <code>{key}</code>
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
                    <code key={dependency} className='mr-1'>
                      {dependency}
                    </code>
                  ))
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <p className='text-muted mt-3'>
        <small>
          Source: <code>GET /api/feature-flags</code> → reads <code>backend/features.json</code>{' '}
          on every request. Mutated by the feature-flags MCP server (M3 homework).
        </small>
      </p>
    </Container>
  )
}

export default FeaturesListScreen
