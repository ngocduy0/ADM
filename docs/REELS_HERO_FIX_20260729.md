# Reels & Hero Fix — 29/07/2026

## Lỗi đã xử lý

1. **Lưu Reel báo lỗi tên bàn/phòng**
   - Nguyên nhân: màn Reel gọi `saveVenue()`, khiến toàn bộ địa điểm và sơ đồ bàn bị validate lại.
   - Cách sửa: thêm endpoint riêng `PATCH /api/venues/[id]/reels`, chỉ cập nhật JSON Reels trong mô tả địa điểm và không ghi lại bàn/khu/sơ đồ.

2. **Poster Reel phải upload thủ công**
   - Màn tạo/chỉnh sửa Reel giờ chỉ còn nút chọn video.
   - Cloudinary tự tạo poster từ frame ở giây `0.6` của video bằng URL transformation.
   - Poster không tạo thêm asset riêng nên không phải quản lý/xóa riêng.

3. **Instagram URL bắt buộc hoặc mở sai URL video**
   - Instagram permalink được phép để trống.
   - Homepage, trang chi tiết và dashboard đều mặc định mở `https://www.instagram.com/duytadm/`.

4. **Video tải lại khi cuộn lên/xuống**
   - Video chỉ mount sau lần đầu card hiển thị ít nhất 45%.
   - Khi rời màn hình, video chỉ `pause()` và vẫn được giữ để tận dụng cache.
   - Khi cuộn quay lại, trình duyệt không phải tạo lại toàn bộ phần tử video.

5. **Phiên admin hết hạn khi đang upload**
   - Thời lượng mặc định tăng từ 30 phút lên 4 giờ.
   - Nếu `.env.local` đang có `ADMIN_SESSION_MAX_AGE_SECONDS=1800`, đổi thành `14400`, restart server và đăng nhập lại.

## Hero đã nâng cấp

- Chữ `DUYT Booking FULL MAP ĐÀ NẴNG` dùng font đậm, viền sáng, glow tím, gradient shimmer và chuyển động nhẹ.
- Nút `Book Now` có pulse, halo, shine, hover nâng/scale và hiệu ứng nhấn.
- Hiệu ứng vẫn chạy trên mobile; `prefers-reduced-motion` vẫn được tôn trọng.

## Kiểm tra sau khi giải nén

```powershell
npm ci
npm run test
npm run lint
npm run build
```

Sau khi thay `ADMIN_SESSION_MAX_AGE_SECONDS`, cần restart:

```powershell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run dev
```

## Kiểm tra Reel thực tế

1. Đăng nhập lại admin.
2. Mở **Reels > Chỉnh sửa**.
3. Chọn một video; không cần chọn poster.
4. Có thể để trống Instagram permalink.
5. Bấm **Lưu Reel**.
6. Kiểm tra URL video bắt đầu bằng `https://res.cloudinary.com/`.
7. Kiểm tra poster cũng là URL Cloudinary có transformation `so_0.6,f_jpg`.
