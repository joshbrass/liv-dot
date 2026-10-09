import { TooltipProvider } from '@/components/ui/tooltip'

export function App() {
  return (
    <TooltipProvider>
      <main className="mx-auto max-w-5xl p-6">
        <h1 className="text-2xl font-semibold">LIV DOT · Host Event Dashboard</h1>
      </main>
    </TooltipProvider>
  )
}
