import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { EventProvider } from '@/state/EventProvider'
import { createTestApi } from '@/test/fixtures'
import { EventDashboard } from './EventDashboard'

function renderDashboard() {
  render(
    <TooltipProvider>
      <EventProvider api={createTestApi('almost_ready')}>
        <EventDashboard />
      </EventProvider>
    </TooltipProvider>,
  )
}

function activity(): HTMLElement {
  return screen.getByRole('region', { name: 'Activity' })
}

async function openDemoControls() {
  await userEvent.click(screen.getByRole('button', { name: 'Demo controls' }))
}

describe('EventDashboard', () => {
  it('takes the host from "almost ready" to live', async () => {
    renderDashboard()

    expect(screen.getByText('Loading event…')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Midnight Jazz Session' })).toBeVisible()
    expect(screen.getByText(/Ticket pricing isn.t set yet/)).toBeVisible()

    await userEvent.click(screen.getByRole('button', { name: /Set pricing/ }))
    expect(await within(activity()).findByText(/Ready for streaming/)).toBeVisible()
    expect(screen.getByText('3 of 3 requirements met')).toBeVisible()

    await userEvent.click(screen.getByRole('button', { name: 'Go live' }))
    expect(await within(activity()).findByText(/You are live/)).toBeVisible()
    expect(screen.getByRole('banner')).toHaveTextContent('Live')
  })

  it('explains a regression when a requirement is removed behind the host', async () => {
    renderDashboard()
    await screen.findByRole('heading', { name: 'Midnight Jazz Session' })

    await userEvent.click(screen.getByRole('button', { name: /Set pricing/ }))
    await within(activity()).findByText(/Ready for streaming/)

    await openDemoControls()
    await userEvent.click(screen.getByRole('switch', { name: 'Streaming ingest configured' }))

    expect(await within(activity()).findByText(/Moved back to Scheduled/)).toBeVisible()
    expect(within(activity()).getByText(/no longer ready for streaming/)).toHaveTextContent(
      'Streaming ingest is not configured.',
    )
  })

  it('surfaces a forced failure with a retry that recovers', async () => {
    renderDashboard()
    await screen.findByRole('heading', { name: 'Midnight Jazz Session' })

    await openDemoControls()
    await userEvent.click(screen.getByRole('switch', { name: /Fail the next request/ }))
    await userEvent.click(screen.getByRole('button', { name: /Set pricing/ }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Ticket pricing update failed')

    await userEvent.click(within(alert).getByRole('button', { name: 'Retry' }))
    expect(await within(activity()).findByText(/Ready for streaming/)).toBeVisible()
  })
})
