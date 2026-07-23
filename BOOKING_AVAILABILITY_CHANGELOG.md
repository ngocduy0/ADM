# Booking availability & customer tier update

## Nghiệp vụ bàn
- Một lượt bàn mặc định 4,5 giờ.
- Khóa thêm 30 phút trước giờ đến và 30 phút sau lượt để chuẩn bị/dọn bàn.
- Nếu địa điểm đóng cửa sớm hơn thời điểm kết thúc dự kiến, bàn được giải phóng tại giờ đóng cửa.
- Booking `CANCELLED` và `NO_SHOW` không khóa bàn.
- API công khai `/api/reservations/availability` trả tình trạng từng bàn theo từng slot 30 phút.
- Form khách và form admin vẫn hiển thị bàn/giờ đã có lịch nhưng disable, không cho chọn.
- Khi bàn hiện tại bị khóa, hệ thống ưu tiên tự chọn bàn trống tiếp theo cùng khu, sau đó mới sang khu khác.
- Khi admin sửa booking, trường bàn được ghi rõ “Đổi bàn / khu vực”; booking hiện tại được loại khỏi phép kiểm tra để có thể giữ nguyên bàn hoặc đổi bàn hợp lệ.

## Số điện thoại quốc tế
- Mặc định mã vùng Việt Nam `+84`.
- Bổ sung các mã phổ biến: Mỹ/Canada, Anh, Pháp, Đức, Úc, Singapore, Thái Lan, Nhật, Hàn Quốc, Trung Quốc.
- Backend chấp nhận E.164 quốc tế từ 8 đến 15 chữ số và vẫn tương thích số Việt Nam cũ.

## Phân hạng khách hàng
- Phân hạng hiển thị được tính tự động từ booking `COMPLETED`.
- Chi tiêu được quy đổi theo khu: thường 1.0x, Bar 1.1x, VIP/KTV 1.25x, SVIP/Elite 1.5x.
- Ngưỡng: VIP 10 triệu, VVIP 30 triệu, ELITE 80 triệu đồng chi tiêu quy đổi.
- Modal khách hàng không còn cho sửa hạng thủ công để tránh lệch nghiệp vụ.
