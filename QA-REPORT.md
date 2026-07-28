# Báo cáo QA – Khôi phục sơ đồ bàn và Contact Dock

## Nguyên nhân lỗi mất bàn

Bản tối ưu trước dùng dữ liệu tóm tắt của trang chủ để điền vào cache dùng chung. Payload tóm tắt cố ý không có `preferredTables`, `tableZones`, `floorPlanElements` và `floorPlanTheme`. Khi mở `/vi/dia-diem/adm-club` sau trang chủ, màn chi tiết lấy nhầm payload này nên chỉ còn nền lưới và vài phần tử mặc định.

## Nội dung đã sửa

- Cache trang chủ và cache chi tiết địa điểm được tách rõ ràng.
- URL dạng slug như `adm-club` chỉ dùng danh sách tóm tắt để tìm `venue.id`; sau đó luôn gọi API lấy payload đầy đủ.
- `usePublicVenue` không render payload tóm tắt trong lúc chờ dữ liệu chi tiết.
- API `/api/venues/[id]` dùng `readPublicVenues()` để lấy đầy đủ bàn, khu bàn và sơ đồ nhưng không tải Customer, Booking hay BookingContact.
- Thanh liên hệ chỉ tồn tại trên trang chủ và chỉ khi có khung `concierge-contact-dock`.
- Khi thanh đã chuyển vào **Dịch vụ Concierge**, thanh cố định phía dưới được `visibility: hidden`, không còn chiếm tương tác hoặc xuất hiện lại ở các section phía dưới.
- Khi cuộn ngược lên phía trên khu Concierge, thanh liên hệ mới xuất hiện lại.
- Bỏ `content-visibility` riêng khỏi section Concierge để `IntersectionObserver` đo đúng vị trí trên desktop và mobile.
- Luồng `App.tsx` cũ cũng được chặn không hiển thị thanh liên hệ tại màn chi tiết địa điểm.

## Kiểm tra đã thực hiện

- Transpile cú pháp thành công toàn bộ 144 file TypeScript/TSX.
- `package.json` và `package-lock.json` đọc hợp lệ.
- Thêm regression test cho cache chi tiết địa điểm, API public venue và Contact Dock.
- Không thay đổi schema Supabase, nghiệp vụ booking hoặc dữ liệu bàn.
- ZIP không chứa `node_modules`, `.next` hay file môi trường bí mật.

## Kiểm tra trên máy

```powershell
npm install
npm run test
npm run build
```

Nếu đang chạy `npm run dev`, hãy dừng server, xóa cache build rồi chạy lại:

```powershell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run dev
```
