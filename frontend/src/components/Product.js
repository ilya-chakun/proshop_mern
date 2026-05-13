import React from 'react'
import { Link } from 'react-router-dom'
import { Card } from 'react-bootstrap'
import Rating from './Rating'

/**
 * Product card component for the home page grid.
 * Uses design system tokens for consistent styling.
 */
const Product = ({ product }) => {
  return (
    <Card
      className='my-3 rounded'
      style={{
        border: '1px solid var(--ps-border)',
        borderRadius: 'var(--ps-radius-md)',
        boxShadow: 'var(--ps-shadow-sm)',
        overflow: 'hidden',
      }}
    >
      <Link to={`/product/${product._id}`}>
        <Card.Img src={product.image} variant='top' />
      </Link>

      <Card.Body style={{ padding: 'var(--ps-space-2)' }}>
        <Link
          to={`/product/${product._id}`}
          style={{ textDecoration: 'none', color: 'var(--ps-text)' }}
        >
          <Card.Title
            as='div'
            style={{
              fontSize: 'var(--ps-text-sm)',
              fontWeight: 500,
              minHeight: '48px',
            }}
          >
            {product.name}
          </Card.Title>
        </Link>

        <Card.Text as='div' style={{ marginBottom: 'var(--ps-space-1)' }}>
          <Rating
            value={product.rating}
            text={`${product.numReviews} reviews`}
          />
        </Card.Text>

        <Card.Text
          as='div'
          style={{
            fontSize: 'var(--ps-text-lg)',
            fontWeight: 700,
            color: 'var(--ps-text)',
          }}
        >
          ${product.price}
        </Card.Text>
      </Card.Body>
    </Card>
  )
}

export default Product
