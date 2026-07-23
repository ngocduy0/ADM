# Admin Refinement Changelog

## Giao diện

- Booking card list theo mẫu quản trị hiện đại.
- Venue cards và dashboard metrics đồng bộ style xanh navy, nền xám sáng, bo góc lớn.
- Homepage editor dạng hai cột: cấu trúc kéo thả và vùng chỉnh sửa/preview.
- Contacts manager mới cho icon, URL và thứ tự kênh liên hệ.
- Reels có filter hiển thị/ẩn và tải media nhẹ hơn.

## Dữ liệu liên kết admin → frontend

`SiteSettings` hiện chứa:

- `brandName`
- logo và hero media
- `homepageSections`
- `contactChannels`

Frontend sử dụng cấu hình này để:

- Sắp xếp và ẩn/hiện section homepage.
- Chọn danh sách địa điểm nổi bật.
- Hiển thị đúng kênh liên hệ, icon và URL do admin cấu hình.
- Tạo link liên hệ sau khi khách gửi booking.

## Hiệu suất

- Initial admin fetch chạy song song.
- Realtime refresh không liên tục ghi cache lớn vào localStorage.
- Polling dự phòng giảm tần suất.
- Media card dùng lazy loading và video không preload toàn bộ.
