-- Chạy file này trong Supabase SQL Editor nếu muốn bật realtime cho admin.
-- Lưu ý: tên bảng đang dùng chữ hoa nên phải giữ dấu ngoặc kép.

alter publication supabase_realtime add table public."Booking";
alter publication supabase_realtime add table public."BookingContact";
alter publication supabase_realtime add table public."Customer";
alter publication supabase_realtime add table public."Venue";
alter publication supabase_realtime add table public."VenueImage";
alter publication supabase_realtime add table public."VenueSpot";
alter publication supabase_realtime add table public."VenueTableZone";
alter publication supabase_realtime add table public."VenueMapElement";
alter publication supabase_realtime add table public."VenueMapConfig";
alter publication supabase_realtime add table public."SiteSetting";
