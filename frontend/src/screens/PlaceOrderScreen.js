import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button, Row, Col, ListGroup, Image, Card } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import Message from '../components/Message'
import CheckoutSteps from '../components/CheckoutSteps'
import { createOrder } from '../actions/orderActions'
import { ORDER_CREATE_RESET } from '../constants/orderConstants'
import { USER_DETAILS_RESET } from '../constants/userConstants'

/**
 * Order review & placement screen with design system tokens.
 */
const PlaceOrderScreen = ({ history }) => {
  const dispatch = useDispatch()

  const cart = useSelector((state) => state.cart)

  if (!cart.shippingAddress.address) {
    history.push('/shipping')
  } else if (!cart.paymentMethod) {
    history.push('/payment')
  }

  const addDecimals = (num) => {
    return (Math.round(num * 100) / 100).toFixed(2)
  }

  cart.itemsPrice = addDecimals(
    cart.cartItems.reduce((acc, item) => acc + item.price * item.qty, 0)
  )
  cart.shippingPrice = addDecimals(cart.itemsPrice > 100 ? 0 : 100)
  cart.taxPrice = addDecimals(Number((0.15 * cart.itemsPrice).toFixed(2)))
  cart.totalPrice = (
    Number(cart.itemsPrice) +
    Number(cart.shippingPrice) +
    Number(cart.taxPrice)
  ).toFixed(2)

  const orderCreate = useSelector((state) => state.orderCreate)
  const { order, success, error } = orderCreate

  useEffect(() => {
    if (success) {
      history.push(`/order/${order._id}`)
      dispatch({ type: USER_DETAILS_RESET })
      dispatch({ type: ORDER_CREATE_RESET })
    }
    // eslint-disable-next-line
  }, [history, success])

  const placeOrderHandler = () => {
    dispatch(
      createOrder({
        orderItems: cart.cartItems,
        shippingAddress: cart.shippingAddress,
        paymentMethod: cart.paymentMethod,
        itemsPrice: cart.itemsPrice,
        shippingPrice: cart.shippingPrice,
        taxPrice: cart.taxPrice,
        totalPrice: cart.totalPrice,
      })
    )
  }

  return (
    <>
      <CheckoutSteps step1 step2 step3 step4 />
      <Row>
        <Col md={8}>
          <ListGroup variant='flush'>
            <ListGroup.Item style={{ padding: 'var(--ps-space-2) 0' }}>
              <h2>Shipping</h2>
              <p style={{ color: 'var(--ps-text-muted)', margin: 0 }}>
                {cart.shippingAddress.address}, {cart.shippingAddress.city}{' '}
                {cart.shippingAddress.postalCode},{' '}
                {cart.shippingAddress.country}
              </p>
            </ListGroup.Item>

            <ListGroup.Item style={{ padding: 'var(--ps-space-2) 0' }}>
              <h2>Payment Method</h2>
              <p style={{ color: 'var(--ps-text-muted)', margin: 0 }}>
                {cart.paymentMethod}
              </p>
            </ListGroup.Item>

            <ListGroup.Item style={{ padding: 'var(--ps-space-2) 0' }}>
              <h2>Order Items</h2>
              {cart.cartItems.length === 0 ? (
                <div className='ps-empty-state'>Your cart is empty</div>
              ) : (
                <ListGroup variant='flush'>
                  {cart.cartItems.map((item, index) => (
                    <ListGroup.Item
                      key={index}
                      style={{ padding: 'var(--ps-space-1) 0' }}
                    >
                      <Row className='align-items-center'>
                        <Col md={1}>
                          <Image
                            src={item.image}
                            alt={item.name}
                            fluid
                            rounded
                            style={{ borderRadius: 'var(--ps-radius-sm)' }}
                          />
                        </Col>
                        <Col>
                          <Link
                            to={`/product/${item.product}`}
                            style={{ color: 'var(--ps-primary)', fontWeight: 500 }}
                          >
                            {item.name}
                          </Link>
                        </Col>
                        <Col md={4} style={{ fontWeight: 500 }}>
                          {item.qty} x ${item.price} = $
                          {(item.qty * item.price).toFixed(2)}
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </ListGroup.Item>
          </ListGroup>
        </Col>
        <Col md={4}>
          <Card
            className='ps-card'
            style={{ padding: 'var(--ps-space-3)' }}
          >
            <ListGroup variant='flush'>
              <ListGroup.Item style={{ border: 'none', padding: '0 0 var(--ps-space-2) 0' }}>
                <h2 style={{ margin: 0 }}>Order Summary</h2>
              </ListGroup.Item>
              <ListGroup.Item style={{ padding: 'var(--ps-space-1) 0' }}>
                <Row>
                  <Col>Items</Col>
                  <Col style={{ fontWeight: 600, textAlign: 'right' }}>${cart.itemsPrice}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item style={{ padding: 'var(--ps-space-1) 0' }}>
                <Row>
                  <Col>Shipping</Col>
                  <Col style={{ fontWeight: 600, textAlign: 'right' }}>${cart.shippingPrice}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item style={{ padding: 'var(--ps-space-1) 0' }}>
                <Row>
                  <Col>Tax</Col>
                  <Col style={{ fontWeight: 600, textAlign: 'right' }}>${cart.taxPrice}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item
                style={{
                  padding: 'var(--ps-space-2) 0',
                  borderTop: '2px solid var(--ps-border)',
                }}
              >
                <Row>
                  <Col style={{ fontWeight: 700, fontSize: 'var(--ps-text-md)' }}>Total</Col>
                  <Col
                    style={{
                      fontWeight: 700,
                      fontSize: 'var(--ps-text-md)',
                      textAlign: 'right',
                    }}
                  >
                    ${cart.totalPrice}
                  </Col>
                </Row>
              </ListGroup.Item>
              {error && (
                <ListGroup.Item style={{ border: 'none', padding: 'var(--ps-space-1) 0' }}>
                  <Message variant='danger'>{error}</Message>
                </ListGroup.Item>
              )}
              <ListGroup.Item style={{ border: 'none', padding: 'var(--ps-space-2) 0 0 0' }}>
                <Button
                  type='button'
                  className='btn-block'
                  disabled={cart.cartItems.length === 0}
                  onClick={placeOrderHandler}
                  aria-label='Place order'
                  style={{
                    borderRadius: 'var(--ps-radius-sm)',
                    padding: 'var(--ps-space-1) var(--ps-space-2)',
                    fontWeight: 600,
                  }}
                >
                  Place Order
                </Button>
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default PlaceOrderScreen
