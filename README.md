# DuyT Danang Concierge

Next.js concierge website và admin dashboard, đồng bộ Supabase, public route đa ngôn ngữ và đăng nhập admin.

## Chạy dự án

```powershell
npm install
npm run dev
```

## Kiểm tra production

```powershell
npm run test
npm run build
```

Sau khi thay source hoặc đổi nhánh, nên xóa cache Next.js trước khi kiểm tra lại giao diện:

```powershell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run dev
```

Xem chi tiết sửa lỗi trong `QA-REPORT.md`.

## Contact dock behavior correction
The floating contact row docks only while the Concierge panel is in the central viewport area, then returns at the bottom in all later sections. Its capsule is shrink-wrapped to the contact items.

## Dashboard mobile PWA trên iPhone

Bản này tích hợp giao diện mobile mới **chỉ cho route `/admin` khi màn hình nhỏ hơn 768px**.

- `/admin` trên iPhone: dùng dashboard mobile theo thiết kế Google AI Studio.
- `/admin` từ 768px trở lên: giữ nguyên dashboard desktop.
- Các route admin khác: giữ nguyên giao diện và nghiệp vụ hiện tại.
- Mobile dashboard dùng trực tiếp `AdminDataProvider`, Supabase, API, booking, thông báo và form hiện có; không có mock data.
- PWA không cache HTML `/admin` hoặc API để tránh lưu thông tin khách hàng trên thiết bị.

### Cài đặt source

Yêu cầu:

- Node.js 20 trở lên, khuyến nghị Node.js 22.
- npm đi kèm Node.js.
- Các biến môi trường Supabase và tài khoản admin.

PowerShell:

```powershell
Expand-Archive .\adm-mobile-pwa-dashboard-complete.zip -DestinationPath .\adm-mobile-pwa-dashboard-complete
cd .\adm-mobile-pwa-dashboard-complete

Copy-Item .env.example .env.local
npm install
npm run test
npm run lint
npm run build
npm run dev
```

Sau đó mở:

```text
http://localhost:3000/login
```

### Biến môi trường

