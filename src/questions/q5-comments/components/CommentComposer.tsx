import { useId, useState, type FormEvent } from 'react';

export interface CommentComposerProps {
  online: boolean;
  onSubmit: (body: string) => void;
}

export function CommentComposer({ online, onSubmit }: CommentComposerProps) {
  const [body, setBody] = useState('');
  const id = useId();
  const trimmed = body.trim();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmed) return;
    onSubmit(trimmed);
    setBody('');
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <label htmlFor={`${id}-body`} className="block text-sm font-medium text-slate-900">
        Add a comment
      </label>
      <textarea
        id={`${id}-body`}
        aria-describedby={`${id}-hint`}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={1000}
        className="mt-2 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p id={`${id}-hint`} className="text-xs text-slate-500">
          {online
            ? 'Comments appear right away and are confirmed once the server saves them.'
            : "You're offline — comments are queued and sent when you reconnect."}
        </p>
        <button
          type="submit"
          disabled={!trimmed}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Post comment
        </button>
      </div>
    </form>
  );
}
