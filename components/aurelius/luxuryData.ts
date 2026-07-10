import { Booking, VenuePerformance, Message, Review, ScheduleItem } from './luxuryTypes';

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'BK-4209',
    guestName: 'Minh Anh T.',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120',
    venue: 'ADM Club',
    date: '2026-06-18',
    time: '21:30',
    partySize: 6,
    depositStatus: 'Paid',
    bookingStatus: 'Confirmed',
    notes: 'Yêu cầu sofa VIP gần sân khấu, cần xác nhận minimum spend và setup sinh nhật trước khi khách đến.',
  },
  {
    id: 'BK-8831',
    guestName: 'Gia Hân N.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    venue: 'Karaoke Lasvegas 1',
    date: '2026-06-18',
    time: '20:00',
    partySize: 8,
    depositStatus: 'Paid',
    bookingStatus: 'Confirmed',
    notes: 'Cần phòng VIP riêng, chuẩn bị trái cây và kiểm tra khung giờ trống trước khi xác nhận.',
  },
  {
    id: 'BK-3129',
    guestName: 'Quốc Bảo L.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
    venue: 'Karaoke Lasvegas 1',
    date: '2026-06-19',
    time: '22:30',
    partySize: 12,
    depositStatus: 'Pending',
    bookingStatus: 'Pending',
    notes: 'Nhóm đông cần phòng lớn, yêu cầu báo trước sức chứa và chi phí dự kiến.',
  },
  {
    id: 'BK-5410',
    guestName: 'Hoàng Nam P.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
    venue: 'ADM Club',
    date: '2026-06-20',
    time: '23:00',
    partySize: 4,
    depositStatus: 'Paid',
    bookingStatus: 'Confirmed',
    notes: 'Ưu tiên khu gần bar, cần concierge kiểm tra tình trạng bàn trước khi giữ chỗ.',
  },
];

export const INITIAL_VENUES: VenuePerformance[] = [
  {
    id: 'V-01',
    name: 'ADM Club',
    bookingsCount: 42,
    revenue: 18450,
    occupancy: 92,
    miniChartPoints: [40, 55, 48, 70, 85, 90, 92],
    tagline: 'Nightlife năng lượng cao với khu bàn VIP, sofa riêng, quầy bar và vị trí gần sân khấu.',
  },
  {
    id: 'V-02',
    name: 'Karaoke Lasvegas 1',
    bookingsCount: 28,
    revenue: 15150,
    occupancy: 82,
    miniChartPoints: [20, 30, 65, 40, 68, 80, 82],
    tagline: 'Không gian karaoke riêng tư cho nhóm bạn, sinh nhật và các buổi gặp mặt cần sự thoải mái.',
  },
  {
    id: 'V-03',
    name: 'Karaoke Lasvegas 1',
    bookingsCount: 19,
    revenue: 8900,
    occupancy: 68,
    miniChartPoints: [50, 45, 52, 58, 60, 62, 68],
    tagline: 'Phòng karaoke linh hoạt cho nhóm nhỏ đến nhóm lớn, có hỗ trợ kiểm tra phòng và setup riêng.',
  },
];

export const INITIAL_MESSAGES: Message[] = [
  {
    id: 'MSG-01',
    senderName: 'Minh Anh T.',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120',
    lastMessage: 'Vui lòng kiểm tra giúp bàn sofa VIP tại ADM Club lúc 21:30 cho 6 khách.',
    time: '10:14',
    unread: true,
    replies: [
      { sender: 'user', text: 'Mình muốn khu gần sân khấu và có thể setup sinh nhật.', time: '10:10' },
      { sender: 'admin', text: 'DuyT Concierge sẽ kiểm tra trực tiếp với ADM Club và phản hồi ngay khi có xác nhận.', time: '10:12' },
    ],
  },
  {
    id: 'MSG-02',
    senderName: 'Gia Hân N.',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120',
    lastMessage: 'Nhờ xác nhận phòng VIP Karaoke Lasvegas 1 cho 8 khách tối nay.',
    time: '09:30',
    unread: false,
    replies: [
      { sender: 'admin', text: 'DuyT Concierge đang kiểm tra phòng trống và chi phí dự kiến cho khung giờ 20:00.', time: '09:35' },
    ],
  },
  {
    id: 'MSG-03',
    senderName: 'Hoàng Nam P.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
    lastMessage: 'Có thể giữ bàn gần bar tại ADM Club cho 4 khách không?',
    time: 'Hôm qua',
    unread: true,
    replies: [],
  },
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'REV-01',
    guestName: 'Minh Anh T.',
    avatar: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=120',
    venueName: 'ADM Club',
    rating: 5,
    reviewText: 'Concierge xác nhận rất nhanh, bàn đúng khu vực mong muốn và thông tin được chuẩn bị rõ ràng trước khi đến.',
    date: '18/06/2026',
  },
  {
    id: 'REV-02',
    guestName: 'Gia Hân N.',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120',
    venueName: 'Karaoke Lasvegas 1',
    rating: 5,
    reviewText: 'Phòng karaoke riêng tư, quy trình xác nhận gọn gàng và đội ngũ hỗ trợ rất rõ ràng.',
    date: '14/06/2026',
  },
  {
    id: 'REV-03',
    guestName: 'Quốc Bảo L.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    venueName: 'Karaoke Lasvegas 1',
    rating: 5,
    reviewText: 'Nhóm đông nhưng concierge vẫn hỗ trợ chọn phòng phù hợp, báo rõ sức chứa và thời gian trước khi xác nhận.',
    date: '12/06/2026',
  },
];

export const INITIAL_SCHEDULE: ScheduleItem[] = [
  { id: 'S-1', time: '20:00', guestName: 'Gia Hân N.', venue: 'Karaoke Lasvegas 1', status: 'Phòng VIP cần xác nhận' },
  { id: 'S-2', time: '21:30', guestName: 'Minh Anh T.', venue: 'ADM Club', status: 'Sofa VIP đang giữ chỗ' },
  { id: 'S-3', time: '22:30', guestName: 'Quốc Bảo L.', venue: 'Karaoke Lasvegas 1', status: 'Phòng lớn chờ phản hồi' },
];

export const CALENDAR_OCCUPIED_DAYS: number[] = [2, 5, 8, 12, 14, 17, 18, 19, 23, 24, 27, 28, 30];
