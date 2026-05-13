import React, { useState, useEffect } from 'react'
import { Table, Form, Button, Row, Col } from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import Message from '../components/Message'
import Loader from '../components/Loader'
import { getUserDetails, updateUserProfile } from '../actions/userActions'
import { listMyOrders } from '../actions/orderActions'
import { USER_UPDATE_PROFILE_RESET } from '../constants/userConstants'

/**
 * User profile & order history with design system tokens.
 */
const ProfileScreen = ({ location, history }) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState(null)

  const dispatch = useDispatch()

  const userDetails = useSelector((state) => state.userDetails)
  const { loading, error, user } = userDetails

  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin

  const userUpdateProfile = useSelector((state) => state.userUpdateProfile)
  const { success } = userUpdateProfile

  const orderListMy = useSelector((state) => state.orderListMy)
  const { loading: loadingOrders, error: errorOrders, orders } = orderListMy

  useEffect(() => {
    if (!userInfo) {
      history.push('/login')
    } else {
      if (!user || !user.name || success) {
        dispatch({ type: USER_UPDATE_PROFILE_RESET })
        dispatch(getUserDetails('profile'))
        dispatch(listMyOrders())
      } else {
        setName(user.name)
        setEmail(user.email)
      }
    }
  }, [dispatch, history, userInfo, user, success])

  const submitHandler = (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setMessage('Passwords do not match')
    } else {
      dispatch(updateUserProfile({ id: user._id, name, email, password }))
    }
  }

  return (
    <Row>
      <Col md={3}>
        <h2>User Profile</h2>
        {message && <Message variant='danger'>{message}</Message>}
        {success && <Message variant='success'>Profile Updated</Message>}
        {loading ? (
          <Loader />
        ) : error ? (
          <Message variant='danger'>{error}</Message>
        ) : (
          <Form onSubmit={submitHandler}>
            <Form.Group controlId='name' style={{ marginBottom: 'var(--ps-space-2)' }}>
              <Form.Label style={{ fontWeight: 500 }}>Name</Form.Label>
              <Form.Control
                type='name'
                placeholder='Enter name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-label='Full name'
                style={{ borderRadius: 'var(--ps-radius-sm)' }}
              />
            </Form.Group>

            <Form.Group controlId='email' style={{ marginBottom: 'var(--ps-space-2)' }}>
              <Form.Label style={{ fontWeight: 500 }}>Email Address</Form.Label>
              <Form.Control
                type='email'
                placeholder='Enter email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label='Email address'
                style={{ borderRadius: 'var(--ps-radius-sm)' }}
              />
            </Form.Group>

            <Form.Group controlId='password' style={{ marginBottom: 'var(--ps-space-2)' }}>
              <Form.Label style={{ fontWeight: 500 }}>Password</Form.Label>
              <Form.Control
                type='password'
                placeholder='Enter password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-label='New password'
                style={{ borderRadius: 'var(--ps-radius-sm)' }}
              />
            </Form.Group>

            <Form.Group controlId='confirmPassword' style={{ marginBottom: 'var(--ps-space-3)' }}>
              <Form.Label style={{ fontWeight: 500 }}>Confirm Password</Form.Label>
              <Form.Control
                type='password'
                placeholder='Confirm password'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-label='Confirm password'
                style={{ borderRadius: 'var(--ps-radius-sm)' }}
              />
            </Form.Group>

            <Button
              type='submit'
              variant='primary'
              style={{
                borderRadius: 'var(--ps-radius-sm)',
                padding: 'var(--ps-space-1) var(--ps-space-2)',
                fontWeight: 600,
              }}
            >
              Update
            </Button>
          </Form>
        )}
      </Col>
      <Col md={9}>
        <h2>My Orders</h2>
        {loadingOrders ? (
          <Loader />
        ) : errorOrders ? (
          <Message variant='danger'>{errorOrders}</Message>
        ) : orders.length === 0 ? (
          <div className='ps-empty-state'>
            <p style={{ fontSize: 'var(--ps-text-md)' }}>No orders yet</p>
          </div>
        ) : (
          <Table
            striped
            hover
            responsive
            className='table-sm ps-table'
          >
            <thead>
              <tr>
                <th>ID</th>
                <th>DATE</th>
                <th>TOTAL</th>
                <th>PAID</th>
                <th>DELIVERED</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 'var(--ps-text-xs)' }}>
                    {order._id}
                  </td>
                  <td>{order.createdAt.substring(0, 10)}</td>
                  <td style={{ fontWeight: 600 }}>${order.totalPrice}</td>
                  <td>
                    {order.isPaid ? (
                      <span className='ps-badge ps-badge-enabled'>
                        {order.paidAt.substring(0, 10)}
                      </span>
                    ) : (
                      <span
                        className='ps-badge'
                        style={{
                          background: 'rgba(220, 38, 38, 0.1)',
                          color: 'var(--ps-danger)',
                        }}
                      >
                        Not Paid
                      </span>
                    )}
                  </td>
                  <td>
                    {order.isDelivered ? (
                      <span className='ps-badge ps-badge-enabled'>
                        {order.deliveredAt.substring(0, 10)}
                      </span>
                    ) : (
                      <span
                        className='ps-badge'
                        style={{
                          background: 'rgba(220, 38, 38, 0.1)',
                          color: 'var(--ps-danger)',
                        }}
                      >
                        Not Delivered
                      </span>
                    )}
                  </td>
                  <td>
                    <LinkContainer to={`/order/${order._id}`}>
                      <Button
                        className='btn-sm'
                        variant='outline-primary'
                        aria-label={`View order ${order._id}`}
                        style={{ borderRadius: 'var(--ps-radius-sm)' }}
                      >
                        Details
                      </Button>
                    </LinkContainer>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Col>
    </Row>
  )
}

export default ProfileScreen
