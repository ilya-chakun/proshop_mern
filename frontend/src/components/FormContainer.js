import React from 'react'
import { Container, Row, Col } from 'react-bootstrap'

/**
 * Centered form container with design system card styling.
 * Used by Login, Register, and other auth screens.
 */
const FormContainer = ({ children }) => {
  return (
    <Container>
      <Row className='justify-content-md-center'>
        <Col xs={12} md={6}>
          <div
            style={{
              background: 'var(--ps-surface)',
              border: '1px solid var(--ps-border)',
              borderRadius: 'var(--ps-radius-md)',
              boxShadow: 'var(--ps-shadow-sm)',
              padding: 'var(--ps-space-4)',
              marginTop: 'var(--ps-space-4)',
            }}
          >
            {children}
          </div>
        </Col>
      </Row>
    </Container>
  )
}

export default FormContainer
