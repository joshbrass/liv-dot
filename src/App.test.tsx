import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from '@/App'

describe('App', () => {
  it('renders the dashboard shell with its breadcrumb', () => {
    render(<App />)
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toHaveTextContent('Events')
  })
})
