import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Row, Col, Image, ListGroup, Card, Button, Form } from 'react-bootstrap'
import Rating from '../components/Rating'
import Message from '../components/Message'
import Loader from '../components/Loader'
import Meta from '../components/Meta'
import {
  listProductDetails,
  createProductReview,
} from '../actions/productActions'
import { PRODUCT_CREATE_REVIEW_RESET } from '../constants/productConstants'

/**
 * Product detail screen with design system styling.
 */
const ProductScreen = ({ history, match }) => {
  const [qty, setQty] = useState(1)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')

  const dispatch = useDispatch()

  const productDetails = useSelector((state) => state.productDetails)
  const { loading, error, product } = productDetails

  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin

  const productReviewCreate = useSelector((state) => state.productReviewCreate)
  const {
    success: successProductReview,
    loading: loadingProductReview,
    error: errorProductReview,
  } = productReviewCreate

  useEffect(() => {
    if (successProductReview) {
      setRating(0)
      setComment('')
    }
    if (!product._id || product._id !== match.params.id) {
      dispatch(listProductDetails(match.params.id))
      dispatch({ type: PRODUCT_CREATE_REVIEW_RESET })
    }
  }, [dispatch, match, successProductReview])

  const addToCartHandler = () => {
    history.push(`/cart/${match.params.id}?qty=${qty}`)
  }

  const submitHandler = (e) => {
    e.preventDefault()
    dispatch(
      createProductReview(match.params.id, {
        rating,
        comment,
      })
    )
  }

  return (
    <>
      <Link
        className='btn btn-outline-secondary'
        to='/'
        style={{
          marginBottom: 'var(--ps-space-3)',
          borderRadius: 'var(--ps-radius-sm)',
        }}
      >
        Go Back
      </Link>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error}</Message>
      ) : (
        <>
          <Meta title={product.name} />
          <Row>
            <Col md={6} style={{ marginBottom: 'var(--ps-space-3)' }}>
              <Image
                src={product.image}
                alt={product.name}
                fluid
                style={{ borderRadius: 'var(--ps-radius-md)' }}
              />
            </Col>
            <Col md={3} style={{ marginBottom: 'var(--ps-space-3)' }}>
              <ListGroup variant='flush'>
                <ListGroup.Item style={{ border: 'none', paddingLeft: 0 }}>
                  <h3
                    style={{
                      fontSize: 'var(--ps-text-lg)',
                      fontWeight: 600,
                      padding: 0,
                      margin: 0,
                    }}
                  >
                    {product.name}
                  </h3>
                </ListGroup.Item>
                <ListGroup.Item style={{ border: 'none', paddingLeft: 0 }}>
                  <Rating
                    value={product.rating}
                    text={`${product.numReviews} reviews`}
                  />
                </ListGroup.Item>
                <ListGroup.Item
                  style={{
                    border: 'none',
                    paddingLeft: 0,
                    fontSize: 'var(--ps-text-xl)',
                    fontWeight: 700,
                  }}
                >
                  ${product.price}
                </ListGroup.Item>
                <ListGroup.Item
                  style={{
                    border: 'none',
                    paddingLeft: 0,
                    color: 'var(--ps-text-muted)',
                    lineHeight: 1.6,
                  }}
                >
                  {product.description}
                </ListGroup.Item>
              </ListGroup>
            </Col>
            <Col md={3}>
              <Card
                style={{
                  border: '1px solid var(--ps-border)',
                  borderRadius: 'var(--ps-radius-md)',
                  boxShadow: 'var(--ps-shadow-sm)',
                }}
              >
                <ListGroup variant='flush'>
                  <ListGroup.Item>
                    <Row>
                      <Col>Price:</Col>
                      <Col>
                        <strong>${product.price}</strong>
                      </Col>
                    </Row>
                  </ListGroup.Item>

                  <ListGroup.Item>
                    <Row>
                      <Col>Status:</Col>
                      <Col>
                        <span
                          className={
                            product.countInStock > 0
                              ? 'ps-badge ps-badge-enabled'
                              : 'ps-badge ps-badge-disabled'
                          }
                        >
                          {product.countInStock > 0 ? 'In Stock' : 'Out Of Stock'}
                        </span>
                      </Col>
                    </Row>
                  </ListGroup.Item>

                  {product.countInStock > 0 && (
                    <ListGroup.Item>
                      <Row>
                        <Col>Qty</Col>
                        <Col>
                          <Form.Control
                            as='select'
                            value={qty}
                            onChange={(e) => setQty(e.target.value)}
                            aria-label='Select quantity'
                            style={{ borderRadius: 'var(--ps-radius-sm)' }}
                          >
                            {[...Array(product.countInStock).keys()].map(
                              (x) => (
                                <option key={x + 1} value={x + 1}>
                                  {x + 1}
                                </option>
                              )
                            )}
                          </Form.Control>
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  )}

                  <ListGroup.Item>
                    <Button
                      onClick={addToCartHandler}
                      className='btn-block'
                      type='button'
                      disabled={product.countInStock === 0}
                      style={{
                        borderRadius: 'var(--ps-radius-sm)',
                        fontWeight: 600,
                      }}
                    >
                      Add To Cart
                    </Button>
                  </ListGroup.Item>
                </ListGroup>
              </Card>
            </Col>
          </Row>

          {/* Reviews Section */}
          <Row style={{ marginTop: 'var(--ps-space-5)' }}>
            <Col md={6}>
              <h2
                style={{
                  fontSize: 'var(--ps-text-xl)',
                  fontWeight: 600,
                  marginBottom: 'var(--ps-space-2)',
                }}
              >
                Reviews
              </h2>
              {product.reviews.length === 0 && (
                <div className='ps-empty-state'>
                  <p>No reviews yet. Be the first to share your thoughts.</p>
                </div>
              )}
              <ListGroup variant='flush'>
                {product.reviews.map((review) => (
                  <ListGroup.Item
                    key={review._id}
                    style={{ paddingLeft: 0, paddingRight: 0 }}
                  >
                    <strong>{review.name}</strong>
                    <Rating value={review.rating} />
                    <p style={{ color: 'var(--ps-text-muted)', fontSize: 'var(--ps-text-xs)' }}>
                      {review.createdAt.substring(0, 10)}
                    </p>
                    <p>{review.comment}</p>
                  </ListGroup.Item>
                ))}
                <ListGroup.Item style={{ paddingLeft: 0, paddingRight: 0 }}>
                  <h2
                    style={{
                      fontSize: 'var(--ps-text-lg)',
                      fontWeight: 600,
                      marginBottom: 'var(--ps-space-2)',
                    }}
                  >
                    Write a Customer Review
                  </h2>
                  {successProductReview && (
                    <Message variant='success'>
                      Review submitted successfully
                    </Message>
                  )}
                  {loadingProductReview && <Loader />}
                  {errorProductReview && (
                    <Message variant='danger'>{errorProductReview}</Message>
                  )}
                  {userInfo ? (
                    <Form onSubmit={submitHandler}>
                      <Form.Group
                        controlId='rating'
                        style={{ marginBottom: 'var(--ps-space-2)' }}
                      >
                        <Form.Label style={{ fontWeight: 500 }}>Rating</Form.Label>
                        <Form.Control
                          as='select'
                          value={rating}
                          onChange={(e) => setRating(e.target.value)}
                          aria-label='Select rating'
                          style={{ borderRadius: 'var(--ps-radius-sm)' }}
                        >
                          <option value=''>Select...</option>
                          <option value='1'>1 - Poor</option>
                          <option value='2'>2 - Fair</option>
                          <option value='3'>3 - Good</option>
                          <option value='4'>4 - Very Good</option>
                          <option value='5'>5 - Excellent</option>
                        </Form.Control>
                      </Form.Group>
                      <Form.Group
                        controlId='comment'
                        style={{ marginBottom: 'var(--ps-space-2)' }}
                      >
                        <Form.Label style={{ fontWeight: 500 }}>Comment</Form.Label>
                        <Form.Control
                          as='textarea'
                          row='3'
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          aria-label='Review comment'
                          style={{ borderRadius: 'var(--ps-radius-sm)' }}
                        />
                      </Form.Group>
                      <Button
                        disabled={loadingProductReview}
                        type='submit'
                        variant='primary'
                        style={{
                          borderRadius: 'var(--ps-radius-sm)',
                          fontWeight: 600,
                        }}
                      >
                        Submit
                      </Button>
                    </Form>
                  ) : (
                    <Message>
                      Please <Link to='/login'>sign in</Link> to write a review
                    </Message>
                  )}
                </ListGroup.Item>
              </ListGroup>
            </Col>
          </Row>
        </>
      )}
    </>
  )
}

export default ProductScreen
