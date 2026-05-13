import React from 'react'

/**
 * Skeleton loader component.
 * Renders animated placeholder rows instead of a spinner.
 * Falls back to a simple skeleton block when no specific layout is provided.
 */
const Loader = () => {
  return (
    <div aria-busy='true' role='status'>
      <span
        className='sr-only'
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
        }}
      >
        Loading...
      </span>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            marginBottom: 'var(--ps-space-3)',
            padding: 'var(--ps-space-3)',
            background: 'var(--ps-surface)',
            borderRadius: 'var(--ps-radius-md)',
            border: '1px solid var(--ps-border)',
          }}
        >
          <div
            className='ps-skeleton'
            style={{ height: '16px', width: '70%', marginBottom: 'var(--ps-space-1)' }}
          />
          <div
            className='ps-skeleton'
            style={{ height: '14px', width: '45%', marginBottom: 'var(--ps-space-1)' }}
          />
          <div
            className='ps-skeleton'
            style={{ height: '14px', width: '30%' }}
          />
        </div>
      ))}
    </div>
  )
}

export default Loader
