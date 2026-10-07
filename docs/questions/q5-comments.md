# Q5 — Comments with Offline Support

Route: `/comments` · Branch: `feature/q5-comments`

Build a comment thread that feels instant and keeps working without a network connection.

## Requirements

- Mock a comments API (any approach) that is slow (1–2 seconds) and fails about 20% of the time.
- A new comment appears immediately when posted, marked as "sending" until the server confirms it.
- If sending fails, the comment stays visible, marked as failed, with a retry button.
- While offline, new comments are queued and sent automatically, in order, when the connection
  returns.
- Queued comments survive a page refresh.
- Retries must never create duplicate comments on the server.

## Acceptance criteria

- Going offline, posting 3 comments and coming back online sends all 3 in order, with no
  duplicates.
- At least one automated test.
