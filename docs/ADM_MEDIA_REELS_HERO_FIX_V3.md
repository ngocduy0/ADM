# ADM Media, Reels & Hero Fix V3

## Đã sửa

### 1. ADM Club cập nhật được dù dữ liệu bàn legacy đang lỗi

ADM Club có thể đã tồn tại tên bàn/phòng trống hoặc trùng từ dữ liệu cũ. Khi chỉ sửa thông tin địa điểm, mô tả, giờ hoạt động hoặc media, hệ thống không còn chặn bởi lỗi bàn legacy nếu danh sách bàn không thay đổi.

Khi chỉnh sửa trực tiếp danh sách bàn, validation đầy đủ vẫn hoạt động và vẫn chặn tên/mã bàn trống hoặc trùng.

### 2. Nút đổi vị trí Reels hoạt động trên toàn hệ thống

Thứ tự Reels bây giờ là thứ tự toàn cục giữa tất cả địa điểm, không còn chỉ đổi vị trí trong từng địa điểm. Hai nút lên/xuống sẽ đổi Reel với Reel đứng trước/sau dù chúng thuộc địa điểm khác nhau.

API mới:

```text
PATCH /api/reels/reorder
```

### 3. Hero graffiti và nút Book Now sấm sét

- Font hero chuyển sang Bungee, phong cách street/graffiti.
- Thêm lớp spray, glow, stroke và nghiêng nhẹ.
- Vẫn giữ hiệu ứng gõ chữ và xóa chữ.
- Nút Book Now có 4 tia sét, pulse, halo và shine.
- Mobile vẫn có hiệu ứng nhưng giảm blur/kích thước để giữ hiệu năng.
- `prefers-reduced-motion` vẫn được tôn trọng.

### 4. Media mới chỉ upload lên Cloudinary

- Ảnh địa điểm: Cloudinary.
- Video địa điểm: Cloudinary.
- Video banner/poster: Cloudinary.
- Reels/poster tự động: Cloudinary.
- Logo/icon liên hệ: Cloudinary theo luồng upload hiện tại.
- Menu PDF vẫn giữ Supabase Storage vì không thuộc nhóm video/ảnh/reels/banner.

Supabase vẫn giữ dữ liệu nghiệp vụ và metadata như booking, bàn, địa điểm, Cloudinary URL/public ID. File media nhị phân không còn được upload mới lên Supabase.

## Dọn media Supabase cũ

Vào:

```text
Admin → Banners → Dọn media Supabase cũ
```

Nút này sẽ:

- Xóa `VenueImage` dùng URL Supabase Storage.
- Gỡ video địa điểm cũ dùng URL Supabase.
- Gỡ Reels cũ dùng video Supabase.
- Gỡ banner/poster cũ dùng URL Supabase.
- Xóa file cũ trong các folder media của bucket.
- Giữ nguyên media Cloudinary.
- Giữ nguyên menu PDF.
- Không xóa booking, khách hàng, bàn, khu hoặc sơ đồ.

Nên kiểm tra Cloudinary đã cấu hình đúng trong `.env.local` trước khi upload lại media.

## Kiểm tra đã chạy

- TypeScript syntax scan: 174 file TS/TSX, 0 lỗi cú pháp.
- Cloudinary/performance regression: 5/5 đạt.
- Booking/venue validation: 25/25 đạt.
- Không chạy được `npm ci` đầy đủ trong môi trường đóng gói vì registry nội bộ thiếu `zod-validation-error@4.0.2`.

Trên máy Windows, chạy lại:

```powershell
npm ci
npm run test
npm run lint
npm run build
```
