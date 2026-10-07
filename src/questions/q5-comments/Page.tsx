import { CommentComposer } from './components/CommentComposer';
import { CommentList } from './components/CommentList';
import { OfflineBanner } from './components/OfflineBanner';
import { CURRENT_AUTHOR, useComments, type OutboxSummary } from './hooks/useComments';
import { useNow } from './hooks/useNow';

function describeOutbox({ queued, sending, failed }: OutboxSummary, online: boolean): string {
  const parts: string[] = [];
  if (sending) parts.push(`Sending ${sending} comment…`);
  if (failed) parts.push(`${failed} comment failed to send.`);
  if (queued) {
    parts.push(
      `${queued} ${queued === 1 ? 'comment' : 'comments'} queued${online ? '.' : ' until you reconnect.'}`,
    );
  }
  return parts.join(' ');
}

function ThreadSkeleton() {
  return (
    <div role="status" aria-label="Loading comments" className="space-y-5 px-4 py-5 sm:px-5">
      {[0, 1].map((row) => (
        <div key={row} className="flex gap-3">
          <div className="skeleton size-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3 w-32" />
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CommentsPage() {
  const { online, load, reload, thread, summary, post, retry, discard } = useComments();
  const now = useNow();
  const status = describeOutbox(summary, online);
  const confirmedCount = thread.filter((entry) => entry.kind === 'confirmed').length;

  return (
    <div className="page max-w-3xl">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Question 5</p>
          <h1 className="page-title">Offline comments</h1>
          <p className="page-description">
            New comments show up instantly, wait in a queue while you're offline and are sent in
            order once you're back.
          </p>
        </div>
      </header>

      <div className="space-y-4">
        {!online && <OfflineBanner queued={summary.queued} />}

        <section aria-labelledby="thread-heading" className="card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2">
              <h2 id="thread-heading" className="section-title">
                Thread
              </h2>
              {load.kind === 'loaded' && (
                <span className="badge badge-neutral">{confirmedCount}</span>
              )}
            </div>
            {/* Announces queue progress (sending, failed, queued) to screen readers as it changes. */}
            <p role="status" aria-live="polite" className="text-xs text-slate-500">
              {status}
            </p>
          </div>

          {load.kind === 'loading' && <ThreadSkeleton />}
          {load.kind === 'error' && (
            <div className="px-4 pt-4 sm:px-5">
              <div role="alert" className="alert alert-danger">
                <span>Couldn't load comments: {load.message}.</span>
                <button type="button" onClick={reload} className="btn btn-secondary btn-sm">
                  Try again
                </button>
              </div>
            </div>
          )}
          {load.kind === 'loaded' && thread.length === 0 && (
            <div className="p-4 sm:p-5">
              <div className="empty-state">
                <p className="font-medium text-slate-700">No comments yet</p>
                <p>Start the conversation below.</p>
              </div>
            </div>
          )}

          {thread.length > 0 && (
            <CommentList
              thread={thread}
              online={online}
              currentAuthor={CURRENT_AUTHOR}
              now={now}
              onRetry={retry}
              onDiscard={discard}
            />
          )}

          {/* Pinned to the bottom of the thread so it stays reachable in a long conversation. */}
          <div className="sticky bottom-0 rounded-b-xl border-t border-slate-200 bg-white/95 p-4 backdrop-blur sm:p-5">
            <CommentComposer online={online} onSubmit={post} />
          </div>
        </section>
      </div>
    </div>
  );
}
