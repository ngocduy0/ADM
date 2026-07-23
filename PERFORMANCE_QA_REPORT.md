# Báo cáo QA hiệu năng, validation và bảo mật

Ngày kiểm tra: 18/07/2026  
Múi giờ nghiệp vụ: Asia/Ho_Chi_Minh (UTC+7)

## 1. Kết luận lỗi hiệu năng ban đầu

Log được cung cấp cho thấy một thao tác nhỏ như đổi trạng thái booking đã kích hoạt `PUT /api/concierge` mất khoảng 14,9–26,1 giây. Endpoint này ghi lại đồng loạt venue, ảnh, bàn, khách hàng, booking và liên hệ, rồi tải lại toàn bộ dữ liệu. Khi một lần upsert Supabase lỗi mạng, client vẫn phải chờ chuỗi ghi dài và tiếp tục phát sinh nhiều GET/refetch. Đây là nguyên nhân chính gây cảm giác lag, render chậm và console nhiều cảnh báo.

Luồng nóng này đã được thay bằng mutation theo từng tài nguyên. Ví dụ đổi trạng thái chỉ cập nhật đúng booking; sửa venue chỉ cập nhật venue đó. Client không còn serialize toàn bộ dữ liệu lớn vào localStorage sau mỗi thay đổi.

## 2. Các kiểm thử tự động

Kết quả: **25/25 test đạt, 0 test thất bại**.

Phạm vi gồm:

- Chuyển đổi ngày giờ UTC+7.
- Giờ hoạt động qua đêm.
- Không hoàn tất trước giờ booking.
- Quy tắc không đến sau 30 phút.
- Luồng trạng thái hợp lệ/không hợp lệ và trạng thái kết thúc.
- Booking quá khứ và booking vượt 730 ngày.
- Số điện thoại Việt Nam, số khách và sức chứa.
- Venue/bàn không tồn tại, bàn ẩn và xung đột bàn 120 phút.
- Booking đã hủy không chặn slot.
- Chỉnh sửa booking lịch sử khi không đổi lịch.
- Validate venue, tọa độ, minimum spend và trùng bàn.
- Validate khách hàng và trùng số điện thoại.
- Session admin hợp lệ, cookie bị sửa và thiếu cookie.
- Rate limiting.

## 3. Kiểm tra chất lượng mã và build

- TypeScript `npx tsc --noEmit`: đạt.
- ESLint `npm run lint -- --quiet`: đạt, không có error.
- Production build `npm run build`: đạt.
- Next.js build dùng 4 worker để tránh nghẽn tài nguyên máy.

## 4. Smoke test production

Chạy production local không có thông tin Supabase thật, dữ liệu đọc dùng fallback có kiểm soát:

- API admin chưa đăng nhập trả `401` cho concierge, reservations và mutation booking.
- API venue public vẫn trả `200`.
- Đăng nhập admin trả `200`; cookie ký hợp lệ truy cập được API quản trị.
- Các route `/admin`, `/admin/bookings`, `/admin/venues`, `/admin/customers`, `/admin/reels`, `/admin/homepage`, `/admin/contacts`, `/admin/settings` và lịch booking đều trả `200`.
- Các route admin sau lần đầu phản hồi local khoảng 0,02–0,05 giây trong smoke test; lần đầu `/admin` khoảng 0,17 giây.

Các số này là smoke test route local, **không phải benchmark Supabase production**.

## 5. Ma trận validation trạng thái booking

| Trạng thái hiện tại | Trạng thái được phép tiếp theo |
|---|---|
| Mới | Đã liên hệ, Đã xác nhận, Đã hủy |
| Đã liên hệ | Đã xác nhận, Đã hủy |
| Đã xác nhận | Hoàn tất, Đã hủy, Không đến |
| Hoàn tất / Đã hủy / Không đến | Không được mở lại |

Điều kiện thời gian:

- `Hoàn tất`: chỉ từ đúng giờ booking trở đi.
- `Không đến`: chỉ từ 30 phút sau giờ booking.
- Tạo/dời lịch: không được về quá khứ và không vượt quá 730 ngày.
- Booking phải nằm trong giờ hoạt động của venue, có hỗ trợ khung giờ qua đêm.

## 6. Xử lý lỗi và tính nhất quán

- UI cập nhật nhanh theo optimistic update.
- Nếu API thất bại, dữ liệu UI rollback và hiển thị lỗi; không còn báo thành công trong khi chỉ giữ bản cache cục bộ.
- Form chỉ đóng sau khi lưu thành công.
- Public booking chỉ hiện thành công khi server thực sự nhận booking.
- Timeout Supabase mặc định 5 giây, tránh treo 15–26 giây cho từng bước ghi.

## 7. Giải thích console dev

- `[HMR] connected`, `Fast Refresh rebuilding/done` và React DevTools là log bình thường của `next dev`.
- `content-script.js WidgetId ...` là script do extension trình duyệt/Cốc Cốc inject; tắt extension hoặc mở cửa sổ ẩn danh để xác nhận.
- Production nên kiểm tra bằng `npm run build && npm start`; các log HMR/Fast Refresh không xuất hiện ở chế độ này.

## 8. Giới hạn kiểm thử

Không có credential Supabase production và dữ liệu tải thật trong môi trường QA này, nên chưa thực hiện load test trực tiếp lên database thật, đo P95/P99, kiểm thử đồng thời nhiều admin hoặc đánh giá network tại nơi deploy. Kiến trúc ghi toàn bộ gây nghẽn đã được loại bỏ, timeout/failure handling đã được thêm, nhưng hiệu năng production cuối cùng vẫn cần đo với môi trường Supabase và dữ liệu thật.

## 9. Biến môi trường khuyến nghị

```env
SUPABASE_REQUEST_TIMEOUT_MS=5000
CONCIERGE_READ_CACHE_TTL_MS=3000
NEXT_PUBLIC_ENABLE_SUPABASE_REALTIME=true
ADMIN_SESSION_MAX_AGE_SECONDS=1800
ADMIN_SESSION_SECRET=<chuỗi ngẫu nhiên dài>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key chỉ đặt ở server>
```
