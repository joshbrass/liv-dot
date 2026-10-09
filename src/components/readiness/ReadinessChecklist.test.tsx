import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  evaluateRequirementChange,
  getReadinessSummary,
  listRequirements,
  type Event,
  type Requirements,
} from '@/domain'
import { buildDraftEvent, buildPublishedEvent, buildRequirements } from '@/test/fixtures'
import { ReadinessChecklist } from './ReadinessChecklist'

function renderChecklist(requirements: Requirements, event: Event = buildDraftEvent()) {
  const onChange = vi.fn()
  render(
    <ReadinessChecklist
      requirements={listRequirements(requirements)}
      summary={getReadinessSummary(requirements)}
      lock={evaluateRequirementChange({ event, requirements })}
      onChange={onChange}
    />,
  )
  return { onChange }
}

function row(name: string): HTMLElement {
  const item = screen.getByText(new RegExp(`^${name}`)).closest('li')
  if (!item) throw new Error(`No checklist row for ${name}`)
  return item
}

describe('ReadinessChecklist', () => {
  it('renders satisfied, missing, pending and failed requirements distinctly', () => {
    renderChecklist(
      buildRequirements(
        { ingest: false, pricing: false },
        { pricing: { status: 'error', message: 'Service unavailable' } },
      ),
    )

    expect(within(row('Production crew')).getByText('Done')).toBeVisible()
    expect(within(row('Streaming ingest')).getByText(/Missing/)).toBeVisible()
    expect(within(row('Ticket pricing')).getByText(/Update failed/)).toBeVisible()
    expect(within(row('Ticket pricing')).getByText(/Service unavailable/)).toBeVisible()
  })

  it('shows a pending requirement as saving, without an action', () => {
    renderChecklist(buildRequirements({ crew: false }, { crew: { status: 'pending' } }))

    expect(within(row('Production crew')).getByText('Saving…')).toBeVisible()
    expect(within(row('Production crew')).queryByRole('button')).not.toBeInTheDocument()
  })

  it('summarises progress as "n of 3 requirements met"', () => {
    renderChecklist(buildRequirements({ crew: false, ingest: false }))

    expect(screen.getByText('1 of 3 requirements met')).toBeVisible()
    expect(screen.getByRole('progressbar', { name: '1 of 3 requirements met' })).toHaveAttribute(
      'aria-valuenow',
      '1',
    )
  })

  it('configures a missing requirement', async () => {
    const { onChange } = renderChecklist(buildRequirements({ ingest: false }))

    await userEvent.click(screen.getByRole('button', { name: /Configure ingest/ }))

    expect(onChange).toHaveBeenCalledWith('ingest', true)
  })

  it('locks every requirement once the event is live, and says why', () => {
    renderChecklist(buildRequirements({ ingest: false }), buildPublishedEvent('live'))

    expect(screen.getByText('Requirements are locked because the event is Live.')).toBeVisible()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
