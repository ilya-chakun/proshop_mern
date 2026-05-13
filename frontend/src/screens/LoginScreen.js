import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Form, Button, Row, Col } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import Message from '../components/Message'
import Loader from '../components/Loader'
import FormContainer from '../components/FormContainer'
import { login } from '../actions/userActions'

/**
 * Login screen with design system styling.
 */
const LoginScreen = ({ location, history }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const dispatch = useDispatch()

  const userLogin = useSelector((state) => state.userLogin)
  const { loading, error, userInfo } = userLogin

  const redirect = location.search ? location.search.split('=')[1] : '/'

  useEffect(() => {
    if (userInfo) {
      history.push(redirect)
    }
  }, [history, userInfo, redirect])

  const submitHandler = (e) => {
    e.preventDefault()
    dispatch(login(email, password))
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
        Sign In
      </h1>
      {error && <Message variant='danger'>{error}</Message>}
      {loading && <Loader />}
      <Form onSubmit={submitHandler}>
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

        <Form.Group controlId='password' style={{ marginBottom: 'var(--ps-space-3)' }}>
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
          Sign In
        </Button>
      </Form>

      <Row style={{ marginTop: 'var(--ps-space-2)' }}>
        <Col style={{ textAlign: 'center', color: 'var(--ps-text-muted)' }}>
          New Customer?{' '}
          <Link
            to={redirect ? `/register?redirect=${redirect}` : '/register'}
            style={{ color: 'var(--ps-primary)', fontWeight: 500 }}
          >
            Register
          </Link>
        </Col>
      </Row>
    </FormContainer>
  )
}

export default LoginScreen
