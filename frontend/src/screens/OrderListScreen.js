import React, { useEffect } from 'react'
import { LinkContainer } from 'react-router-bootstrap'
import { Table, Button } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import Message from '../components/Message'
import Loader from '../components/Loader'
import { listOrders } from '../actions/orderActions'

/**
 * Admin order list with design system tokens.
 */
const OrderListScreen = ({ history }) => {
  const dispatch = useDispatch()

  const orderList = useSelector((state) => state.orderList)
  const { loading, error, orders } = orderList

  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin

  useEffect(() => {
    if (userInfo && userInfo.isAdmin) {
      dispatch(listOrders())
    } else {
      history.push('/login')
    }
  }, [dispatch, history, userInfo])

  return (
    <>
      <h1>Orders</h1>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error}</Message>
      ) : orders.length === 0 ? (
        <div className='ps-empty-state'>
          <p style={{ fontSize: 'var(--ps-text-md)' }}>No orders found</p>
        </div>
      ) : (
        <Table striped hover responsive className='table-sm ps-table'>
          <thead>
            <tr>
              <th>ID</th>
              <th>USER</th>
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
                <td style={{ fontWeight: 500 }}>
                  {order.user && order.user.name}
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
                      variant='outline-primary'
                      className='btn-sm'
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
    </>
  )
}

export default OrderListScreen
