import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import type { EventApi, EventRecord } from '@/services/eventApi'
import { buildPublishedEvent, buildRecord, createTestApi } from '@/test/fixtures'
import { EventProvider } from './EventProvider'
import type { DashboardState } from './types'
import { useEventDashboard } from './useEventDashboard'

function renderDashboard(api: EventApi) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <EventProvider api={api}>{children}</EventProvider>
  )
  return renderHook(() => useEventDashboard(), { wrapper })
}

async function renderLoaded(api: EventApi) {
  const view = renderDashboard(api)
  await waitFor(() => expect(view.result.current.state.data.status).toBe('loaded'))
  return view
}

function statusOf(state: DashboardState): string | undefined {
  return state.data.status === 'loaded' ? state.data.event.status : undefined
}

describe('EventProvider', () => {
  it('shows a loading state, then the event from the API', async () => {
    const { result } = renderDashboard(createTestApi('almost_ready'))

    expect(result.current.state.data.status).toBe('loading')
    await waitFor(() => expect(statusOf(result.current.state)).toBe('scheduled'))
  })

  it('promotes the event when the last requirement is configured', async () => {
    const { result } = await renderLoaded(createTestApi('almost_ready'))

    await act(() => result.current.setRequirement('pricing', true))

    expect(statusOf(result.current.state)).toBe('ready')
    expect(result.current.state.notices[0]?.title).toBe('Ready for streaming')
  })

  it('fails the next request when failure injection is armed, then disarms', async () => {
    const { result } = await renderLoaded(createTestApi('ready'))

    act(() => result.current.setFailNextRequest(true))
    await act(() => result.current.runAction({ actionId: 'goLive' }))

    expect(statusOf(result.current.state)).toBe('ready')
    expect(result.current.state.notices[0]).toMatchObject({ title: 'Go live failed' })
    expect(result.current.state.failNextRequest).toBe(false)

    await act(() => {
      const [notice] = result.current.state.notices
      return notice?.retry ? result.current.retry(notice.retry) : Promise.resolve()
    })

    expect(statusOf(result.current.state)).toBe('live')
  })

  it('shows an error state when loading fails, and recovers on reload', async () => {
    const { result } = await renderLoaded(createTestApi('ready'))

    act(() => result.current.setFailNextRequest(true))
    await act(() => result.current.reload())
    expect(result.current.state.data.status).toBe('error')

    await act(() => result.current.reload())
    expect(statusOf(result.current.state)).toBe('ready')
  })

  it('ignores a response that resolves after the scenario was reset', async () => {
    let resolveSlowUpdate: (record: EventRecord) => void = () => undefined
    const api: EventApi = {
      ...createTestApi('almost_ready'),
      updateRequirement: () =>
        new Promise((resolve) => {
          resolveSlowUpdate = resolve
        }),
    }
    const { result } = await renderLoaded(api)

    let pendingUpdate: Promise<void> = Promise.resolve()
    act(() => {
      pendingUpdate = result.current.setRequirement('pricing', true)
    })
    await act(() => result.current.resetScenario('live'))
    await act(async () => {
      resolveSlowUpdate(buildRecord(buildPublishedEvent('ready')))
      await pendingUpdate
    })

    expect(statusOf(result.current.state)).toBe('live')
  })

  it('reports a simulated stream failure as an interruption', async () => {
    const { result } = await renderLoaded(createTestApi('live'))

    await act(() => result.current.simulateStreamFailure())

    expect(statusOf(result.current.state)).toBe('completed')
    expect(result.current.state.notices[0]?.title).toBe('Stream interrupted')
  })

  it('throws a helpful error when used outside the provider', () => {
    expect(() => renderHook(() => useEventDashboard())).toThrow(
      'useEventDashboard must be used inside <EventProvider>',
    )
  })
})
