import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LifecycleStepper } from './LifecycleStepper'

describe('LifecycleStepper', () => {
  it('lists all six states and marks the current one with aria-current', () => {
    render(<LifecycleStepper status="ready" />)

    const steps = screen.getAllByRole('listitem')
    expect(steps).toHaveLength(6)

    const current = steps.find((step) => step.getAttribute('aria-current') === 'step')
    expect(current).toHaveTextContent('Ready for Streaming (current step)')
    expect(steps[1]).toHaveTextContent('Scheduled (completed)')
    expect(steps[3]).toHaveTextContent('Live (upcoming)')
  })
})
