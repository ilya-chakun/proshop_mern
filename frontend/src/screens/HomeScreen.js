import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Row, Col } from 'react-bootstrap'
import Product from '../components/Product'
import Message from '../components/Message'
import Loader from '../components/Loader'
import Paginate from '../components/Paginate'
import ProductCarousel from '../components/ProductCarousel'
import Meta from '../components/Meta'
import { listProducts } from '../actions/productActions'

/**
 * Home screen / product listing page.
 * Displays product grid with design system spacing and typography.
 */
const HomeScreen = ({ match }) => {
  const keyword = match.params.keyword
  const pageNumber = match.params.pageNumber || 1

  const dispatch = useDispatch()

  const productList = useSelector((state) => state.productList)
  const { loading, error, products, page, pages } = productList

  useEffect(() => {
    dispatch(listProducts(keyword, pageNumber))
  }, [dispatch, keyword, pageNumber])

  return (
    <>
      <Meta />
      {!keyword ? (
        <ProductCarousel />
      ) : (
        <Link
          to='/'
          className='btn btn-outline-secondary'
          style={{
            marginBottom: 'var(--ps-space-2)',
            borderRadius: 'var(--ps-radius-sm)',
          }}
        >
          Go Back
        </Link>
      )}
      <h1
        style={{
          fontSize: 'var(--ps-text-2xl)',
          fontWeight: 700,
          marginBottom: 'var(--ps-space-3)',
        }}
      >
        {keyword ? `Results for "${keyword}"` : 'Latest Products'}
      </h1>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error}</Message>
      ) : (
        <>
          {products.length === 0 ? (
            <div className='ps-empty-state'>
              <p>No products found.</p>
              {keyword && (
                <Link to='/' style={{ color: 'var(--ps-primary)' }}>
                  View all products
                </Link>
              )}
            </div>
          ) : (
            <Row>
              {products.map((product) => (
                <Col
                  key={product._id}
                  sm={12}
                  md={6}
                  lg={4}
                  xl={3}
                  style={{ marginBottom: 'var(--ps-space-2)' }}
                >
                  <Product product={product} />
                </Col>
              ))}
            </Row>
          )}
          <Paginate
            pages={pages}
            page={page}
            keyword={keyword ? keyword : ''}
          />
        </>
      )}
    </>
  )
}

export default HomeScreen
