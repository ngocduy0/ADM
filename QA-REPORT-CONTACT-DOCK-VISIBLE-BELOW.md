# QA — Contact Dock visible again below Concierge

## Corrected behavior

- The floating contact row is visible in sections before the Concierge block.
- While the Concierge contact panel overlaps the central viewport band, the floating row docks into the panel and the panel contact cards become active.
- After scrolling past the Concierge block, the floating row appears again in every lower section.
- Scrolling upward applies the same behavior in reverse.
- The capsule uses `max-content`/`w-max`, so the black background stops immediately after the final contact item instead of leaving a long empty tail.

## Performance

- Modern browsers use one `IntersectionObserver`; no continuous scroll handler is used.
- The scroll + `requestAnimationFrame` path is only a fallback for browsers without `IntersectionObserver`.

## Scope

Only the contact dock behavior and shrink-wrapped capsule sizing were changed. Venue, table, booking, and API logic were not modified.
