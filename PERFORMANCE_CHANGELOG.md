# Performance & Validation Changelog

## 1. Luồng lưu dữ liệu

- Thay việc gửi và ghi lại toàn bộ dữ liệu hệ thống qua `PUT /api/concierge` bằng API theo từng tài nguyên.
- Booking dùng `/api/reservations` và `/api/reservations/[id]`.
- Địa điểm dùng `/api/venues` và `/api/venues/[id]`.
- Khách hàng dùng `/api/customers` và `/api/customers/[id]`.
- Cập nhật trạng thái booking chỉ đọc booking cần thiết và ghi một trường trạng thái.
- Chỉ giữ API bulk import/reset cho trường hợp quản trị dữ liệu đặc biệt.
- Bỏ việc ghi toàn bộ venue, ảnh và booking lớn vào `localStorage` sau mỗi thao tác.
- Thao tác admin dùng optimistic update và rollback khi server từ chối.

## 2. Supabase và render

- Thêm timeout có kiểm soát cho Supabase, mặc định 5 giây.
- Đọc dữ liệu server song song, dùng map tra cứu và cache ngắn hạn.
- Gộp/deduplicate yêu cầu refresh, hạn chế refresh ngay sau mutation của chính client.
- Polling dự phòng giảm còn mỗi 5 phút; realtime vẫn là kênh cập nhật chính khi được bật.
- Dùng Turbopack cho `npm run dev`; giữ `npm run dev:webpack` làm phương án dự phòng.
- Giới hạn worker build còn 4 để tránh nghẽn CPU/RAM trên máy phát triển.

## 3. Validation nghiệp vụ

- Chuẩn hóa múi giờ nghiệp vụ `Asia/Ho_Chi_Minh` (UTC+7).
- Không cho tạo hoặc dời booking về quá khứ.
- Không cho đặt ngoài giờ hoạt động, bàn ẩn, sai địa điểm hoặc vượt sức chứa.
- Ngăn trùng bàn trong khoảng quay vòng 120 phút.
- Không cho `Hoàn tất` trước giờ booking.
- Chỉ cho `Không đến` sau giờ booking 30 phút.
- Không cho bỏ qua quy trình trạng thái hoặc mở lại booking đã kết thúc.
- Validate tên, số điện thoại Việt Nam, số khách, ngày, giờ, ghi chú và dữ liệu venue.
- Validation chạy ở cả UI/provider và API server.

## 4. Bảo mật API

- Bảo vệ các API quản trị bằng session cookie có chữ ký.
- Public booking không được tự đặt ID, trạng thái, nguồn hoặc thông tin bàn/địa điểm giả.
- Giới hạn 8 yêu cầu booking trên mỗi IP trong 10 phút.
- View count được tăng ở server và có giới hạn tần suất.
- Thông báo booking được tạo ở server, không mở API ghi thông báo cho public.

## 5. Console

- Giảm log fallback lặp lại; cảnh báo lưu server được throttle trong môi trường dev.
- Các dòng `Fast Refresh`, `[HMR] connected` và React DevTools là log của Next.js dev mode.
- Các dòng `content-script.js WidgetId` đến từ extension trình duyệt/Cốc Cốc, không thuộc source ứng dụng.
