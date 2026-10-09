import { useContext } from 'react'
import { EventDashboardContext, type EventDashboardContextValue } from './eventDashboardContext'

export function useEventDashboard(): EventDashboardContextValue {
  const value = useContext(EventDashboardContext)
  if (!value) throw new Error('useEventDashboard must be used inside <EventProvider>')
  return value
}
