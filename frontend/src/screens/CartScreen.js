import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Row, Col, ListGroup, Image, Form, Button, Card } from 'react-bootstrap'
import Message from '../components/Message'
import { addToCart, removeFromCart } from '../actions/cartActions'

/**
 * Shopping cart screen with design system styling.
 */
const CartScreen = ({ match, location, history }) => {
  const productId = match.params.id
  const qty = location.search ? Number(location.search.split('=')[1]) : 1

  const dispatch = useDispatch()

  const cart = useSelector((state) => state.cart)
  const { cartItems } = cart

  useEffect(() => {
    if (productId) {
      dispatch(addToCart(productId, qty))
    }
  }, [dispatch, productId, qty])

  const removeFromCartHandler = (id) => {
    dispatch(removeFromCart(id))
  }

  const checkoutHandler = () => {
    history.push('/login?redirect=shipping')
  }

  return (
    <Row>
      <Col md={8}>
        <h1
          style={{
            fontSize: 'var(--ps-text-2xl)',
            fontWeight: 700,
            marginBottom: 'var(--ps-space-3)',
          }}
        >
          Shopping Cart
        </h1>
        {cartItems.length === 0 ? (
          <div className='ps-empty-state'>
            <p style={{ marginBottom: 'var(--ps-space-1)' }}>
              Your cart is empty.
            </p>
            <Link to='/' style={{ color: 'var(--ps-primary)', fontWeight: 500 }}>
              Continue Shopping
            </Link>
          </div>
        ) : (
          <ListGroup variant='flush'>
            {cartItems.map((item) => (
              <ListGroup.Item
                key={item.product}
                style={{ padding: 'var(--ps-space-2) 0' }}
              >
                <Row className='align-items-center'>
                  <Col md={2}>
                    <Image
                      src={item.image}
                      alt={item.name}
                      fluid
                      rounded
                      style={{ borderRadius: 'var(--ps-radius-sm)' }}
                    />
                  </Col>
                  <Col md={3}>
                    <Link
                      to={`/product/${item.product}`}
                      style={{ color: 'var(--ps-text)', fontWeight: 500 }}
                    >
                      {item.name}
                    </Link>
                  </Col>
                  <Col
                    md={2}
                    style={{ fontWeight: 600, fontSize: 'var(--ps-text-md)' }}
                  >
                    ${item.price}
                  </Col>
                  <Col md={2}>
                    <Form.Control
                      as='select'
                      value={item.qty}
                      onChange={(e) =>
                        dispatch(
                          addToCart(item.product, Number(e.target.value))
                        )
                      }
                      aria-label={`Quantity for ${item.name}`}
                      style={{ borderRadius: 'var(--ps-radius-sm)' }}
                    >
                      {[...Array(item.countInStock).keys()].map((x) => (
                        <option key={x + 1} value={x + 1}>
                          {x + 1}
                        </option>
                      ))}
                    </Form.Control>
                  </Col>
                  <Col md={2}>
                    <Button
                      type='button'
                      variant='light'
                      onClick={() => removeFromCartHandler(item.product)}
                      aria-label={`Remove ${item.name} from cart`}
                      style={{ borderRadius: 'var(--ps-radius-sm)' }}
                    >
                      <i className='fas fa-trash'></i>
                    </Button>
                  </Col>
                </Row>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Col>
      <Col md={4}>
        <Card
          style={{
            border: '1px solid var(--ps-border)',
            borderRadius: 'var(--ps-radius-md)',
            boxShadow: 'var(--ps-shadow-sm)',
            marginTop: 'var(--ps-space-4)',
          }}
        >
          <ListGroup variant='flush'>
            <ListGroup.Item style={{ padding: 'var(--ps-space-3)' }}>
              <h2
                style={{
                  fontSize: 'var(--ps-text-lg)',
                  fontWeight: 600,
                  marginBottom: 'var(--ps-space-1)',
                }}
              >
                Subtotal ({cartItems.reduce((acc, item) => acc + item.qty, 0)})
                items
              </h2>
              <div
                style={{
                  fontSize: 'var(--ps-text-xl)',
                  fontWeight: 700,
                }}
              >
                $
                {cartItems
                  .reduce((acc, item) => acc + item.qty * item.price, 0)
                  .toFixed(2)}
              </div>
            </ListGroup.Item>
            <ListGroup.Item style={{ padding: 'var(--ps-space-2) var(--ps-space-3)' }}>
              <Button
                type='button'
                className='btn-block'
                disabled={cartItems.length === 0}
                onClick={checkoutHandler}
                style={{
                  borderRadius: 'var(--ps-radius-sm)',
                  fontWeight: 600,
                }}
              >
                Proceed To Checkout
              </Button>
            </ListGroup.Item>
          </ListGroup>
        </Card>
      </Col>
    </Row>
  )
}

export default CartScreen
