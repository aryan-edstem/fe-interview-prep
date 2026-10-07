# Q4 — Live Dashboard

Route: `/dashboard` · Branch: `feature/q4-dashboard`

Build a dashboard whose widgets refresh with live data.

## Requirements

- Mock an API (any approach) that returns sales, active users and recent orders, with values that
  change on every call.
- Show at least 3 widgets: a sales number, an active-users chart and a recent-orders list.
- Refresh the data every 5 seconds. Pause refreshing while the browser tab is hidden, and resume
  when it's visible again.
- Newer data on screen is never replaced by an older, late response, and requests don't pile up
  when the API is slow.
- Users can show or hide widgets, and their choice survives a refresh.
- Updating one widget's data should not re-render the widgets whose data didn't change.

## Acceptance criteria

- Switching to another tab stops the requests (visible in the Network tab), and they resume on
  return.
- At least one automated test.
