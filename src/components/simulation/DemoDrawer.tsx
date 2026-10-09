import { FlaskConical } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { DEFAULT_SCENARIO, type ScenarioId } from '@/services/scenarios'
import { SimulationPanel, type SimulationPanelProps } from './SimulationPanel'

type DemoDrawerProps = Omit<SimulationPanelProps, 'activeScenario'>

/**
 * Reviewer-only controls behind a small floating button. The drawer is non-modal so the
 * dashboard stays visible and interactive while the backend is being changed underneath it.
 */
export function DemoDrawer({ onResetScenario, ...props }: DemoDrawerProps) {
  const [activeScenario, setActiveScenario] = useState<ScenarioId>(DEFAULT_SCENARIO)

  return (
    <Sheet modal={false}>
      <SheetTrigger asChild>
        <Button variant="outline" className="fixed right-4 bottom-4 z-40 bg-card shadow-sm">
          <FlaskConical aria-hidden />
          Demo controls
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[320px] gap-0 overflow-y-auto shadow-[-8px_0_24px_-16px_rgb(17_24_39/0.25)] sm:max-w-[320px]"
      >
        <SheetHeader className="border-b">
          <SheetTitle>Demo controls</SheetTitle>
          <SheetDescription>
            Simulate backend changes and failures. Not part of the host product.
          </SheetDescription>
        </SheetHeader>
        <SimulationPanel
          {...props}
          activeScenario={activeScenario}
          onResetScenario={(id) => {
            setActiveScenario(id)
            onResetScenario(id)
          }}
        />
      </SheetContent>
    </Sheet>
  )
}
