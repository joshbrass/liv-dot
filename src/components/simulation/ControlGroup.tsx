import type { ReactNode } from 'react'

interface ControlGroupProps {
  title: string
  children: ReactNode
}

export function ControlGroup({ title, children }: ControlGroupProps) {
  return (
    <section className="space-y-2.5">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h3>
      {children}
    </section>
  )
}
