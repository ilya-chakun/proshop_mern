import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Form, Button } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import Message from '../components/Message'
import Loader from '../components/Loader'
import FormContainer from '../components/FormContainer'
import { getUserDetails, updateUser } from '../actions/userActions'
import { USER_UPDATE_RESET } from '../constants/userConstants'

/**
 * Admin user edit form with design system tokens.
 */
const UserEditScreen = ({ match, history }) => {
  const userId = match.params.id

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  const dispatch = useDispatch()

  const userDetails = useSelector((state) => state.userDetails)
  const { loading, error, user } = userDetails

  const userUpdate = useSelector((state) => state.userUpdate)
  const {
    loading: loadingUpdate,
    error: errorUpdate,
    success: successUpdate,
  } = userUpdate

  useEffect(() => {
    if (successUpdate) {
      dispatch({ type: USER_UPDATE_RESET })
      history.push('/admin/userlist')
    } else {
      if (!user.name || user._id !== userId) {
        dispatch(getUserDetails(userId))
      } else {
        setName(user.name)
        setEmail(user.email)
        setIsAdmin(user.isAdmin)
      }
    }
  }, [dispatch, history, userId, user, successUpdate])

  const submitHandler = (e) => {
    e.preventDefault()
    dispatch(updateUser({ _id: userId, name, email, isAdmin }))
  }

  return (
    <>
      <Link
        to='/admin/userlist'
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
          Edit User
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
                aria-label='User name'
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

            <Form.Group controlId='isadmin' style={{ marginBottom: 'var(--ps-space-3)' }}>
              <Form.Check
                type='checkbox'
                label='Is Admin'
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                aria-label='Admin status'
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

export default UserEditScreen