Mở `.env.example`, điền các giá trị thật vào `.env.local`. Tối thiểu cần kiểm tra:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_EMAIL=
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=
```

Không commit `.env.local` lên GitHub.

### Kiểm tra production

```powershell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run test
npm run lint
npm run build
npm run start
```

Service worker chỉ được đăng ký trong production. Vì vậy cần kiểm tra PWA bằng `npm run build && npm run start` hoặc trên domain HTTPS đã deploy, không đánh giá service worker chỉ bằng `npm run dev`.

### Cài PWA lên iPhone

1. Deploy hệ thống trên domain HTTPS.
2. Mở domain bằng Safari.
3. Đăng nhập admin và mở `/admin`.
4. Nhấn nút **Chia sẻ**.
5. Chọn **Thêm vào Màn hình chính**.
6. Đặt tên `DuyT Admin` và xác nhận.

PWA sẽ mở ở chế độ standalone, có icon riêng, hỗ trợ safe area của Dynamic Island/Home Indicator và có trang thông báo mất mạng.

### Lưu ý bảo mật PWA

Service worker chỉ cache icon, manifest, file tĩnh phiên bản hóa và trang offline. Những đường dẫn sau dùng network-only:

```text
/admin/*
/api/*
```

Điều này có chủ đích để booking, khách hàng, số điện thoại và phiên admin không bị lưu vào cache ngoại tuyến.

Web Push đã được tích hợp cho PWA admin. Cần cấu hình VAPID, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL` và chạy migration subscription như hướng dẫn bên dưới.

## Ghi chú Windows / SWC

Bản này mặc định dùng Webpack cho `npm run dev` và `npm run build` để tránh lỗi native SWC/Turbopack trên một số máy Windows (`next-swc... is not a valid Win32 application`).

```powershell
npm run dev
npm run build
```

Khi native binding hoạt động bình thường và muốn dùng Turbopack:

```powershell
npm run dev:turbopack
npm run build:turbopack
```

Nếu vẫn muốn sửa native binding thay vì dùng Webpack, hãy xác nhận Node.js là bản 64-bit rồi xóa `node_modules` và `.next`, sau đó chạy `npm ci`.



## PWA admin mobile đồng bộ toàn hệ thống

Ở màn hình dưới `768px`, toàn bộ route `/admin/*` sử dụng cùng một app shell dành cho iPhone:

- Top bar cố định có avatar DuyT, tên màn hình, tìm kiếm và thông báo.
- Bottom navigation cố định: Tổng quan, Đặt chỗ, Lịch, Yêu cầu và Khác.
- Menu Khác mở toàn bộ trang quản trị còn lại và nút đăng xuất.
- Các trang desktop từ `768px` trở lên vẫn giữ nguyên sidebar và top navigation hiện tại.
- Nội dung admin và API không được service worker cache để tránh lưu dữ liệu riêng tư trên thiết bị.

Sau khi cập nhật production, nên đóng PWA rồi mở lại. Nếu iPhone vẫn hiển thị bản cũ, xóa biểu tượng DuyT Admin khỏi Home Screen, mở Safari và thêm lại bằng **Chia sẻ → Thêm vào Màn hình chính**.

## Web Push cho PWA admin trên iPhone

Source đã có đầy đủ luồng đăng ký thiết bị, lưu subscription vào Supabase, gửi push sau booking/liên hệ mới, thông báo thử và xử lý click trong service worker.

Bản sửa này tách rõ booking công khai và booking do admin tạo. Vì vậy, ngay cả khi đang đăng nhập admin trên cùng trình duyệt rồi mở trang địa điểm để thử đặt bàn, booking công khai vẫn gửi Web Push. Payload đồng thời dùng định dạng Declarative Web Push làm fallback cho iOS/iPadOS mới và vẫn tương thích service worker cũ.

### 1. Tạo bảng Supabase

Chạy file sau trong Supabase SQL Editor:

```text
supabase/migrations/20260728_admin_push_subscriptions.sql
```

### 2. Tạo VAPID key một lần

```bash
npm install
npx web-push generate-vapid-keys --json
```

Thêm vào `.env.local` và Vercel Environment Variables:

```env
NEXT_PUBLIC_APP_URL=https://ten-mien-production-cua-ban.vn
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<publicKey>
VAPID_PRIVATE_KEY=<privateKey>
VAPID_SUBJECT=mailto:email-cua-ban@example.com
SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>
```

Không commit `.env.local`. Không đổi VAPID key sau khi thiết bị đã đăng ký, trừ khi chấp nhận đăng ký lại toàn bộ thiết bị.

### 3. Deploy và bật trên iPhone

1. Redeploy sau khi thêm biến môi trường.
2. Mở domain HTTPS bằng Safari và thêm vào Màn hình chính.
3. Mở từ icon DuyT, đăng nhập.
4. Vào `Khác → Cài đặt → Thông báo đẩy trên iPhone`.
5. Nhấn `Bật thông báo`, sau đó `Gửi thông báo thử`.

Các API Web Push đều kiểm tra cookie admin HTTP-only. Bảng subscription chỉ cho `service_role` truy cập.

## Cập nhật mobile media & quản trị dữ liệu (28/07/2026)

Bản này bổ sung các sửa đổi production sau:

- Video hero/banner và Reel công khai được mount trên mobile, phát muted + `playsInline`, tự thử phát lại sau tương tác và có điều khiển/chạm để phát khi iOS hoặc trình duyệt chặn autoplay.
- Service worker không còn clone/cache response runtime, tránh lỗi `Response body is already used` trên Chromium mobile.
- Tiêu đề thanh trên admin lấy đúng route hiện tại, ví dụ `Yêu cầu`, `Khách hàng`, `Thông báo`, `Sơ đồ bàn`.
- Favicon, Apple icon và PWA icon đổi sang nền đen/chữ DuyT trắng, kèm version URL để làm mới cache.
- Đặt lại dữ liệu chỉ xóa booking, lịch sử liên hệ booking, khách hàng và yêu cầu/thông báo vận hành. Địa điểm, ảnh, video, bàn, khu, sơ đồ, cài đặt và đăng ký Web Push được giữ nguyên.
- Khách hàng có lọc địa điểm, khoảng ngày và phân trang.
- Yêu cầu, thông báo, Reels, địa điểm và bàn có phân trang.
- Sơ đồ bàn mobile tách thành ba màn `Danh sách / Sơ đồ / Chi tiết`; danh sách bàn phân trang 20 bàn để không kéo dài vô hạn.

Sau khi cài dependency, chạy:

```bash
npm run test
npm run build
```

Sau khi deploy bản mới, trình duyệt sẽ cập nhật service worker `duyt-admin-static-v6`. Với PWA đã cài từ trước, mở ứng dụng một lần khi có mạng để nhận icon và service worker mới.

## Cloudinary media

Ảnh, banner và reels mới được upload trực tiếp lên Cloudinary bằng signed upload. Supabase tiếp tục dùng cho database/auth/realtime; menu PDF vẫn dùng Supabase Storage.

Xem hướng dẫn cấu hình đầy đủ tại [`docs/CLOUDINARY_SETUP.md`](docs/CLOUDINARY_SETUP.md).
