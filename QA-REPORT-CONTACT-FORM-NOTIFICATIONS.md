# QA report — Contact form + Admin notifications

## Scope
- Public contact form now sends a real server request instead of showing a fake local success state.
- Contact submissions are stored in the existing `AdminNotification` table, so no database migration is required.
- Admin receives a bell notification, unread badge, toast and fallback polling when a contact request arrives.
- `/admin/requests` now shows contact-form requests with name, email, message, request code and a reply-by-email action.
- Dashboard `Cần xử lý` and sidebar `Yêu cầu` badges include unread contact requests.

## Safety and performance
- Server-side validation, 15-minute IP rate limit and honeypot field.
- Message length capped at 1,500 characters.
- Contact notification refresh uses Supabase Realtime when available and a lightweight 30-second fallback poll.
- Existing booking, venue, table-map and contact-dock behavior is not modified by this change.

## Manual checks
1. Open `/vi/lien-he`, enter a valid name, email and message, then submit.
2. Confirm loading state, success panel and `LH-...` request code.
3. Open `/admin`; confirm the bell and `Yêu cầu` badges increase.
4. Open `/admin/requests`; confirm the contact card and email reply action.
5. Mark the item as viewed and confirm unread badges decrease.
