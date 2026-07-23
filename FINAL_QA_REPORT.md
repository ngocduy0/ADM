# Final QA Report

Ngày kiểm tra: 2026-07-18

## Automated checks

- `npx tsc --noEmit`: PASS
- `npm run lint -- --quiet`: PASS (không có ESLint error)
- `npm run build`: PASS; Next.js compile và TypeScript production build hoàn tất, route mới `/admin/venues/[venueId]/layout` được nhận diện.

## HTTP smoke tests

Chạy production server cục bộ với tài khoản QA tạm thời:

- `/login`: 200
- `/admin/venues` khi chưa đăng nhập: 307 về `/login`
- Đăng nhập sai: 401
- Đăng nhập đúng: 200 và nhận session cookie
- `/admin`: 200
- `/admin/bookings`: 200
- `/admin/venues`: 200
- `/admin/reels`: 200
- `/admin/homepage`: 200
- `/admin/contacts`: 200
- `/admin/notifications`: 200
- `/admin/venues/venue-1/layout`: 200
- `/vi`: 200
- `/vi/dia-diem`: 200
- `/api/site-settings`: 200, cấu hình normalize trả về 7 kênh gồm nút gọi điện
- `/api/concierge`: 200

## Functional code-path checks

- Floating contact được render có điều kiện `activeView === 'HOME'`.
- Phone channel được thêm và normalize cho dữ liệu cài đặt cũ chưa có `tel:`.
- Notification mang `reservationId` vào URL booking.
- Booking page nhận `bookingId`, tính đúng trang phân trang, scroll và highlight item.
- Venue card điều hướng sang route sơ đồ riêng.
- Floor-plan editor lưu thay đổi thông qua `saveVenue` của AdminDataProvider.

## Ghi chú môi trường

Smoke test không kết nối Supabase production vì gói bàn giao không chứa secret. Khi chạy trong dự án thật, giữ nguyên `.env.local` hiện tại để dữ liệu thật, upload và realtime hoạt động.
