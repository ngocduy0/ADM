# DuyT Booking — Admin Refactor

Phần quản trị đã được tách hoàn toàn khỏi giao diện người dùng và chuyển sang kiến trúc nhiều route của Next.js App Router.

## Route quản trị

- `/admin` — Tổng quan
- `/admin/bookings` — Quản lý đặt chỗ
- `/admin/bookings/calendar` — Lịch đặt chỗ theo tuần
- `/admin/customers` — Khách hàng
- `/admin/venues` — Địa điểm
- `/admin/tables` — Bàn và khu vực
- `/admin/reels` — Reels
- `/admin/reels/new` — Tạo/chỉnh sửa Reel
- `/admin/banners` — Banner trang chủ
- `/admin/homepage` — Nội dung homepage
- `/admin/requests` — Yêu cầu cần xử lý
- `/admin/notifications` — Thông báo
- `/admin/data-files` — Sao lưu/import/export dữ liệu
- `/admin/settings` — Logo và nhận diện hệ thống

## Logo toàn hệ thống

Vào **Admin → Cài đặt → Logo toàn hệ thống**, upload logo hoặc nhập URL rồi nhấn **Lưu thay đổi**. Logo được lưu qua API site settings và được dùng ở trang đăng nhập, sidebar admin, header/footer website người dùng. Layout admin và frontend người dùng vẫn độc lập.

## Chạy dự án

```bash
npm install
npm run dev
```

Tài khoản admin lấy từ `.env.local`:

```env
ADMIN_EMAIL=admin@duyt.vn
ADMIN_PASSWORD=your-secure-password
ADMIN_SESSION_SECRET=your-long-random-secret
```

## Kiểm tra đã thực hiện

- `npx tsc --noEmit`: đạt
- `npm run build`: đạt
- Smoke test đăng nhập, cookie admin, `/admin` và `/admin/settings`: đạt
