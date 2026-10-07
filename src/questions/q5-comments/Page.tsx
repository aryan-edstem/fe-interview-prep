import { CommentComposer } from './components/CommentComposer';
import { CommentList } from './components/CommentList';
import { OfflineBanner } from './components/OfflineBanner';
import { CURRENT_AUTHOR, useComments, type OutboxSummary } from './hooks/useComments';

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

export default function CommentsPage() {
  const { online, load, reload, thread, summary, post, retry, discard } = useComments();
  const status = describeOutbox(summary, online);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Offline comments</h1>
        <p className="mt-1 text-sm text-slate-600">
          New comments show up instantly, wait in a queue while you're offline and are sent in order
          once you're back.
        </p>
      </header>

      {!online && <OfflineBanner queued={summary.queued} />}

      <section aria-labelledby="thread-heading" className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="thread-heading" className="text-lg font-medium text-slate-900">
            Thread
          </h2>
          {/* Announces queue progress (sending, failed, queued) to screen readers as it changes. */}
          <p role="status" aria-live="polite" className="text-sm text-slate-600">
            {status}
          </p>
        </div>

        {load.kind === 'loading' && (
          <p role="status" className="text-sm text-slate-500">
            Loading comments…
          </p>
        )}
        {load.kind === 'error' && (
          <div
            role="alert"
            className="flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            <span>Couldn't load comments: {load.message}.</span>
            <button
              type="button"
              onClick={reload}
              className="rounded-md bg-red-700 px-3 py-1 font-medium text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
            >
              Try again
            </button>
          </div>
        )}
        {load.kind === 'loaded' && thread.length === 0 && (
          <p className="text-sm text-slate-500">No comments yet. Start the conversation.</p>
        )}

        {thread.length > 0 && (
          <CommentList
            thread={thread}
            online={online}
            currentAuthor={CURRENT_AUTHOR}
            onRetry={retry}
            onDiscard={discard}
          />
        )}
      </section>

      <CommentComposer online={online} onSubmit={post} />
    </div>
  );
}
