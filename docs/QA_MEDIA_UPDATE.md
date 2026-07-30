# QA cập nhật Cloudinary và hiệu năng media

Ngày kiểm tra: 29/07/2026

## Phạm vi đã kiểm tra

- Ký request Cloudinary ở server; `CLOUDINARY_API_SECRET` không xuất hiện trong mã frontend.
- Ảnh/video upload trực tiếp từ trình duyệt lên Cloudinary, không đi qua request body của Next.js/Vercel.
- Banner luôn hiện poster trước, sau đó thử autoplay với `muted`, `playsInline` và `preload="metadata"`.
- Banner pause khi rời viewport hoặc khi tab bị ẩn.
- Reel homepage và trang chi tiết chỉ bắt đầu mount video khi ít nhất khoảng 45% card đang hiển thị.
- Sau lần tải đầu, Reel giữ nguyên phần tử video để tận dụng cache; khi ra ngoài viewport chỉ `pause()` và không tải lại từ đầu khi người dùng cuộn quay lại.
- Dashboard không mount video trong toàn bộ danh sách reels; chỉ hiển thị poster.
- Giới hạn tối đa 10 reels trên toàn hệ thống.
- Poster Reel được Cloudinary tự tạo từ frame video; admin không cần upload poster riêng.
- Banner, reel, logo, icon và ảnh địa điểm cũ chỉ được xóa sau khi metadata mới lưu thành công.
- Upload chưa lưu được dọn khi người quản trị rời màn hình.
- Menu PDF tiếp tục dùng Supabase Storage; dữ liệu booking/auth/realtime tiếp tục dùng Supabase.

## Kiểm tra tự động đã chạy

- Kiểm tra parser TypeScript trên các file đã chỉnh sửa: không phát hiện lỗi cú pháp; môi trường thiếu dependency nên vẫn báo các module chưa cài.
- CSS được parse bằng `tinycss2`: không có lỗi cú pháp.
- Source regression cho typewriter đậm/phát sáng, CTA nổi bật, autoplay mobile, poster tự động, endpoint Reels riêng, IntersectionObserver, cache/pause và giới hạn reels: **4/4 đạt**.

## Giới hạn môi trường kiểm thử

Không thể chạy đầy đủ `npm ci`, ESLint và Next.js production build trong môi trường đóng gói vì registry npm nội bộ trả lỗi 404 khi tải dependency. Source không thêm dependency mới; `package.json` và `package-lock.json` được giữ nguyên.

Sau khi giải nén trên máy local có Internet, chạy:

```powershell
npm ci
npm run test
npm run lint
npm run build
```

Cần thêm ba biến Cloudinary theo `docs/CLOUDINARY_SETUP.md` trước khi kiểm tra upload thật.
