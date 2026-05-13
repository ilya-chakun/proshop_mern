import React, { useState } from 'react'
import { Form, Button, Col } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import FormContainer from '../components/FormContainer'
import CheckoutSteps from '../components/CheckoutSteps'
import { savePaymentMethod } from '../actions/cartActions'

/**
 * Payment method selection with design system tokens.
 */
const PaymentScreen = ({ history }) => {
  const cart = useSelector((state) => state.cart)
  const { shippingAddress } = cart

  if (!shippingAddress.address) {
    history.push('/shipping')
  }

  const [paymentMethod, setPaymentMethod] = useState('PayPal')

  const dispatch = useDispatch()

  const submitHandler = (e) => {
    e.preventDefault()
    dispatch(savePaymentMethod(paymentMethod))
    history.push('/placeorder')
  }

  return (
    <FormContainer>
      <CheckoutSteps step1 step2 step3 />
      <h1
        style={{
          fontSize: 'var(--ps-text-xl)',
          fontWeight: 700,
          marginBottom: 'var(--ps-space-3)',
          textAlign: 'center',
        }}
      >
        Payment Method
      </h1>
      <Form onSubmit={submitHandler}>
        <Form.Group style={{ marginBottom: 'var(--ps-space-3)' }}>
          <Form.Label
            as='legend'
            style={{ fontWeight: 500, marginBottom: 'var(--ps-space-1)' }}
          >
            Select Method
          </Form.Label>
          <Col style={{ paddingLeft: 0 }}>
            <Form.Check
              type='radio'
              label='PayPal or Credit Card'
              id='PayPal'
              name='paymentMethod'
              value='PayPal'
              checked
              onChange={(e) => setPaymentMethod(e.target.value)}
              aria-label='PayPal or Credit Card'
            />
          </Col>
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

export default PaymentScreen
