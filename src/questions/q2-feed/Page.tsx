import { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router';
import { FeedList } from './components/FeedList';
import { PostDetail } from './components/PostDetail';
import { createFeedStore } from './feedStore';
import { FeedStoreContext } from './hooks/useFeed';

export default function FeedPage() {
  // One store per visit to /feed/*: it survives switching between the list and a post.
  const [store] = useState(() => createFeedStore());

  useEffect(() => () => store.abort(), [store]);

  return (
    <FeedStoreContext value={store}>
      <Routes>
        <Route index element={<FeedList />} />
        <Route path=":postId" element={<PostDetail />} />
      </Routes>
    </FeedStoreContext>
  );
}
