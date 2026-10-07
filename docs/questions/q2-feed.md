# Q2 — Infinite Feed

Route: `/feed` · Branch: `feature/q2-feed`

Build a feed of posts that loads more as the user scrolls.

## Requirements

- Load posts from https://dummyjson.com/posts, 10 at a time.
- Load the next page automatically when the user nears the bottom.
- Scrolling fast must never load the same page twice or show duplicate posts.
- Show loading, error (with retry) and "You've reached the end" states.
- Clicking a post opens its detail page. Going back returns the user to the same scroll position.

## Acceptance criteria

- Scrolling quickly to the bottom several times produces no duplicate requests or posts.
- At least one automated test.
