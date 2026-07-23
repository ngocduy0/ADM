# QA Report — DuyT Booking Admin Refinement

Ngày kiểm tra: 18/07/2026

## Phạm vi đã refactor

- Thiết kế lại màn **Đặt chỗ** theo dạng danh sách card, ưu tiên tên khách, số điện thoại, địa điểm, bàn/khu, thời gian, số khách và minimum spend.
- Thiết kế lại màn **Địa điểm** với thống kê tổng quan, card hình ảnh lớn, sức chứa, giờ mở cửa, số bàn, booking và thao tác sửa/sơ đồ/xóa.
- Đồng bộ lại màn **Reels** với bộ lọc trạng thái, lazy-load poster và không preload toàn bộ video.
- Nâng cấp màn **Homepage** thành trình cấu hình kéo thả section, bật/tắt section, chỉnh tiêu đề/mô tả, chọn địa điểm nổi bật và preview desktop/mobile.
- Thêm route **/admin/contacts** để quản lý số điện thoại, mạng xã hội, đường dẫn, trạng thái, thứ tự và upload icon.
- Dữ liệu Homepage và kênh liên hệ được lưu trong `SiteSetting` và được frontend người dùng đọc lại.
- Thanh liên hệ nhanh, trang liên hệ và màn hoàn tất booking phía người dùng sử dụng cấu hình do admin quản lý.
- Tối ưu tải admin: tải dữ liệu, settings và notifications song song; giảm polling từ 60 giây xuống 120 giây; không ghi lại localStorage sau mỗi lần realtime refresh; video Reels dùng `preload="none"/"metadata"`.

## Kiểm thử tự động

- `next build`: đạt, TypeScript đạt, tất cả route được tạo thành công.
- `npm run lint`: đạt exit code 0. Các cảnh báo còn lại chủ yếu là kiểu dữ liệu động từ Supabase, dependency effect cũ và biến không dùng trong phần legacy; không chặn build.
- Login page: HTTP 200.
- Admin chưa đăng nhập: redirect 307 về `/login`.
- Login đúng: API trả 200 và tạo HTTP-only cookie.
- Login sai: API trả 401.
- Các route `/admin`, `/admin/bookings`, `/admin/venues`, `/admin/reels`, `/admin/homepage`, `/admin/contacts`, `/admin/settings`: HTTP 200 sau đăng nhập.
- Frontend `/vi`: HTTP 200.
- API GET reservations, venues, concierge: HTTP 200 với fallback data khi không có biến Supabase.
- API PUT site settings không có phiên admin: HTTP 401.

## Yêu cầu môi trường production

Cần cấu hình tối thiểu:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Bảng `SiteSetting` cần cho phép lưu JSON mới gồm `homepageSections` và `contactChannels`. Cấu trúc cũ vẫn tương thích vì API tự bổ sung giá trị mặc định.

## Ghi chú QA

Smoke test được thực hiện ở mức production build, route, auth và API. Kiểm thử thao tác kéo thả/upload thực tế cần Supabase credentials và Storage bucket của môi trường triển khai.
