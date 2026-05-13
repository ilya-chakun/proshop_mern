import React from 'react'
import { Nav } from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap'

/**
 * Checkout progress indicator with design system tokens.
 */
const CheckoutSteps = ({ step1, step2, step3, step4 }) => {
  const activeStyle = {
    color: 'var(--ps-primary)',
    fontWeight: 600,
  }

  return (
    <Nav
      className='justify-content-center'
      style={{ marginBottom: 'var(--ps-space-4)' }}
    >
      <Nav.Item>
        {step1 ? (
          <LinkContainer to='/login'>
            <Nav.Link style={activeStyle}>Sign In</Nav.Link>
          </LinkContainer>
        ) : (
          <Nav.Link disabled style={{ color: 'var(--ps-text-muted)' }}>
            Sign In
          </Nav.Link>
        )}
      </Nav.Item>

      <Nav.Item>
        {step2 ? (
          <LinkContainer to='/shipping'>
            <Nav.Link style={activeStyle}>Shipping</Nav.Link>
          </LinkContainer>
        ) : (
          <Nav.Link disabled style={{ color: 'var(--ps-text-muted)' }}>
            Shipping
          </Nav.Link>
        )}
      </Nav.Item>

      <Nav.Item>
        {step3 ? (
          <LinkContainer to='/payment'>
            <Nav.Link style={activeStyle}>Payment</Nav.Link>
          </LinkContainer>
        ) : (
          <Nav.Link disabled style={{ color: 'var(--ps-text-muted)' }}>
            Payment
          </Nav.Link>
        )}
      </Nav.Item>

      <Nav.Item>
        {step4 ? (
          <LinkContainer to='/placeorder'>
            <Nav.Link style={activeStyle}>Place Order</Nav.Link>
          </LinkContainer>
        ) : (
          <Nav.Link disabled style={{ color: 'var(--ps-text-muted)' }}>
            Place Order
          </Nav.Link>
        )}
      </Nav.Item>
    </Nav>
  )
}

export default CheckoutSteps
