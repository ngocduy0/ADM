# Reels order synchronization fix v4

## Root cause
The public homepage sorted reels with `Number(order) || 9999`. JavaScript treats `0` as falsy, so the reel at dashboard position 0 was moved to the end on the public website.

## Fix
- Preserve valid order value `0` with `Number.isFinite`.
- Apply the same ordering rule on homepage and venue detail.
- Add regression coverage so dashboard order and public order cannot diverge again.

No database migration is required. Existing reel order metadata remains valid.
