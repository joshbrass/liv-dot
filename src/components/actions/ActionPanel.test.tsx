import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  NOW,
  buildDraftEvent,
  buildLoadedDashboard,
  buildPublishedEvent,
  buildRequirements,
} from '@/test/fixtures'
import { toDateTimeLocalValue } from '@/lib/format'
import { ActionPanel } from './ActionPanel'

describe('ActionPanel', () => {
  it('explains why "Go live" is blocked and links to the missing requirement', async () => {
    const onRun = vi.fn()
    const data = buildLoadedDashboard({ requirements: buildRequirements({ crew: false }) })
    render(<ActionPanel data={data} onRun={onRun} now={NOW} />)

    const button = screen.getByRole('button', { name: 'Go live' })
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).toHaveAccessibleDescription(
      'No production crew is assigned yet. Assign a crew to continue.',
    )
    expect(screen.getByText('1 requirement left before you can go live.')).toBeVisible()
    expect(screen.getByRole('link', { name: /No production crew/ })).toHaveAttribute(
      'href',
      '#requirement-crew',
    )

    await userEvent.click(button)
    expect(onRun).not.toHaveBeenCalled()
  })

  it('runs the action when it is allowed', async () => {
    const onRun = vi.fn()
    const data = buildLoadedDashboard({ event: buildPublishedEvent('ready') })
    render(<ActionPanel data={data} onRun={onRun} now={NOW} />)

    await userEvent.click(screen.getByRole('button', { name: 'Go live' }))

    expect(onRun).toHaveBeenCalledWith({ actionId: 'goLive' })
    expect(screen.queryByText('Why this is unavailable')).not.toBeInTheDocument()
  })

  it('shows progress and ignores repeat clicks while the action is pending', async () => {
    const onRun = vi.fn()
    const data = buildLoadedDashboard({
      event: buildPublishedEvent('ready'),
      transition: { status: 'pending', command: { actionId: 'goLive' } },
    })
    render(<ActionPanel data={data} onRun={onRun} now={NOW} />)

    const button = screen.getByRole('button', { name: 'Going live…' })
    expect(button).toHaveAttribute('aria-busy', 'true')

    await userEvent.click(button)
    expect(onRun).not.toHaveBeenCalled()
  })

  it('requires a future start time before a draft can be scheduled', async () => {
    const onRun = vi.fn()
    const data = buildLoadedDashboard({ event: buildDraftEvent({ startsAt: null }) })
    render(<ActionPanel data={data} onRun={onRun} now={NOW} />)

    expect(screen.getByText('Set a start date and time for the event.')).toBeVisible()

    const startsAt = new Date(NOW.getTime() + 24 * 60 * 60 * 1000)
    fireEvent.change(screen.getByLabelText('Start date and time'), {
      target: { value: toDateTimeLocalValue(startsAt.toISOString()) },
    })
    await userEvent.click(screen.getByRole('button', { name: 'Schedule event' }))

    expect(onRun).toHaveBeenCalledWith({ actionId: 'schedule', startsAt: startsAt.toISOString() })
  })

  it('shows the last failure inline so the state is never ambiguous', () => {
    const data = buildLoadedDashboard({
      event: buildPublishedEvent('ready'),
      transition: { status: 'error', command: { actionId: 'goLive' }, message: 'Ingest down' },
    })
    render(<ActionPanel data={data} onRun={vi.fn()} now={NOW} />)

    expect(screen.getByText('Last attempt failed: Ingest down')).toBeVisible()
  })

  it('offers nothing once the replay is available', () => {
    const data = buildLoadedDashboard({ event: buildPublishedEvent('replay_available') })
    render(<ActionPanel data={data} onRun={vi.fn()} now={NOW} />)

    expect(screen.getByText('The replay is available to ticket holders.')).toBeVisible()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
