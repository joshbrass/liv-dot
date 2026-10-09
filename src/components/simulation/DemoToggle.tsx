import { useId } from 'react'

interface DemoToggleProps {
  label: string
  description?: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}

export function DemoToggle({
  label,
  description,
  checked,
  disabled = false,
  onChange,
}: DemoToggleProps) {
  const id = useId()
  return (
    <div className="flex items-start gap-2.5">
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="peer mt-0.5 size-3.5 shrink-0 accent-primary disabled:cursor-not-allowed"
      />
      <label htmlFor={id} className="text-[13px] leading-tight peer-disabled:opacity-50">
        {label}
        {description && (
          <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
        )}
      </label>
    </div>
  )
}
