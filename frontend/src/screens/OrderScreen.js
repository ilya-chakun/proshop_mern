import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { PayPalButton } from 'react-paypal-button-v2'
import { Link } from 'react-router-dom'
import { Row, Col, ListGroup, Image, Card, Button } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import Message from '../components/Message'
import Loader from '../components/Loader'
import {
  getOrderDetails,
  payOrder,
  deliverOrder,
} from '../actions/orderActions'
import {
  ORDER_PAY_RESET,
  ORDER_DELIVER_RESET,
} from '../constants/orderConstants'

/**
 * Order detail screen with design system tokens.
 */
const OrderScreen = ({ match, history }) => {
  const orderId = match.params.id

  const [sdkReady, setSdkReady] = useState(false)

  const dispatch = useDispatch()

  const orderDetails = useSelector((state) => state.orderDetails)
  const { order, loading, error } = orderDetails

  const orderPay = useSelector((state) => state.orderPay)
  const { loading: loadingPay, success: successPay } = orderPay

  const orderDeliver = useSelector((state) => state.orderDeliver)
  const { loading: loadingDeliver, success: successDeliver } = orderDeliver

  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin

  if (!loading) {
    const addDecimals = (num) => {
      return (Math.round(num * 100) / 100).toFixed(2)
    }

    order.itemsPrice = addDecimals(
      order.orderItems.reduce((acc, item) => acc + item.price * item.qty, 0)
    )
  }

  useEffect(() => {
    if (!userInfo) {
      history.push('/login')
    }

    const addPayPalScript = async () => {
      const { data: clientId } = await axios.get('/api/config/paypal')
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}`
      script.async = true
      script.onload = () => {
        setSdkReady(true)
      }
      document.body.appendChild(script)
    }

    if (!order || successPay || successDeliver || order._id !== orderId) {
      dispatch({ type: ORDER_PAY_RESET })
      dispatch({ type: ORDER_DELIVER_RESET })
      dispatch(getOrderDetails(orderId))
    } else if (!order.isPaid) {
      if (!window.paypal) {
        addPayPalScript()
      } else {
        setSdkReady(true)
      }
    }
  }, [dispatch, orderId, successPay, successDeliver, order])

  const successPaymentHandler = (paymentResult) => {
    console.log(paymentResult)
    dispatch(payOrder(orderId, paymentResult))
  }

  const deliverHandler = () => {
    dispatch(deliverOrder(order))
  }

  return loading ? (
    <Loader />
  ) : error ? (
    <Message variant='danger'>{error}</Message>
  ) : (
    <>
      <h1 style={{ fontSize: 'var(--ps-text-xl)', fontWeight: 700 }}>
        Order {order._id}
      </h1>
      <Row>
        <Col md={8}>
          <ListGroup variant='flush'>
            <ListGroup.Item style={{ padding: 'var(--ps-space-2) 0' }}>
              <h2>Shipping</h2>
              <p style={{ margin: '0 0 var(--ps-space-1) 0' }}>
                <strong>Name: </strong> {order.user.name}
              </p>
              <p style={{ margin: '0 0 var(--ps-space-1) 0' }}>
                <strong>Email: </strong>{' '}
                <a
                  href={`mailto:${order.user.email}`}
                  style={{ color: 'var(--ps-primary)' }}
                >
                  {order.user.email}
                </a>
              </p>
              <p style={{ margin: '0 0 var(--ps-space-1) 0', color: 'var(--ps-text-muted)' }}>
                {order.shippingAddress.address}, {order.shippingAddress.city}{' '}
                {order.shippingAddress.postalCode},{' '}
                {order.shippingAddress.country}
              </p>
              {order.isDelivered ? (
                <span
                  className='ps-badge ps-badge-enabled'
                  role='status'
                  aria-label='Delivered'
                >
                  Delivered on {order.deliveredAt.substring(0, 10)}
                </span>
              ) : (
                <span
                  className='ps-badge'
                  role='status'
                  aria-label='Not delivered'
                  style={{
                    background: 'rgba(220, 38, 38, 0.1)',
                    color: 'var(--ps-danger)',
                  }}
                >
                  Not Delivered
                </span>
              )}
            </ListGroup.Item>

            <ListGroup.Item style={{ padding: 'var(--ps-space-2) 0' }}>
              <h2>Payment Method</h2>
              <p style={{ margin: '0 0 var(--ps-space-1) 0', color: 'var(--ps-text-muted)' }}>
                {order.paymentMethod}
              </p>
              {order.isPaid ? (
                <span
                  className='ps-badge ps-badge-enabled'
                  role='status'
                  aria-label='Paid'
                >
                  Paid on {order.paidAt.substring(0, 10)}
                </span>
              ) : (
                <span
                  className='ps-badge'
                  role='status'
                  aria-label='Not paid'
                  style={{
                    background: 'rgba(220, 38, 38, 0.1)',
                    color: 'var(--ps-danger)',
                  }}
                >
                  Not Paid
                </span>
              )}
            </ListGroup.Item>

            <ListGroup.Item style={{ padding: 'var(--ps-space-2) 0' }}>
              <h2>Order Items</h2>
              {order.orderItems.length === 0 ? (
                <div className='ps-empty-state'>Order is empty</div>
              ) : (
                <ListGroup variant='flush'>
                  {order.orderItems.map((item, index) => (
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
          <Card className='ps-card' style={{ padding: 'var(--ps-space-3)' }}>
            <ListGroup variant='flush'>
              <ListGroup.Item style={{ border: 'none', padding: '0 0 var(--ps-space-2) 0' }}>
                <h2 style={{ margin: 0 }}>Order Summary</h2>
              </ListGroup.Item>
              <ListGroup.Item style={{ padding: 'var(--ps-space-1) 0' }}>
                <Row>
                  <Col>Items</Col>
                  <Col style={{ fontWeight: 600, textAlign: 'right' }}>${order.itemsPrice}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item style={{ padding: 'var(--ps-space-1) 0' }}>
                <Row>
                  <Col>Shipping</Col>
                  <Col style={{ fontWeight: 600, textAlign: 'right' }}>${order.shippingPrice}</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item style={{ padding: 'var(--ps-space-1) 0' }}>
                <Row>
                  <Col>Tax</Col>
                  <Col style={{ fontWeight: 600, textAlign: 'right' }}>${order.taxPrice}</Col>
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
                    ${order.totalPrice}
                  </Col>
                </Row>
              </ListGroup.Item>
              {!order.isPaid && (
                <ListGroup.Item style={{ padding: 'var(--ps-space-2) 0', border: 'none' }}>
                  {loadingPay && <Loader />}
                  {!sdkReady ? (
                    <Loader />
                  ) : (
                    <PayPalButton
                      amount={order.totalPrice}
                      onSuccess={successPaymentHandler}
                    />
                  )}
                </ListGroup.Item>
              )}
              {loadingDeliver && <Loader />}
              {userInfo &&
                userInfo.isAdmin &&
                order.isPaid &&
                !order.isDelivered && (
                  <ListGroup.Item style={{ padding: 'var(--ps-space-1) 0', border: 'none' }}>
                    <Button
                      type='button'
                      className='btn btn-block'
                      onClick={deliverHandler}
                      aria-label='Mark as delivered'
                      style={{
                        borderRadius: 'var(--ps-radius-sm)',
                        padding: 'var(--ps-space-1) var(--ps-space-2)',
                        fontWeight: 600,
                      }}
                    >
                      Mark As Delivered
                    </Button>
                  </ListGroup.Item>
                )}
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default OrderScreen
