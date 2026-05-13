import React, { useEffect } from 'react'
import { LinkContainer } from 'react-router-bootstrap'
import { Table, Button } from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import Message from '../components/Message'
import Loader from '../components/Loader'
import { listUsers, deleteUser } from '../actions/userActions'

/**
 * Admin user list with design system tokens.
 */
const UserListScreen = ({ history }) => {
  const dispatch = useDispatch()

  const userList = useSelector((state) => state.userList)
  const { loading, error, users } = userList

  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin

  const userDelete = useSelector((state) => state.userDelete)
  const { success: successDelete } = userDelete

  useEffect(() => {
    if (userInfo && userInfo.isAdmin) {
      dispatch(listUsers())
    } else {
      history.push('/login')
    }
  }, [dispatch, history, successDelete, userInfo])

  const deleteHandler = (id) => {
    if (window.confirm('Are you sure')) {
      dispatch(deleteUser(id))
    }
  }

  return (
    <>
      <h1>Users</h1>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant='danger'>{error}</Message>
      ) : users.length === 0 ? (
        <div className='ps-empty-state'>
          <p style={{ fontSize: 'var(--ps-text-md)' }}>No users found</p>
        </div>
      ) : (
        <Table striped hover responsive className='table-sm ps-table'>
          <thead>
            <tr>
              <th>ID</th>
              <th>NAME</th>
              <th>EMAIL</th>
              <th>ADMIN</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td style={{ fontFamily: 'monospace', fontSize: 'var(--ps-text-xs)' }}>
                  {user._id}
                </td>
                <td style={{ fontWeight: 500 }}>{user.name}</td>
                <td>
                  <a
                    href={`mailto:${user.email}`}
                    style={{ color: 'var(--ps-primary)' }}
                  >
                    {user.email}
                  </a>
                </td>
                <td>
                  {user.isAdmin ? (
                    <span className='ps-badge ps-badge-enabled' role='status'>
                      Admin
                    </span>
                  ) : (
                    <span className='ps-badge ps-badge-disabled' role='status'>
                      User
                    </span>
                  )}
                </td>
                <td>
                  <LinkContainer to={`/admin/user/${user._id}/edit`}>
                    <Button
                      variant='outline-primary'
                      className='btn-sm'
                      aria-label={`Edit ${user.name}`}
                      style={{
                        borderRadius: 'var(--ps-radius-sm)',
                        marginRight: 'var(--ps-space-1)',
                      }}
                    >
                      <i className='fas fa-edit'></i>
                    </Button>
                  </LinkContainer>
                  <Button
                    variant='outline-danger'
                    className='btn-sm'
                    onClick={() => deleteHandler(user._id)}
                    aria-label={`Delete ${user.name}`}
                    style={{ borderRadius: 'var(--ps-radius-sm)' }}
                  >
                    <i className='fas fa-trash'></i>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  )
}

export default UserListScreen
