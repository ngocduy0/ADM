# QA Report — Contact Dock Final Fix

## Lỗi đã xử lý

1. Thanh liên hệ có nền capsule kéo dài thừa sau mục Email.
2. Thanh liên hệ cố định xuất hiện trở lại khi tiếp tục cuộn xuống các section nằm dưới `Dịch vụ Concierge`.

## Thay đổi kỹ thuật

- Thay chiều rộng cố định `860px` bằng `width: fit-content` và giới hạn theo viewport.
- Thanh nền bên trong dùng `width: max-content; max-width: 100%`, nên capsule ôm đúng tổng chiều rộng các kênh liên hệ.
- Bỏ chiều rộng cố định `118px` trên từng mục; thay bằng min/max width linh hoạt.
- Thêm sentinel 1px `#concierge-contact-trigger` ở đầu khung liên hệ Concierge.
- `IntersectionObserver` theo dõi sentinel trong một dải mỏng ở khoảng 69% chiều cao viewport.
- Khi sentinel đi qua ngưỡng, thanh dưới được ẩn và giữ nguyên trạng thái ở toàn bộ phần nội dung phía dưới.
- Thanh chỉ hiện lại khi người dùng cuộn ngược lên phía trên khung Concierge.
- Không dùng listener scroll trong trình duyệt hiện đại; fallback cũ được giới hạn bằng `requestAnimationFrame`.

## Kiểm tra đã thực hiện

- Kiểm tra source contract cho sentinel, ngưỡng observer, trạng thái ẩn và kích thước fit-content: PASS.
- TypeScript parser không phát hiện lỗi cú pháp trong hai file TSX đã sửa.
- Không có `node_modules` hoặc `.next` trong gói bàn giao.
- ZIP integrity test: thực hiện sau khi đóng gói.

## File chính đã sửa

- `components/aurelius/components/FloatingContact.tsx`
- `components/aurelius/components/HomepageView.tsx`
- `tests/public-venue-cache-regression.test.ts`
