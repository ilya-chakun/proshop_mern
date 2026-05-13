import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Form, Button, Row, Col } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import Message from '../components/Message'
import Loader from '../components/Loader'
import FormContainer from '../components/FormContainer'
import { register } from '../actions/userActions'

/**
 * Register screen with design system styling.
 */
const RegisterScreen = ({ location, history }) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState(null)

  const dispatch = useDispatch()

  const userRegister = useSelector((state) => state.userRegister)
  const { loading, error, userInfo } = userRegister

  const redirect = location.search ? location.search.split('=')[1] : '/'

  useEffect(() => {
    if (userInfo) {
      history.push(redirect)
    }
  }, [history, userInfo, redirect])

  const submitHandler = (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setMessage('Passwords do not match')
    } else {
      dispatch(register(name, email, password))
    }
  }

  return (
    <FormContainer>
      <h1
        style={{
          fontSize: 'var(--ps-text-xl)',
          fontWeight: 700,
          marginBottom: 'var(--ps-space-3)',
          textAlign: 'center',
        }}
      >
        Create Account
      </h1>
      {message && <Message variant='danger'>{message}</Message>}
      {error && <Message variant='danger'>{error}</Message>}
      {loading && <Loader />}
      <Form onSubmit={submitHandler}>
        <Form.Group controlId='name' style={{ marginBottom: 'var(--ps-space-2)' }}>
          <Form.Label style={{ fontWeight: 500 }}>Name</Form.Label>
          <Form.Control
            type='text'
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
            aria-label='Password'
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
          className='btn-block'
          style={{
            borderRadius: 'var(--ps-radius-sm)',
            padding: 'var(--ps-space-1) var(--ps-space-2)',
            fontWeight: 600,
          }}
        >
          Register
        </Button>
      </Form>

      <Row style={{ marginTop: 'var(--ps-space-2)' }}>
        <Col style={{ textAlign: 'center', color: 'var(--ps-text-muted)' }}>
          Have an Account?{' '}
          <Link
            to={redirect ? `/login?redirect=${redirect}` : '/login'}
            style={{ color: 'var(--ps-primary)', fontWeight: 500 }}
          >
            Login
          </Link>
        </Col>
      </Row>
    </FormContainer>
  )
}

export default RegisterScreen
