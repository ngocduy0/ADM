# QA Report — Unified Mobile PWA Admin

## Phạm vi

Bản này mở rộng giao diện PWA từ riêng `/admin` sang toàn bộ hệ thống `/admin/*`, trong khi giữ nguyên giao diện desktop và toàn bộ API/Supabase/nghiệp vụ hiện có.

## Thay đổi chính

- Thêm `components/admin/mobile/MobileAdminChrome.tsx`.
- Ẩn Sidebar và TopNav desktop ở màn hình dưới 768px trên tất cả route admin.
- Thêm top bar mobile cố định có avatar DuyT, tên màn hình, tìm kiếm và chuông thông báo.
- Thêm bottom navigation cố định cho Tổng quan, Đặt chỗ, Lịch, Yêu cầu và menu Khác.
- Menu Khác chứa Bàn, Địa điểm, Khách hàng, Reels, Banners, Homepage, Kênh liên hệ, Tệp dữ liệu, Thông báo, Cài đặt và Đăng xuất.
- Dashboard mobile đổi logo tròn thành avatar DuyT và thêm thẻ hồ sơ trong menu Khác.
- Tối ưu PageHeader, card, input, safe area và spacing mobile dùng chung.
- Tối ưu lại card danh sách booking trên mobile để giảm khoảng trắng và bố cục giống app hơn.
- Bump service worker cache thành `duyt-admin-static-v2` và thêm avatar vào static assets.
- Cập nhật regression test để xác nhận app shell mobile hoạt động trên toàn bộ route admin.

## Giữ nguyên

- Database và Supabase schema.
- AdminDataProvider và Supabase Realtime.
- API contract.
- Cookie HTTP-only và authentication.
- Booking rules, business session, timezone và chống spam.
- Giao diện desktop từ 768px trở lên.
- Route URL hiện tại.

## Kiểm tra đã thực hiện trong sandbox

- Parse cú pháp TypeScript/TSX cho các file thay đổi: đạt.
- Regression test PWA mobile admin: 3/3 đạt.
- Kiểm tra manifest/service worker private-data-safe: đạt trong regression test.

Môi trường sandbox không cài đầy đủ dependency để chạy `npm run lint` và `npm run build`. Cần chạy lại trên máy phát triển sau khi giải nén.

## Kiểm tra bắt buộc trên máy

```powershell
npm install
npm run test
npm run lint
npm run build
npm run dev
```

Next.js đã được cấu hình dùng Webpack cho `dev` và `build`, phù hợp với máy Windows gặp lỗi native SWC/Turbopack.

## Kịch bản kiểm thử iPhone

1. Mở `/admin` và kiểm tra avatar, dashboard và bottom navigation.
2. Mở lần lượt Đặt chỗ, Lịch và Yêu cầu; top bar và bottom navigation phải giữ nguyên.
3. Mở Khác và truy cập Bàn, Địa điểm, Khách hàng, Reels, Banners, Homepage, Liên hệ, Tệp dữ liệu, Thông báo và Cài đặt.
4. Kiểm tra badge Yêu cầu và badge Thông báo.
5. Nhấn tìm kiếm, nhập số điện thoại hoặc tên khách và kiểm tra dữ liệu trang hiện tại.
6. Kiểm tra form/modal không bị bàn phím hoặc Home Indicator che.
7. Kiểm tra desktop từ 768px trở lên vẫn dùng sidebar cũ.
8. Build production, thêm PWA vào Home Screen và thử lại ở chế độ standalone.
