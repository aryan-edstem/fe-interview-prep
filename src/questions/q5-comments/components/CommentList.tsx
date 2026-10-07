import type { ThreadEntry } from '../types';
import { CommentItem } from './CommentItem';

export interface CommentListProps {
  thread: readonly ThreadEntry[];
  online: boolean;
  currentAuthor: string;
  now: number;
  onRetry: (clientId: string) => void;
  onDiscard: (clientId: string) => void;
}

export function CommentList({ thread, ...itemProps }: CommentListProps) {
  return (
    <ul aria-label="Comments" className="divide-y divide-slate-100">
      {thread.map((entry) => (
        <CommentItem
          key={entry.kind === 'confirmed' ? entry.comment.clientId : entry.item.clientId}
          entry={entry}
          {...itemProps}
        />
      ))}
    </ul>
  );
}
