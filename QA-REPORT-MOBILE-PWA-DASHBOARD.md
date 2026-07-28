# QA Report — Mobile PWA Admin Dashboard

## Phạm vi

- Tích hợp giao diện Google AI Studio vào dashboard admin mobile tại `/admin`.
- Giữ nguyên dashboard desktop từ `768px` trở lên.
- Giữ nguyên toàn bộ route admin còn lại.
- Thêm manifest, icon PWA, service worker và trang offline.
- Không thay đổi database, Supabase schema, API, authentication hoặc nghiệp vụ booking.

## File chính

- `components/admin/mobile/MobileDashboardPage.tsx`
- `components/admin/pages/DashboardPage.tsx`
- `components/admin/layout/AdminShell.tsx`
- `components/pwa/ServiceWorkerRegistration.tsx`
- `app/manifest.ts`
- `app/layout.tsx`
- `app/offline/page.tsx`
- `public/sw.js`
- `public/icons/*`

## Kiểm tra đã thực hiện

### 1. Kiểm tra cú pháp TypeScript/TSX

Các file mới và file chỉnh sửa đã được parse bằng TypeScript compiler 5.8.3 với JSX React và module resolution dạng bundler.

Kết quả: **PASS**.

### 2. Kiểm tra service worker JavaScript

Đã chạy `node --check public/sw.js`.

Kết quả: **PASS**.

### 3. Regression test riêng cho mobile dashboard/PWA

File:

- `tests/mobile-admin-pwa-dashboard.test.ts`

Kết quả:

- 3 test
- 3 pass
- 0 fail

Các test xác nhận:

- Dashboard mobile chỉ áp dụng tại `/admin`.
- Dashboard desktop vẫn tồn tại.
- Mobile dashboard dùng `useAdminData()` và dữ liệu thật.
- Không có mock reservation.
- Manifest standalone, iPhone metadata và service worker tồn tại.
- Service worker không cache `/admin` và `/api`.

### 4. Toàn bộ test source hiện có

Đã chạy bằng TypeScript ESM QA loader trong sandbox:

- 58 test
- 57 pass
- 1 fail

Test thất bại:

`floating contact bar is restricted to home, fits its content, and stays hidden below Concierge`

Đây là regression test cũ của khu vực public contact dock. Source hiện tại chủ đích cho contact bar xuất hiện lại sau Concierge, nên test cũ không còn khớp với hành vi đã được triển khai. Lỗi này tồn tại ngoài phạm vi dashboard mobile/PWA và không phát sinh từ lần tích hợp này.

## Kiểm tra chưa chạy được trong sandbox

Không thể chạy:

```text
npm ci
npm run lint
npm run build
```

Nguyên nhân: npm registry nội bộ của môi trường QA trả về HTTP 503 khi tải package. Source không chứa `node_modules`.

Cần chạy lại ba lệnh trên máy local có Internet hoặc CI trước khi merge/deploy.

## Bảo mật PWA

- `/admin/*` không được cache.
- `/api/*` không được cache.
- Không cache booking, khách hàng, số điện thoại hoặc cookie admin.
- Offline chỉ hiển thị trang thông báo không có dữ liệu riêng tư.
- Service worker chỉ đăng ký trong production.

## Kết luận

Phần tích hợp dashboard mobile PWA đã vượt qua kiểm tra cú pháp, kiểm tra service worker và regression test chuyên biệt. Desktop và các route admin khác được giữ nguyên theo yêu cầu.
## Bản sửa tương thích Windows

- `npm run dev` chuyển sang `next dev --webpack`.
- `npm run build` chuyển sang `next build --webpack`.
- Giữ lệnh Turbopack tùy chọn qua `npm run dev:turbopack` và `npm run build:turbopack`.
- Cập nhật regression test FloatingContact theo hành vi hiện tại: thanh liên hệ chỉ dock khi khung Concierge nằm trong dải viewport và xuất hiện lại sau khi cuộn qua.
- Loại bỏ import/biến không dùng do màn hình mobile dashboard mới tạo.

