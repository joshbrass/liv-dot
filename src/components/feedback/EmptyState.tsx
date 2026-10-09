interface EmptyStateProps {
  title: string
  description: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="px-4 py-6 text-center">
      <p className="text-[13px] font-medium">{title}</p>
      <p className="text-[13px] text-muted-foreground">{description}</p>
    </div>
  )
}
