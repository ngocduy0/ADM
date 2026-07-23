# QA report — Booking availability

Ngày QA: 19/07/2026

## Kết quả
- Unit tests: 30/30 pass.
- ESLint: pass, không có lỗi.
- Next.js production build: compiled, TypeScript pass, static generation pass.
- Route mới: `/api/reservations/availability` xuất hiện trong production route manifest.

## Luồng đã kiểm tra bằng code/rules
- Booking cùng bàn trong khoảng khóa bị backend từ chối, kể cả khi client bị bypass.
- Booking đã hủy hoặc no-show không khóa bàn.
- Sửa booking loại trừ chính booking hiện tại khỏi kiểm tra xung đột.
- Bàn đã có lịch vẫn nằm trong dropdown nhưng bị disabled.
- Giờ đã bị chiếm đối với bàn đang chọn vẫn nằm trong dropdown nhưng bị disabled.
- Tự chọn bàn trống ưu tiên cùng khu.
- Booking tương lai do admin nhập sử dụng đúng ngày được chọn để tính availability.
- Số điện thoại Việt Nam và E.164 quốc tế được backend xác thực.
- Phân hạng khách hiển thị theo chi tiêu hoàn tất và hệ số khu vực.

## Lưu ý cấu hình nghiệp vụ
Các hằng số có thể chỉnh tại `lib/booking-rules.ts` và `lib/customer-tier.ts`:
- Phiên bàn: 270 phút.
- Buffer trước/sau: 30/30 phút.
- VIP/VVIP/ELITE: 10/30/80 triệu chi tiêu quy đổi.
