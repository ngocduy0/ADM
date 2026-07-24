# Báo cáo QA – Contact Dock Header-safe Fix

## Phạm vi thay đổi mới

- Sửa `components/aurelius/components/FloatingContact.tsx`.
- Bổ sung marker nhận diện header public trong `components/aurelius/components/Header.tsx`.
- Không thay đổi route, API, database schema hoặc logic nghiệp vụ đặt bàn.
- Không thay đổi mã nguồn trong `app/admin` và `components/admin`.

## Nội dung đã sửa

- Thanh liên hệ chỉ chuyển vào bảng Concierge khi bảng còn nằm hoàn toàn dưới vùng an toàn của header.
- Khi bảng Concierge cuộn lên chạm vùng header, thanh liên hệ tự chuyển về vị trí nổi ban đầu ở cuối màn hình.
- Dùng hai ngưỡng vào/ra khác nhau để tránh trạng thái nhấp nháy khi cuộn sát mép header.
- Lấy chiều cao header thực tế thay vì dùng một con số cố định, nên vẫn đúng khi header đổi chiều cao sau khi cuộn hoặc trên mobile.
- Hạ contact dock xuống `z-index: 40`, trong khi header public ở `z-index: 50`; vì vậy thanh liên hệ không thể che menu trong lúc animation diễn ra.
- Giữ nguyên toàn bộ sửa lỗi trước đó về chiều rộng contact dock và font tiếng Việt.

## Kết quả kiểm tra

- Transpile cú pháp thành công 143 file TypeScript/TSX.
- Mô phỏng 6 trạng thái cuộn: dưới viewport, đi vào panel, đang dock, chạm header, vùng hysteresis và dock lại khi cuộn ngược — tất cả đạt.
- Kiểm tra source contract: header marker, z-index và ngưỡng an toàn đều tồn tại đúng vị trí.
- 53/53 file thuộc `app/admin` và `components/admin` giữ nguyên checksum.
- ZIP được kiểm tra toàn vẹn sau khi đóng gói.

## Kiểm tra production trên máy triển khai

Project ZIP không kèm `node_modules`. Trên máy có kết nối npm bình thường, chạy:

```bash
npm ci
npm run qa
```
