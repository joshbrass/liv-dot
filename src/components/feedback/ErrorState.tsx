import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  title: string
  message: string
  onRetry: () => void
}

export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="space-y-3 rounded-lg border bg-card p-4">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-[13px] text-muted-foreground">{message}</p>
      </div>
      <Button size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}
