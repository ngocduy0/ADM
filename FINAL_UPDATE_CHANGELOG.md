# DuyT Booking – Final Admin UI Update

## Thay đổi theo yêu cầu

- Thanh liên hệ nhanh chỉ hiển thị trên homepage người dùng.
- Bổ sung kênh `Gọi điện` với URL `tel:` và icon riêng; dữ liệu vẫn quản lý tại `/admin/contacts`.
- Thêm hiệu ứng xuất hiện, chuyển động nhẹ, hiệu ứng từng nút và hiệu ứng chuông/pulse cho nút gọi điện; hỗ trợ `prefers-reduced-motion`.
- Thay select trạng thái booking mặc định bằng status picker tùy chỉnh bo tròn, có chấm màu và menu màu riêng cho từng trạng thái.
- Khi mở booking từ thông báo, hệ thống chuyển tới `/admin/bookings?bookingId=...`, tự tìm đúng trang, cuộn tới và highlight booking.
- Toàn bộ item trong dropdown thông báo và trang thông báo đều điều hướng tới booking tương ứng.
- Card địa điểm được thu nhỏ và chuyển sang lưới 3 cột từ breakpoint `xl`.
- Ảnh địa điểm và Reels được bọc trong khung bo tròn, có khoảng đệm và hiệu ứng zoom nhẹ.
- Nút `Sơ đồ` trên card địa điểm mở route riêng `/admin/venues/[venueId]/layout`.
- Trình chỉnh sửa sơ đồ được chuyển sang chế độ page toàn màn hình trong vùng admin, không còn mở modal từ màn địa điểm.
- Trang sơ đồ dùng layout ba cột cố định theo chiều cao viewport; từng panel tự cuộn khi cần, không làm trang kéo dài xuống dưới.
- Bổ sung nút lưu sơ đồ và nút quay lại ngay trên header của trang sơ đồ.
- Sửa lỗi khai báo trùng biến `phone` trong `AdminDataProvider`.

## File/chức năng chính đã cập nhật

- `components/aurelius/public/PublicShell.tsx`
- `components/aurelius/components/FloatingContact.tsx`
- `components/aurelius/siteSettings.ts`
- `components/admin/pages/BookingsPage.tsx`
- `components/admin/pages/VenuesPage.tsx`
- `components/admin/pages/ReelsPage.tsx`
- `components/admin/pages/NotificationsPage.tsx`
- `components/admin/layout/TopNav.tsx`
- `components/admin/layout/AdminShell.tsx`
- `components/admin/forms/VenueFormModal.tsx`
- `components/aurelius/components/TableMapManagerModal.tsx`
- `components/admin/pages/VenueFloorPlanPage.tsx`
- `app/admin/venues/[venueId]/layout/page.tsx`
- `public/brand-icons/phone.svg`
