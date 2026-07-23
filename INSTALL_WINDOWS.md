# Cài đặt trên Windows

File `package-lock.json` đã được sửa để chỉ dùng npm public registry, không còn URL registry nội bộ.

## Cài mới sạch

Mở PowerShell tại thư mục dự án và chạy:

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
cmd /c "rmdir /s /q node_modules"
Remove-Item package-lock.json.old -Force -ErrorAction SilentlyContinue
npm cache verify
npm config delete proxy
npm config delete https-proxy
npm config set registry https://registry.npmjs.org/
npm install
npm run dev
```

Nếu Windows báo không xóa được `node_modules`, đóng VS Code, terminal, trình duyệt đang chạy localhost và thử lại. Có thể khởi động lại máy rồi xóa thư mục.

## Kiểm tra registry

```powershell
npm config get registry
```

Kết quả phải là:

```text
https://registry.npmjs.org/
```
