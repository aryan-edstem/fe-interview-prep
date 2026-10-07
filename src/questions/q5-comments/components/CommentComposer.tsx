import { useId, useState, type FormEvent, type KeyboardEvent } from 'react';

export interface CommentComposerProps {
  online: boolean;
  onSubmit: (body: string) => void;
}

const MAX_LENGTH = 1000;

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

  // Ctrl/Cmd+Enter posts, the usual shortcut for multi-line comment boxes.
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor={`${id}-body`} className="label">
        Add a comment
      </label>
      <textarea
        id={`${id}-body`}
        aria-describedby={`${id}-hint`}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={3}
        maxLength={MAX_LENGTH}
        placeholder="Share an update or ask a question…"
        className="input resize-y"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p id={`${id}-hint`} className="field-hint mt-0">
          {online
            ? 'Ctrl/Cmd + Enter to post. Comments appear right away and are confirmed once saved.'
            : "You're offline — comments are queued and sent when you reconnect."}
          <span className="ml-2 text-slate-400 tabular-nums">
            {body.length}/{MAX_LENGTH}
          </span>
        </p>
        <button type="submit" disabled={!trimmed} className="btn btn-primary">
          Post comment
        </button>
      </div>
    </form>
  );
}
