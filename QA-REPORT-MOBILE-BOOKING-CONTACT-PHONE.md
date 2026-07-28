# QA Report — Mobile Booking UX + Contact Phone

## Phạm vi sửa đổi

### 1. Form đặt chỗ trên điện thoại

- Modal đặt chỗ dùng toàn bộ `100dvh` trên màn hình nhỏ, không còn khung hẹp có khoảng trống hai bên.
- Tắt `backdrop-blur` của lớp nền trên mobile để giảm chi phí render.
- Bố cục mobile được chia thành 2 bước rõ ràng:
  1. **Bàn & thời gian**: bàn/khu, ngày, giờ, số khách.
  2. **Thông tin của bạn**: tên, số điện thoại, yêu cầu đặc biệt.
- Header được rút gọn; chi tiêu tối thiểu và sức chứa nằm trong hai ô tóm tắt nhỏ.
- Ngày và giờ hiển thị cạnh nhau; phần giải thích dài được rút gọn trên mobile.
- Số khách dùng thanh cuộn ngang, không làm form dài thêm.
- Nút hành động cố định ở đáy và hỗ trợ `safe-area-inset-bottom` trên iPhone.
- Lỗi nhập liệu tự chuyển về đúng bước và cuộn lên vùng thông báo.
- Desktop vẫn hiển thị toàn bộ form trong một trang như trước.

### 2. Form Liên hệ DuyT

- Thêm trường số điện thoại có chọn quốc gia/mã vùng.
- Kiểm tra số điện thoại cả phía client và API theo định dạng quốc tế.
- Trên mobile, form liên hệ được đưa lên trước các thẻ kênh liên hệ để khách không phải cuộn qua 6 thẻ mới thấy form.
- Các kênh liên hệ dùng lưới 2 cột trên điện thoại để giảm chiều dài trang.
- Padding và cỡ tiêu đề được tối ưu cho màn hình nhỏ.

### 3. Luồng quản trị

- API lưu Email, số điện thoại, nội dung và mã yêu cầu trong `AdminNotification`.
- Không yêu cầu migration hoặc tạo bảng Supabase mới.
- `/admin/requests` hiển thị số điện thoại của khách.
- Admin có nút **Gọi khách** và **Phản hồi email**.
- Tìm kiếm yêu cầu hỗ trợ cả số điện thoại.
- Parser vẫn đọc được các yêu cầu cũ chưa có trường số điện thoại.

## File thay đổi

- `components/aurelius/components/VenueDetailView.tsx`
- `components/aurelius/components/ReservationForm.tsx`
- `components/aurelius/components/AboutContactViews.tsx`
- `components/aurelius/components/CountryPhoneField.tsx`
- `app/api/contact-requests/route.ts`
- `components/admin/notification-utils.ts`
- `components/admin/pages/RequestsPage.tsx`
- `tests/contact-notification.test.ts`
- `tests/mobile-contact-flow-regression.test.ts`

## Kiểm tra đã thực hiện

- TypeScript parser kiểm tra toàn bộ **151 file TS/TSX**, không có lỗi cú pháp.
- Runtime check cho parser thông báo liên hệ mới có số điện thoại: đạt.
- Runtime check tương thích thông báo cũ không có số điện thoại: đạt.
- Kiểm tra source contract cho layout mobile, API phone và nút gọi admin: đã thêm vào test suite.
- ZIP đầu ra được kiểm tra toàn vẹn sau khi đóng gói.

## Giới hạn môi trường QA

Không thể chạy `npm ci`/`npm run build` hoàn chỉnh trong container vì npm registry nội bộ trả HTTP 503 khi tải `zod-validation-error-4.0.2.tgz`. `package.json` và `package-lock.json` không bị thay đổi. Trên máy local có kết nối npm bình thường, chạy:

```powershell
npm install
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run test
npm run build
npm run dev
```
