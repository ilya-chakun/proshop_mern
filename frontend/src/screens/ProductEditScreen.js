import axios from 'axios'
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Form, Button } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import Message from '../components/Message'
import Loader from '../components/Loader'
import FormContainer from '../components/FormContainer'
import { listProductDetails, updateProduct } from '../actions/productActions'
import { PRODUCT_UPDATE_RESET } from '../constants/productConstants'

/**
 * Admin product edit form with design system tokens.
 */
const ProductEditScreen = ({ match, history }) => {
  const productId = match.params.id

  const [name, setName] = useState('')
  const [price, setPrice] = useState(0)
  const [image, setImage] = useState('')
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState('')
  const [countInStock, setCountInStock] = useState(0)
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)

  const dispatch = useDispatch()

  const productDetails = useSelector((state) => state.productDetails)
  const { loading, error, product } = productDetails

  const productUpdate = useSelector((state) => state.productUpdate)
  const {
    loading: loadingUpdate,
    error: errorUpdate,
    success: successUpdate,
  } = productUpdate

  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin

  useEffect(() => {
    if (successUpdate) {
      dispatch({ type: PRODUCT_UPDATE_RESET })
      history.push('/admin/productlist')
    } else {
      if (!product.name || product._id !== productId) {
        dispatch(listProductDetails(productId))
      } else {
        setName(product.name)
        setPrice(product.price)
        setImage(product.image)
        setBrand(product.brand)
        setCategory(product.category)
        setCountInStock(product.countInStock)
        setDescription(product.description)
      }
    }
  }, [dispatch, history, productId, product, successUpdate])

  const uploadFileHandler = async (e) => {
    const file = e.target.files[0]
    const formData = new FormData()
    formData.append('image', file)
    setUploading(true)

    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${userInfo.token}`,
        },
      }

      const { data } = await axios.post('/api/upload', formData, config)

      setImage(data)
      setUploading(false)
    } catch (error) {
      console.error(error)
      setUploading(false)
    }
  }

  const submitHandler = (e) => {
    e.preventDefault()
    dispatch(
      updateProduct({
        _id: productId,
        name,
        price,
        image,
        brand,
        category,
        description,
        countInStock,
      })
    )
  }

  return (
    <>
      <Link
        to='/admin/productlist'
        className='btn btn-outline-secondary'
        style={{
          borderRadius: 'var(--ps-radius-sm)',
          marginBottom: 'var(--ps-space-3)',
          fontWeight: 500,
        }}
      >
        Go Back
      </Link>
      <FormContainer>
        <h1
          style={{
            fontSize: 'var(--ps-text-xl)',
            fontWeight: 700,
            marginBottom: 'var(--ps-space-3)',
            textAlign: 'center',
          }}
        >
          Edit Product
        </h1>
        {loadingUpdate && <Loader />}
        {errorUpdate && <Message variant='danger'>{errorUpdate}</Message>}
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
                aria-label='Product name'
                style={{ borderRadius: 'var(--ps-radius-sm)' }}
              />
            </Form.Group>

            <Form.Group controlId='price' style={{ marginBottom: 'var(--ps-space-2)' }}>
              <Form.Label style={{ fontWeight: 500 }}>Price</Form.Label>
              <Form.Control
                type='number'
                placeholder='Enter price'
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                aria-label='Product price'
                style={{ borderRadius: 'var(--ps-radius-sm)' }}
              />
            </Form.Group>

            <Form.Group controlId='image' style={{ marginBottom: 'var(--ps-space-2)' }}>
              <Form.Label style={{ fontWeight: 500 }}>Image</Form.Label>
              <Form.Control
                type='text'
                placeholder='Enter image url'
                value={image}
                onChange={(e) => setImage(e.target.value)}
                aria-label='Image URL'
                style={{ borderRadius: 'var(--ps-radius-sm)' }}
              />
              <Form.File
                id='image-file'
                label='Choose File'
                custom
                onChange={uploadFileHandler}
                style={{ marginTop: 'var(--ps-space-1)' }}
              />
              {uploading && <Loader />}
            </Form.Group>

            <Form.Group controlId='brand' style={{ marginBottom: 'var(--ps-space-2)' }}>
              <Form.Label style={{ fontWeight: 500 }}>Brand</Form.Label>
              <Form.Control
                type='text'
                placeholder='Enter brand'
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                aria-label='Product brand'
                style={{ borderRadius: 'var(--ps-radius-sm)' }}
              />
            </Form.Group>

            <Form.Group controlId='countInStock' style={{ marginBottom: 'var(--ps-space-2)' }}>
              <Form.Label style={{ fontWeight: 500 }}>Count In Stock</Form.Label>
              <Form.Control
                type='number'
                placeholder='Enter countInStock'
                value={countInStock}
                onChange={(e) => setCountInStock(e.target.value)}
                aria-label='Count in stock'
                style={{ borderRadius: 'var(--ps-radius-sm)' }}
              />
            </Form.Group>

            <Form.Group controlId='category' style={{ marginBottom: 'var(--ps-space-2)' }}>
              <Form.Label style={{ fontWeight: 500 }}>Category</Form.Label>
              <Form.Control
                type='text'
                placeholder='Enter category'
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label='Product category'
                style={{ borderRadius: 'var(--ps-radius-sm)' }}
              />
            </Form.Group>

            <Form.Group controlId='description' style={{ marginBottom: 'var(--ps-space-3)' }}>
              <Form.Label style={{ fontWeight: 500 }}>Description</Form.Label>
              <Form.Control
                type='text'
                placeholder='Enter description'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                aria-label='Product description'
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
              Update
            </Button>
          </Form>
        )}
      </FormContainer>
    </>
  )
}

export default ProductEditScreen
