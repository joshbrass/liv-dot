import { EventDashboard } from '@/components/EventDashboard'
import { TooltipProvider } from '@/components/ui/tooltip'
import { createMockApi } from '@/services/mockApi'
import { EventProvider } from '@/state/EventProvider'

const api = createMockApi()

export function App() {
  return (
    <TooltipProvider>
      <EventProvider api={api}>
        <EventDashboard />
      </EventProvider>
    </TooltipProvider>
  )
}
