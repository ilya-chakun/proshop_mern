import React, { useState, useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Button, Form, Spinner, Badge } from 'react-bootstrap'

/**
 * Floating shop assistant widget (PLAN M5 / T5.1).
 *
 * Logged-in users only. POSTs to the RELATIVE `/api/assistant/chat` (so CRA's
 * dev proxy → backend works, and prod same-origin works) with
 * `Authorization: Bearer <token>`. Renders the assistant reply plus a route
 * badge (🔒 local / ☁️ cloud) so the privacy routing is visible in the UI.
 */
const ChatWidget = () => {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([]) // {from:'user'|'bot', text, route?}
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const endRef = useRef(null)

  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin || {}

  useEffect(() => {
    // jsdom (test env) doesn't implement scrollIntoView — guard it.
    if (endRef.current && typeof endRef.current.scrollIntoView === 'function') {
      endRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open])

  // Logged-out → render nothing (widget is private).
  if (!userInfo || !userInfo.token) return null

  const send = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    setMessages((m) => [...m, { from: 'user', text }])
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
        body: JSON.stringify({ message: text }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setMessages((m) => [
        ...m,
        { from: 'bot', text: data.response, route: data.route },
      ])
    } catch (err) {
      setError(err.message)
      setMessages((m) => [
        ...m,
        { from: 'bot', text: 'Sorry — something went wrong.', route: null },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='ps-chat-widget' data-testid='chat-widget'>
      {open ? (
        <div
          className='ps-chat-panel'
          style={{
            position: 'fixed',
            bottom: 90,
            right: 24,
            width: 340,
            maxHeight: 480,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--ps-surface, #fff)',
            border: '1px solid var(--ps-border, #ddd)',
            borderRadius: 12,
            boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
            zIndex: 1050,
          }}
        >
          <div
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid var(--ps-border, #eee)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontWeight: 600,
            }}
          >
            <span>
              <span role='img' aria-label='robot'>🤖</span> Shop Assistant
            </span>
            <Button
              variant='link'
              size='sm'
              aria-label='Close assistant'
              onClick={() => setOpen(false)}
              style={{ textDecoration: 'none' }}
            >
              ✕
            </Button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
            {messages.length === 0 && (
              <p style={{ color: 'var(--ps-text-muted, #888)', fontSize: 13 }}>
                Ask about products, your orders, or your profile.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  marginBottom: 10,
                  textAlign: m.from === 'user' ? 'right' : 'left',
                }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    padding: '6px 10px',
                    borderRadius: 10,
                    maxWidth: '85%',
                    fontSize: 14,
                    background:
                      m.from === 'user'
                        ? 'var(--ps-primary, #0d6efd)'
                        : 'var(--ps-bg-muted, #f1f1f1)',
                    color: m.from === 'user' ? '#fff' : 'inherit',
                  }}
                >
                  {m.text}
                </div>
                {m.from === 'bot' && m.route && (
                  <div style={{ marginTop: 2 }}>
                    <Badge variant={m.route === 'local' ? 'success' : 'info'}>
                      {m.route === 'local' ? '🔒 local' : '☁️ cloud'}
                    </Badge>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ textAlign: 'left' }}>
                <Spinner animation='border' size='sm' /> thinking…
              </div>
            )}
            {error && (
              <div style={{ color: 'var(--ps-danger, #dc3545)', fontSize: 12 }}>
                {error}
              </div>
            )}
            <div ref={endRef} />
          </div>

          <Form onSubmit={send} style={{ padding: 10, borderTop: '1px solid var(--ps-border, #eee)' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <Form.Control
                type='text'
                size='sm'
                placeholder='Type a message…'
                aria-label='Message'
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <Button type='submit' size='sm' disabled={loading || !input.trim()}>
                Send
              </Button>
            </div>
          </Form>
        </div>
      ) : null}

      <Button
        variant='primary'
        aria-label='Open assistant'
        onClick={() => setOpen((o) => !o)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          borderRadius: '50%',
          width: 56,
          height: 56,
          fontSize: 22,
          boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
          zIndex: 1050,
        }}
      >
        <span role='img' aria-label='chat'>
          💬
        </span>
      </Button>
    </div>
  )
}

export default ChatWidget
