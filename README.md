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
