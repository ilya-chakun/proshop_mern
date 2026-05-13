import React, { useState } from 'react'
import { Form, Button } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import FormContainer from '../components/FormContainer'
import CheckoutSteps from '../components/CheckoutSteps'
import { saveShippingAddress } from '../actions/cartActions'

/**
 * Shipping address form with design system tokens.
 */
const ShippingScreen = ({ history }) => {
  const cart = useSelector((state) => state.cart)
  const { shippingAddress } = cart

  const [address, setAddress] = useState(shippingAddress.address)
  const [city, setCity] = useState(shippingAddress.city)
  const [postalCode, setPostalCode] = useState(shippingAddress.postalCode)
  const [country, setCountry] = useState(shippingAddress.country)

  const dispatch = useDispatch()

  const submitHandler = (e) => {
    e.preventDefault()
    dispatch(saveShippingAddress({ address, city, postalCode, country }))
    history.push('/payment')
  }

  return (
    <FormContainer>
      <CheckoutSteps step1 step2 />
      <h1
        style={{
          fontSize: 'var(--ps-text-xl)',
          fontWeight: 700,
          marginBottom: 'var(--ps-space-3)',
          textAlign: 'center',
        }}
      >
        Shipping
      </h1>
      <Form onSubmit={submitHandler}>
        <Form.Group controlId='address' style={{ marginBottom: 'var(--ps-space-2)' }}>
          <Form.Label style={{ fontWeight: 500 }}>Address</Form.Label>
          <Form.Control
            type='text'
            placeholder='Enter address'
            value={address}
            required
            onChange={(e) => setAddress(e.target.value)}
            aria-label='Shipping address'
            style={{ borderRadius: 'var(--ps-radius-sm)' }}
          />
        </Form.Group>

        <Form.Group controlId='city' style={{ marginBottom: 'var(--ps-space-2)' }}>
          <Form.Label style={{ fontWeight: 500 }}>City</Form.Label>
          <Form.Control
            type='text'
            placeholder='Enter city'
            value={city}
            required
            onChange={(e) => setCity(e.target.value)}
            aria-label='City'
            style={{ borderRadius: 'var(--ps-radius-sm)' }}
          />
        </Form.Group>

        <Form.Group controlId='postalCode' style={{ marginBottom: 'var(--ps-space-2)' }}>
          <Form.Label style={{ fontWeight: 500 }}>Postal Code</Form.Label>
          <Form.Control
            type='text'
            placeholder='Enter postal code'
            value={postalCode}
            required
            onChange={(e) => setPostalCode(e.target.value)}
            aria-label='Postal code'
            style={{ borderRadius: 'var(--ps-radius-sm)' }}
          />
        </Form.Group>

        <Form.Group controlId='country' style={{ marginBottom: 'var(--ps-space-3)' }}>
          <Form.Label style={{ fontWeight: 500 }}>Country</Form.Label>
          <Form.Control
            type='text'
            placeholder='Enter country'
            value={country}
            required
            onChange={(e) => setCountry(e.target.value)}
            aria-label='Country'
            style={{ borderRadius: 'var(--ps-radius-sm)' }}
          />
        </Form.Group>

        <Button
          type='submit'
          variant='primary'
          className='btn-block'
          style={{
            borderRadius: 'var(--ps-radius-sm)',
            padding: 'var(--ps-space-1) var(--ps-space-2)',
            fontWeight: 600,
          }}
        >
          Continue
        </Button>
      </Form>
    </FormContainer>
  )
}

export default ShippingScreen
