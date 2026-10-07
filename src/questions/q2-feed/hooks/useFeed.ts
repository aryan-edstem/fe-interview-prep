import { createContext, useContext, useSyncExternalStore } from 'react';
import type { FeedStore } from '../feedStore';

/** Provided by the feed Page, above its nested routes, so the data outlives the list. */
export const FeedStoreContext = createContext<FeedStore | null>(null);

export function useFeed() {
  const store = useContext(FeedStoreContext);
  if (!store) throw new Error('useFeed must be used inside FeedStoreContext');
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot);
  return { ...state, loadMore: store.loadMore, retry: store.retry };
}
