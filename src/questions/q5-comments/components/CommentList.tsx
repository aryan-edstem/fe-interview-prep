import type { ThreadEntry } from '../types';
import { CommentItem } from './CommentItem';

export interface CommentListProps {
  thread: readonly ThreadEntry[];
  online: boolean;
  currentAuthor: string;
  onRetry: (clientId: string) => void;
  onDiscard: (clientId: string) => void;
}

export function CommentList({ thread, ...itemProps }: CommentListProps) {
  return (
    <ul aria-label="Comments" className="space-y-3">
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
