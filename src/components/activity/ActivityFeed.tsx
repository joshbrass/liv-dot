import type { Notice, RetryIntent } from '@/state/types'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ActivityEntry } from './ActivityEntry'
import { useFirstSeenTimes } from './useFirstSeenTimes'

interface ActivityFeedProps {
  notices: Notice[]
  onDismiss: (id: number) => void
  onRetry: (intent: RetryIntent) => void
}

/**
 * System feedback as a timeline. The section is a polite live region that is mounted with the
 * dashboard, so new entries are announced; errors additionally use role="alert".
 */
export function ActivityFeed({ notices, onDismiss, onRetry }: ActivityFeedProps) {
  const seenAt = useFirstSeenTimes(notices.map(({ id }) => id))

  return (
    <section
      aria-labelledby="activity-title"
      aria-live="polite"
      className="rounded-lg border bg-card"
    >
      <h2 id="activity-title" className="border-b px-4 py-3 text-sm font-semibold">
        Activity
      </h2>
      {notices.length === 0 ? (
        <EmptyState
          title="No activity yet"
          description="Status changes and failed requests will show up here."
        />
      ) : (
        <ol className="p-4">
          {notices.map((notice) => (
            <ActivityEntry
              key={notice.id}
              notice={notice}
              seenAt={seenAt.get(notice.id)}
              onDismiss={onDismiss}
              onRetry={onRetry}
            />
          ))}
        </ol>
      )}
    </section>
  )
}
