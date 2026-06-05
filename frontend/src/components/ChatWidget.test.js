// M5 (T5.1) acceptance: the ChatWidget is logged-in only, and when used it POSTs
// to the RELATIVE /api/assistant/chat with an Authorization: Bearer header and
// renders the reply + route badge. fetch and react-redux are mocked (jsdom).

import React from 'react'
// RTL v9.5 (react-scripts 3.4.3 era): async util is `wait`, not `waitFor`.
import { render, screen, fireEvent, wait } from '@testing-library/react'
import { useSelector } from 'react-redux'
import ChatWidget from './ChatWidget'

// Mock react-redux so we can drive userInfo without a real store.
jest.mock('react-redux', () => ({ useSelector: jest.fn() }))

const setUser = (userInfo) =>
  useSelector.mockImplementation((sel) => sel({ userLogin: { userInfo } }))

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn()
})

describe('ChatWidget', () => {
  test('renders nothing when logged out', () => {
    setUser(null)
    const { container } = render(<ChatWidget />)
    expect(container.firstChild).toBeNull()
    expect(screen.queryByLabelText('Open assistant')).not.toBeInTheDocument()
  })

  test('logged-in: sends authed POST to relative endpoint and renders reply + route badge', async () => {
    setUser({ name: 'Jane Doe', token: 'jwt-abc', isAdmin: false })
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        response: 'Yes — the Airpods are $89.99 and we have 3 in stock.',
        route: 'cloud',
      }),
    })

    render(<ChatWidget />)

    // Open the panel.
    fireEvent.click(screen.getByLabelText('Open assistant'))

    // Type and send.
    fireEvent.change(screen.getByLabelText('Message'), {
      target: { value: 'Do you have the Airpods in stock?' },
    })
    fireEvent.click(screen.getByText('Send'))

    // The reply renders.
    await wait(() =>
      expect(screen.getByText(/Airpods are \$89\.99/)).toBeInTheDocument()
    )

    // Relative URL + authed POST with the bearer token.
    expect(global.fetch).toHaveBeenCalledTimes(1)
    const [url, opts] = global.fetch.mock.calls[0]
    expect(url).toBe('/api/assistant/chat')
    expect(opts.method).toBe('POST')
    expect(opts.headers.Authorization).toBe('Bearer jwt-abc')
    expect(JSON.parse(opts.body)).toEqual({
      message: 'Do you have the Airpods in stock?',
    })

    // Route badge visible.
    expect(screen.getByText(/cloud/i)).toBeInTheDocument()
  })

  test('shows a friendly error if the request fails', async () => {
    setUser({ name: 'Jane Doe', token: 'jwt-abc' })
    global.fetch.mockResolvedValue({ ok: false, status: 500 })

    render(<ChatWidget />)
    fireEvent.click(screen.getByLabelText('Open assistant'))
    fireEvent.change(screen.getByLabelText('Message'), {
      target: { value: 'hello' },
    })
    fireEvent.click(screen.getByText('Send'))

    await wait(() =>
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    )
  })
})
