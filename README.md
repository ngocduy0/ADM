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

Web Push chưa được kích hoạt trong gói này vì cần VAPID keys, bảng lưu push subscription và API gửi push riêng. Chuông thông báo trong dashboard vẫn dùng hệ thống `AdminNotification` và Supabase Realtime hiện có.

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
