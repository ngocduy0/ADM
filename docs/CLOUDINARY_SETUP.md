# Cấu hình Cloudinary cho ADM

Hệ thống sau bản cập nhật này dùng:

- Supabase: database, booking, khách hàng, yêu cầu, auth và realtime.
- Cloudinary: ảnh địa điểm, logo/icon, video banner, poster và reels.
- Supabase Storage: chỉ giữ upload menu PDF cũ để tránh giới hạn phát PDF trên Cloudinary Free.

## 1. Lấy Cloudinary key

1. Đăng nhập Cloudinary.
2. Mở **Dashboard**.
3. Mở phần **API Keys** hoặc **Product Environment Credentials**.
4. Sao chép ba giá trị:
   - Cloud name
   - API Key
   - API Secret

Không đưa `API Secret` vào code frontend, GitHub hoặc biến có tiền tố `NEXT_PUBLIC_`.

## 2. Tạo `.env.local`

Tại thư mục gốc dự án, mở hoặc tạo file `.env.local` rồi thêm:

```env
CLOUDINARY_CLOUD_NAME=ten_cloud_cua_ban
CLOUDINARY_API_KEY=api_key_cua_ban
CLOUDINARY_API_SECRET=api_secret_cua_ban
```

Giữ nguyên các biến Supabase và admin hiện có. Sau khi sửa `.env.local`, tắt server rồi chạy lại:

```powershell
npm run dev
```

## 3. Cấu hình trên Vercel

Vào **Vercel > Project > Settings > Environment Variables**, thêm ba biến Cloudinary trên cho:

- Production
- Preview
- Development nếu cần

Sau đó redeploy dự án. Không cần thêm `NEXT_PUBLIC_CLOUDINARY_*` vì frontend nhận chữ ký upload ngắn hạn từ API admin.

## 4. Cách upload đang hoạt động

Ảnh và video không chạy qua body của Vercel/Next.js. Luồng upload là:

1. Admin chọn file.
2. API `/api/upload-media` xác thực phiên admin và tạo chữ ký ngắn hạn.
3. Trình duyệt upload trực tiếp file lên Cloudinary.
4. Hệ thống chỉ lưu URL và `cloudinary://...` reference vào Supabase.
5. Khi banner/reel/ảnh cũ được thay và dữ liệu mới lưu thành công, file cũ được xóa khỏi Cloudinary.

Cách này giảm tải server, tránh giới hạn request body của hosting và không tiêu thụ Supabase Cached Egress cho media mới.

## 5. Media cũ đang ở Supabase

Bản cập nhật không tự xóa URL media cũ để tránh làm website mất ảnh/video. Hãy mở từng nội dung trong dashboard và upload lại:

1. **Banners**: upload lại video và poster, sau đó nhấn **Lưu banner**.
2. **Reels**: mở từng reel và chỉ upload lại video. Poster được tự lấy từ frame video trên Cloudinary.
3. **Địa điểm**: mở chỉnh sửa địa điểm, upload ảnh mới rồi lưu.
4. Kiểm tra website hoạt động đúng trước khi xóa file cũ trong Supabase Storage.

## 6. Khuyến nghị dung lượng

- Banner: MP4 H.264, 720p/1080p, khoảng 2–8MB.
- Reel: video dọc 9:16, khoảng 3–8MB/video.
- Poster Reel: được tạo tự động từ video bằng Cloudinary, không cần upload file riêng.
- Ảnh card: WebP, kích thước phù hợp vùng hiển thị.

Hệ thống giới hạn tối đa 10 reels và không tải đồng loạt toàn bộ video.

## 7. Kiểm thử

### Banner

1. Mở dashboard > Banners.
2. Upload poster và video.
3. Nhấn **Lưu banner**.
4. Mở website bằng điện thoại thật.
5. Poster phải hiện trước, sau đó video tự phát ở chế độ muted/playsInline.
6. Cuộn banner ra khỏi màn hình: video phải pause.

### Reels

1. Mở Chrome DevTools > Network và lọc `media` hoặc `mp4`.
2. Reload homepage.
3. Reels chưa xuất hiện không được tải video, chỉ có poster tự động.
4. Cuộn reel vào ít nhất khoảng 45% màn hình: video bắt đầu tải và phát.
5. Cuộn reel ra ngoài: video bị pause nhưng vẫn được giữ để tận dụng cache; cuộn quay lại không tạo request tải toàn bộ mới.
6. Để trống Instagram permalink và bấm Reel: phải mở `@duytadm`.
7. Thử tạo reel thứ 11: hệ thống phải từ chối.

### Build

```powershell
npm run test
npm run lint
npm run build
```

## 8. Xử lý lỗi thường gặp

### Thiếu cấu hình Cloudinary

Nếu thấy thông báo thiếu `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` hoặc `CLOUDINARY_API_SECRET`, kiểm tra `.env.local` và restart server.

### Invalid Signature

- Kiểm tra API Secret không có khoảng trắng thừa.
- Không dùng API Secret của product environment khác.
- Restart server sau khi thay key.

### Mobile không autoplay

Video đã có `muted`, `playsInline` và `autoPlay`. iPhone ở Low Power Mode vẫn có thể chặn autoplay; khi đó website hiển thị nút **Chạm để phát video**.


## 9. Phiên quản trị khi upload video

Bản cập nhật đặt thời lượng phiên mặc định là 4 giờ để tránh upload xong nhưng hết phiên trước khi bấm lưu:

```env
ADMIN_SESSION_MAX_AGE_SECONDS=14400
```

Nếu `.env.local` của bạn vẫn đang đặt `1800`, hãy đổi thành `14400`, restart server và đăng nhập lại. Khi console trả `401 Unauthorized`, đó là phiên quản trị đã hết hạn chứ không phải lỗi Cloudinary.
