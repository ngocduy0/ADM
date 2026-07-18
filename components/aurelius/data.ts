import { Venue, ReservationRequest, Customer, BookingStatus, VipStatus } from './types';

export const INITIAL_VENUES: Venue[] = [
  {
    id: 'venue-1',
    name: 'ADM Club',
    category: 'Nightclub',
    location: 'Hòa Cường Bắc, Hải Châu, Đà Nẵng',
    shortDescription: 'Nightlife năng lượng cao với bàn VIP, khu sofa riêng và concierge kiểm tra trực tiếp trước khi xác nhận.',
    longDescription: 'ADM Club là lựa chọn nightlife năng lượng cao tại Đà Nẵng. DuyT Concierge hỗ trợ kiểm tra khu bàn, minimum spend, số khách, giờ đến và các yêu cầu setup riêng trước khi xác nhận để khách có trải nghiệm rõ ràng, riêng tư và mượt mà hơn.',
    image: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=1400&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1545128485-c400e7702796?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1571266028243-d220c9c3b3e5?q=80&w=1400&auto=format&fit=crop',
    ],
    menuUrl: 'Bottle sets, champagne, premium spirits, mixers, birthday table setup. Giá chưa bao gồm 10% VAT và 5% phí phục vụ.',
    openingHours: { open: '21:00', close: '03:00', label: '21:00 - 03:00' },
    viewCount: 10,
    floorPlanTheme: { style: 'NIGHTCLUB', ratio: 'PORTRAIT', backgroundColor: '#070A12', accentColor: '#D6A85F', surfaceColor: '#111827', gridColor: 'rgba(255,255,255,0.055)', texture: 'GRID', helperText: 'Chọn khu hoặc chạm vào bàn để xem minimum spend, sức chứa và trạng thái yêu cầu.', showGrid: true },
    floorPlanElements: [
      { id: 'adm-dj', type: 'DJ', label: 'DJ', x: 50, y: 8, width: 42, height: 6, color: '#8B5CF6', order: 1, isActive: true },
      { id: 'adm-stage', type: 'STAGE', label: 'Sân khấu', x: 50, y: 18, width: 34, height: 6, color: '#EC4899', order: 2, isActive: true },
      { id: 'adm-bar', type: 'BAR', label: 'Quầy bar', x: 50, y: 30, width: 52, height: 8, color: '#2563EB', order: 3, isActive: true },
      { id: 'adm-door', type: 'DOOR', label: 'Lối vào', x: 50, y: 94, width: 24, height: 5, color: '#D6A85F', order: 4, isActive: true },
    ],
    tableZones: [
      { id: 'zone-adm-dj', name: 'DJ Front', label: 'Gần DJ / Sân khấu', description: 'Khu nổi bật nhất, phù hợp nhóm muốn không khí mạnh và vị trí trung tâm.', minimumSpend: 12000000, capacity: 10, color: '#C92A2A', order: 1, isActive: true },
      { id: 'zone-adm-vip', name: 'VIP Sofa', label: 'Sofa VIP', description: 'Khu sofa riêng tư hơn, phù hợp nhóm sinh nhật hoặc khách muốn ngồi thoải mái.', minimumSpend: 4450000, capacity: 6, color: '#8B5CF6', order: 2, isActive: true },
      { id: 'zone-adm-bar', name: 'Bar Side', label: 'Bar Side', description: 'Gần quầy bar, dễ gọi đồ và di chuyển.', minimumSpend: 4500000, capacity: 4, color: '#2563EB', order: 3, isActive: true },
      { id: 'zone-adm-main', name: 'Main Floor', label: 'Khu trung tâm', description: 'Bàn trung tâm phù hợp nhóm muốn gần sân khấu và ánh sáng.', minimumSpend: 6000000, capacity: 6, color: '#F08A24', order: 4, isActive: true },
    ],
    preferredTables: [
      { id: 'adm-301', name: '301', area: 'Bar Side', zoneId: 'zone-adm-bar', minimumSpend: 4500000, capacity: 4, description: 'Khu gần bar, dễ gọi đồ và di chuyển.', status: 'AVAILABLE', shape: 'BAR', bookingMode: 'REQUEST', x: 28, y: 30, width: 7, height: 5, color: '#2563EB', badge: 'NONE', sortOrder: 1 },
      { id: 'adm-302', name: '302', area: 'Bar Side', zoneId: 'zone-adm-bar', minimumSpend: 4500000, capacity: 4, description: 'Khu gần bar, phù hợp nhóm nhỏ.', status: 'AVAILABLE', shape: 'BAR', bookingMode: 'REQUEST', x: 38, y: 30, width: 7, height: 5, color: '#2563EB', badge: 'NONE', sortOrder: 2 },
      { id: 'adm-303', name: '303', area: 'Bar Side', zoneId: 'zone-adm-bar', minimumSpend: 4500000, capacity: 4, description: 'Khu gần bar, dễ quan sát sân khấu.', status: 'AVAILABLE', shape: 'BAR', bookingMode: 'REQUEST', x: 48, y: 30, width: 7, height: 5, color: '#2563EB', badge: 'NONE', sortOrder: 3 },
      { id: 'adm-304', name: '304', area: 'Bar Side', zoneId: 'zone-adm-bar', minimumSpend: 4500000, capacity: 4, description: 'Khu gần bar, thuận tiện di chuyển.', status: 'AVAILABLE', shape: 'BAR', bookingMode: 'REQUEST', x: 58, y: 30, width: 7, height: 5, color: '#2563EB', badge: 'NONE', sortOrder: 4 },
      { id: 'adm-207', name: '207', area: 'VIP Sofa', zoneId: 'zone-adm-vip', minimumSpend: 4450000, capacity: 6, description: 'Sofa VIP, phù hợp nhóm muốn riêng tư hơn nhưng vẫn giữ không khí club.', status: 'AVAILABLE', shape: 'SOFA', bookingMode: 'REQUEST', x: 18, y: 55, width: 11, height: 6, color: '#8B5CF6', badge: 'VIP', sortOrder: 5 },
      { id: 'adm-208', name: '208', area: 'VIP Sofa', zoneId: 'zone-adm-vip', minimumSpend: 4450000, capacity: 6, description: 'Sofa VIP bên hông, phù hợp nhóm sinh nhật nhỏ.', status: 'AVAILABLE', shape: 'SOFA', bookingMode: 'REQUEST', x: 18, y: 47, width: 11, height: 6, color: '#8B5CF6', badge: 'VIP', sortOrder: 6 },
      { id: 'adm-110', name: '110', area: 'Gần DJ / Sân khấu', zoneId: 'zone-adm-dj', minimumSpend: 12000000, capacity: 10, description: 'Vị trí nổi bật gần sân khấu, cần concierge kiểm tra trực tiếp trước khi giữ chỗ.', status: 'INQUIRY', shape: 'RECT', bookingMode: 'MESSAGE_ONLY', x: 38, y: 55, width: 12, height: 6, color: '#C92A2A', badge: 'SVIP', sortOrder: 7 },
      { id: 'adm-111', name: '111', area: 'Gần DJ / Sân khấu', zoneId: 'zone-adm-dj', minimumSpend: 12000000, capacity: 10, description: 'Vị trí nổi bật gần sân khấu, phù hợp nhóm muốn trải nghiệm trung tâm.', status: 'INQUIRY', shape: 'RECT', bookingMode: 'MESSAGE_ONLY', x: 62, y: 55, width: 12, height: 6, color: '#C92A2A', badge: 'SVIP', sortOrder: 8 },
      { id: 'adm-01', name: '01', area: 'Khu trung tâm', zoneId: 'zone-adm-main', minimumSpend: 6000000, capacity: 5, description: 'Bàn trung tâm, gần âm thanh và ánh sáng.', status: 'AVAILABLE', shape: 'ROUND', bookingMode: 'REQUEST', x: 50, y: 45, width: 7, height: 7, color: '#F08A24', badge: 'NONE', sortOrder: 9 },
      { id: 'adm-02', name: '02', area: 'Khu trung tâm', zoneId: 'zone-adm-main', minimumSpend: 6000000, capacity: 5, description: 'Bàn trung tâm, dễ kết nối với các khu vực chính.', status: 'AVAILABLE', shape: 'ROUND', bookingMode: 'REQUEST', x: 60, y: 45, width: 7, height: 7, color: '#F08A24', badge: 'NONE', sortOrder: 10 },
    ],
    rating: 5,
    reviewsCount: 28,
  },
  {
    id: 'venue-2',
    name: 'Karaoke Lasvegas 1',
    category: 'Karaoke',
    location: 'Đà Nẵng',
    shortDescription: 'Không gian karaoke riêng tư cho nhóm bạn, gia đình, sinh nhật và các buổi gặp mặt cần phòng riêng.',
    longDescription: 'Karaoke Lasvegas 1 phù hợp cho nhóm khách cần phòng riêng, âm thanh tốt và quy trình xác nhận rõ ràng. DuyT Concierge hỗ trợ chọn phòng theo số lượng khách, kiểm tra khung giờ trống, ghi chú setup sinh nhật hoặc yêu cầu riêng trước khi khách đến.',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1400&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1527261834078-9b37d35a4a32?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1571266028243-d220c9c3b3e5?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1400&auto=format&fit=crop',
    ],
    menuUrl: 'Set đồ uống, trái cây, bia, rượu, snack, setup sinh nhật. Giá chưa bao gồm 10% VAT và 5% phí phục vụ.',
    openingHours: { open: '10:00', close: '02:00', label: '10:00 - 02:00' },
    viewCount: 6,
    floorPlanTheme: { style: 'LOUNGE', ratio: 'SQUARE', backgroundColor: '#15110F', accentColor: '#E3B36D', surfaceColor: '#211A16', gridColor: 'rgba(227,179,109,0.08)', texture: 'CARPET', helperText: 'Chọn phòng karaoke để xem sức chứa, minimum spend và trạng thái yêu cầu.', showGrid: false },
    floorPlanElements: [
      { id: 'ktv-vip-reception', type: 'CUSTOM', label: 'Lễ tân', x: 50, y: 91, width: 30, height: 6, color: '#D6A85F', order: 1, isActive: true },
      { id: 'ktv-vip-corridor', type: 'WALKWAY', label: 'Lối đi', x: 50, y: 52, width: 12, height: 72, color: '#D6A85F', order: 2, isActive: true },
      { id: 'ktv-vip-screen', type: 'SCREEN', label: 'Màn hình', x: 50, y: 12, width: 42, height: 5, color: '#8B5CF6', order: 3, isActive: true },
    ],
    tableZones: [
      { id: 'zone-ktv-vip', name: 'VIP Room', label: 'Phòng VIP', description: 'Phòng riêng cho nhóm cần không gian thoải mái và setup đẹp.', minimumSpend: 3000000, capacity: 12, color: '#8B5CF6', order: 1, isActive: true },
      { id: 'zone-ktv-group', name: 'Group Room', label: 'Phòng nhóm', description: 'Phòng phù hợp nhóm bạn, gia đình hoặc buổi gặp mặt.', minimumSpend: 1800000, capacity: 8, color: '#2563EB', order: 2, isActive: true },
    ],
    preferredTables: [
      { id: 'ktv-vip-01', name: 'VIP 01', area: 'Phòng VIP', zoneId: 'zone-ktv-vip', minimumSpend: 3000000, capacity: 12, description: 'Phòng VIP rộng, phù hợp sinh nhật hoặc nhóm cần không gian riêng.', status: 'AVAILABLE', shape: 'SOFA', bookingMode: 'REQUEST', x: 30, y: 36, width: 28, height: 14, color: '#8B5CF6', badge: 'VIP', sortOrder: 1 },
      { id: 'ktv-vip-02', name: 'VIP 02', area: 'Phòng VIP', zoneId: 'zone-ktv-vip', minimumSpend: 3000000, capacity: 12, description: 'Phòng VIP riêng tư, có thể ghi chú setup trước.', status: 'AVAILABLE', shape: 'SOFA', bookingMode: 'REQUEST', x: 70, y: 36, width: 28, height: 14, color: '#8B5CF6', badge: 'VIP', sortOrder: 2 },
      { id: 'ktv-room-03', name: 'Room 03', area: 'Phòng nhóm', zoneId: 'zone-ktv-group', minimumSpend: 1800000, capacity: 8, description: 'Phòng nhóm tiêu chuẩn, phù hợp nhóm bạn hoặc gia đình.', status: 'AVAILABLE', shape: 'RECT', bookingMode: 'REQUEST', x: 30, y: 66, width: 26, height: 12, color: '#2563EB', badge: 'NONE', sortOrder: 3 },
      { id: 'ktv-room-04', name: 'Room 04', area: 'Phòng nhóm', zoneId: 'zone-ktv-group', minimumSpend: 1800000, capacity: 8, description: 'Phòng nhóm dễ sắp xếp lịch, cần concierge kiểm tra khung giờ.', status: 'AVAILABLE', shape: 'RECT', bookingMode: 'REQUEST', x: 70, y: 66, width: 26, height: 12, color: '#2563EB', badge: 'NONE', sortOrder: 4 },
    ],
    rating: 4.9,
    reviewsCount: 21,
  },
  {
    id: 'venue-3',
    name: 'Karaoke Lasvegas 1',
    category: 'Karaoke',
    location: 'Đà Nẵng',
    shortDescription: 'Karaoke phòng riêng cho nhóm đông, tiệc sinh nhật và các buổi gặp mặt cần sự riêng tư.',
    longDescription: 'Karaoke Lasvegas 1 hỗ trợ nhiều cấu hình phòng cho nhóm nhỏ đến nhóm đông. DuyT Concierge kiểm tra phòng trống, thời gian đến, sức chứa, minimum spend và các ghi chú setup trước khi xác nhận.',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1400&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1400&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1527261834078-9b37d35a4a32?q=80&w=1400&auto=format&fit=crop',
    ],
    menuUrl: 'Set karaoke, đồ uống, trái cây, beer tower, rượu, snack và setup sinh nhật. Giá chưa bao gồm 10% VAT và 5% phí phục vụ.',
    openingHours: { open: '10:00', close: '02:00', label: '10:00 - 02:00' },
    viewCount: 4,
    floorPlanTheme: { style: 'LOUNGE', ratio: 'SQUARE', backgroundColor: '#141018', accentColor: '#D6A85F', surfaceColor: '#201827', gridColor: 'rgba(214,168,95,0.08)', texture: 'CARPET', helperText: 'Chọn phòng theo số lượng khách, sức chứa và mức chi tiêu tối thiểu.', showGrid: false },
    floorPlanElements: [
      { id: 'ktv-main-reception', type: 'CUSTOM', label: 'Lễ tân', x: 50, y: 91, width: 30, height: 6, color: '#D6A85F', order: 1, isActive: true },
      { id: 'ktv-main-corridor', type: 'WALKWAY', label: 'Lối đi', x: 50, y: 52, width: 12, height: 72, color: '#D6A85F', order: 2, isActive: true },
      { id: 'ktv-main-screen', type: 'SCREEN', label: 'Màn hình', x: 50, y: 12, width: 42, height: 5, color: '#D6A85F', order: 3, isActive: true },
    ],
    tableZones: [
      { id: 'zone-ktv-large', name: 'Large Room', label: 'Phòng lớn', description: 'Phòng cho nhóm đông, tiệc sinh nhật hoặc liên hoan.', minimumSpend: 3500000, capacity: 16, color: '#C92A2A', order: 1, isActive: true },
      { id: 'zone-ktv-private', name: 'Private Room', label: 'Phòng riêng', description: 'Phòng riêng tư cho nhóm vừa và nhỏ.', minimumSpend: 2200000, capacity: 10, color: '#8B5CF6', order: 2, isActive: true },
    ],
    preferredTables: [
      { id: 'ktv-large-01', name: 'Large 01', area: 'Phòng lớn', zoneId: 'zone-ktv-large', minimumSpend: 3500000, capacity: 16, description: 'Phòng lớn dành cho nhóm đông, phù hợp tiệc sinh nhật hoặc liên hoan.', status: 'AVAILABLE', shape: 'SOFA', bookingMode: 'REQUEST', x: 30, y: 36, width: 30, height: 15, color: '#C92A2A', badge: 'VIP', sortOrder: 1 },
      { id: 'ktv-large-02', name: 'Large 02', area: 'Phòng lớn', zoneId: 'zone-ktv-large', minimumSpend: 3500000, capacity: 16, description: 'Phòng lớn, cần xác nhận khung giờ trước khi giữ chỗ.', status: 'AVAILABLE', shape: 'SOFA', bookingMode: 'REQUEST', x: 70, y: 36, width: 30, height: 15, color: '#C92A2A', badge: 'VIP', sortOrder: 2 },
      { id: 'ktv-private-05', name: 'Private 05', area: 'Phòng riêng', zoneId: 'zone-ktv-private', minimumSpend: 2200000, capacity: 10, description: 'Phòng riêng cho nhóm vừa, có thể ghi chú setup sinh nhật.', status: 'AVAILABLE', shape: 'RECT', bookingMode: 'REQUEST', x: 30, y: 67, width: 28, height: 12, color: '#8B5CF6', badge: 'NONE', sortOrder: 3 },
      { id: 'ktv-private-06', name: 'Private 06', area: 'Phòng riêng', zoneId: 'zone-ktv-private', minimumSpend: 2200000, capacity: 10, description: 'Phòng riêng cho nhóm bạn hoặc gia đình.', status: 'AVAILABLE', shape: 'RECT', bookingMode: 'REQUEST', x: 70, y: 67, width: 28, height: 12, color: '#8B5CF6', badge: 'NONE', sortOrder: 4 },
    ],
    rating: 4.8,
    reviewsCount: 18,
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    fullName: 'Minh Anh T.',
    phoneNumber: '+84 935 927 439',
    notes: 'Thường đặt ADM Club, ưu tiên khu bàn rõ ràng và xác nhận nhanh qua WhatsApp/Zalo.',
    vipStatus: VipStatus.VIP,
    favoriteVenueIds: ['venue-1'],
    createdAt: '2026-06-01T10:00:00Z',
  },
  {
    id: 'cust-2',
    fullName: 'Gia Hân N.',
    phoneNumber: '+84 902 111 222',
    notes: 'Hay đặt Karaoke Lasvegas 1 cho sinh nhật và nhóm bạn.',
    vipStatus: VipStatus.VVIP,
    favoriteVenueIds: ['venue-2', 'venue-3'],
    createdAt: '2026-06-03T12:15:00Z',
  },
  {
    id: 'cust-3',
    fullName: 'Quốc Bảo L.',
    phoneNumber: '+84 903 222 333',
    notes: 'Ưu tiên phòng karaoke nhóm đông, cần kiểm tra sức chứa và khung giờ trước.',
    vipStatus: VipStatus.STANDARD,
    favoriteVenueIds: ['venue-3'],
    createdAt: '2026-06-05T09:30:00Z',
  },
];

export const INITIAL_RESERVATIONS: ReservationRequest[] = [
  {
    id: 'res-1',
    venueId: 'venue-1',
    venueName: 'ADM Club',
    fullName: 'Minh Anh T.',
    phoneNumber: '+84 935 927 439',
    guestCount: 4,
    date: '2026-06-20',
    arrivalTime: '22:00',
    preferredTableId: 'adm-301',
    preferredTableName: '301',
    preferredTableArea: 'Bar Side',
    preferredTableMinimumSpend: 4500000,
    preferredTableColor: '#2563EB',
    preferredTableCapacity: 4,
    notes: 'Ưu tiên khu gần bar, xác nhận qua Zalo trước khi đến.',
    status: BookingStatus.CONFIRMED,
    createdAt: '2026-06-18T08:00:00Z',
    source: 'Zalo',
  },
  {
    id: 'res-2',
    venueId: 'venue-2',
    venueName: 'Karaoke Lasvegas 1',
    fullName: 'Gia Hân N.',
    phoneNumber: '+84 902 111 222',
    guestCount: 10,
    date: '2026-06-21',
    arrivalTime: '20:30',
    preferredTableId: 'ktv-vip-01',
    preferredTableName: 'VIP 01',
    preferredTableArea: 'Phòng VIP',
    preferredTableMinimumSpend: 3000000,
    preferredTableColor: '#8B5CF6',
    preferredTableCapacity: 12,
    notes: 'Setup sinh nhật, cần phòng riêng và xác nhận thời gian trước.',
    status: BookingStatus.NEW,
    createdAt: '2026-06-18T09:15:00Z',
    source: 'Instagram',
  },
  {
    id: 'res-3',
    venueId: 'venue-3',
    venueName: 'Karaoke Lasvegas 1',
    fullName: 'Quốc Bảo L.',
    phoneNumber: '+84 903 222 333',
    guestCount: 14,
    date: '2026-06-22',
    arrivalTime: '21:00',
    preferredTableId: 'ktv-large-01',
    preferredTableName: 'Large 01',
    preferredTableArea: 'Phòng lớn',
    preferredTableMinimumSpend: 3500000,
    preferredTableColor: '#C92A2A',
    preferredTableCapacity: 16,
    notes: 'Nhóm đông, cần phòng lớn và kiểm tra khung giờ còn trống.',
    status: BookingStatus.CONTACTED,
    createdAt: '2026-06-18T10:30:00Z',
    source: 'Web Form',
  },
];

export const DEFAULT_OPENING_HOURS = { open: '18:00', close: '02:00', label: '18:00 - 02:00' };

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=1400&auto=format&fit=crop';

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function isLargeInlineMedia(value: unknown) {
  if (typeof value !== 'string') return false;

  return (
    value.startsWith('data:video') ||
    value.length > 650_000
  );
}

function keepSafeMediaUrl(value: unknown) {
  if (typeof value !== 'string') return '';

  const clean = value.trim();

  if (!clean) return '';

  // Không lưu base64 video / ảnh quá lớn vào localStorage
  if (isLargeInlineMedia(clean)) return '';

  return clean;
}

function sanitizeVenuesForStorage(venues: Venue[]): Venue[] {
  return venues.map((venue) => {
    const safeVenue = { ...(venue as any) };

    const safeMainImage = keepSafeMediaUrl(safeVenue.image);

    const safeImages = Array.isArray(safeVenue.images)
      ? safeVenue.images
          .map((image: unknown) => keepSafeMediaUrl(image))
          .filter(Boolean)
      : [];

    safeVenue.image = safeMainImage || safeImages[0] || FALLBACK_IMAGE;
    safeVenue.images = safeImages;

    // Không lưu uploaded video dạng base64 vào localStorage/Supabase fallback
    safeVenue.videoUrl = keepSafeMediaUrl(safeVenue.videoUrl);
    safeVenue.menuPdfUrl = keepSafeMediaUrl(safeVenue.menuPdfUrl);
    safeVenue.openingHours = safeVenue.openingHours && /^\d{2}:\d{2}$/.test(safeVenue.openingHours.open || '') && /^\d{2}:\d{2}$/.test(safeVenue.openingHours.close || '')
      ? safeVenue.openingHours
      : DEFAULT_OPENING_HOURS;
    safeVenue.viewCount = Math.max(0, Number(safeVenue.viewCount || 0));

    if (Array.isArray(safeVenue.reels)) {
      safeVenue.reels = safeVenue.reels.map((reel: any) => ({
        ...reel,
        videoUrl: keepSafeMediaUrl(reel.videoUrl),
        posterUrl: keepSafeMediaUrl(reel.posterUrl) || safeVenue.image,
      }));
    }

    return safeVenue as Venue;
  });
}

function sanitizePayloadForStorage(payload: ConciergeDataPayload): ConciergeDataPayload {
  return {
    venues: sanitizeVenuesForStorage(payload.venues),
    customers: payload.customers,
    reservations: payload.reservations,
  };
}

function safeSetLocalStorage(key: string, value: unknown) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
}

export function loadData() {
  const venues = safeJsonParse<Venue[]>(
    localStorage.getItem('duyt_venues'),
    INITIAL_VENUES
  );

  const customers = safeJsonParse<Customer[]>(
    localStorage.getItem('duyt_customers'),
    INITIAL_CUSTOMERS
  );

  const reservations = safeJsonParse<ReservationRequest[]>(
    localStorage.getItem('duyt_reservations'),
    INITIAL_RESERVATIONS
  );

  return {
    venues: sanitizeVenuesForStorage(venues),
    customers,
    reservations,
  };
}

export function saveVenues(venues: Venue[]) {
  const safeVenues = sanitizeVenuesForStorage(venues);
  safeSetLocalStorage('duyt_venues', safeVenues);
}

export function saveCustomers(customers: Customer[]) {
  safeSetLocalStorage('duyt_customers', customers);
}

export function saveReservations(reservations: ReservationRequest[]) {
  safeSetLocalStorage('duyt_reservations', reservations);
}

export interface ConciergeDataPayload {
  venues: Venue[];
  customers: Customer[];
  reservations: ReservationRequest[];
}

const API_TIMEOUT_MS = 12_000;

async function requestApi<T>(
  path: string,
  init: RequestInit,
  fallbackLabel: string,
  allowFallback = false,
): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const response = await fetch(path, { ...init, cache: 'no-store', signal: controller.signal });
    const json = await response.json().catch(() => null);
    if (!response.ok || !json?.ok || (!allowFallback && json.source === 'local-fallback')) {
      const issue = Array.isArray(json?.issues) ? json.issues[0]?.message : '';
      throw new Error(issue || json?.error || json?.warning || `Không thể ${fallbackLabel}`);
    }
    return json.data as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Yêu cầu ${fallbackLabel} quá thời gian chờ. Vui lòng kiểm tra kết nối Supabase.`);
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function readApiData<T>(path: string, fallbackLabel: string): Promise<T> {
  return requestApi<T>(path, { method: 'GET' }, `tải ${fallbackLabel}`);
}

async function writeApiData<T>(path: string, body: unknown, fallbackLabel: string): Promise<T> {
  return requestApi<T>(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, `đồng bộ ${fallbackLabel}`);
}

export async function loadVenuesFromServer(): Promise<Venue[]> {
  const venues = await readApiData<Venue[]>('/api/venues', 'địa điểm');
  return sanitizePayloadForStorage({ venues, customers: [], reservations: [] }).venues;
}

export async function loadVenueFromServer(venueId: string): Promise<Venue> {
  const venue = await readApiData<Venue>(`/api/venues/${encodeURIComponent(venueId)}`, 'địa điểm');
  return sanitizePayloadForStorage({ venues: [venue], customers: [], reservations: [] }).venues[0];
}

export async function loadCustomersFromServer(): Promise<Customer[]> {
  const customers = await readApiData<Customer[]>('/api/customers', 'khách hàng');
  return sanitizePayloadForStorage({ venues: [], customers, reservations: [] }).customers;
}

export async function loadReservationsFromServer(): Promise<ReservationRequest[]> {
  const reservations = await readApiData<ReservationRequest[]>('/api/reservations', 'booking');
  return sanitizePayloadForStorage({ venues: [], customers: [], reservations }).reservations;
}

export async function loadDataFromServer(): Promise<ConciergeDataPayload> {
  const data = await readApiData<ConciergeDataPayload>('/api/concierge', 'dữ liệu quản trị');
  return sanitizePayloadForStorage(data);
}

export async function saveDataToServer(payload: ConciergeDataPayload): Promise<ConciergeDataPayload> {
  const safePayload = sanitizePayloadForStorage(payload);
  const data = await writeApiData<ConciergeDataPayload>('/api/concierge', safePayload, 'dữ liệu quản trị');
  return sanitizePayloadForStorage(data);
}

export async function createReservationOnServer(reservation: ReservationRequest): Promise<ReservationRequest> {
  const data = await requestApi<ReservationRequest>('/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reservation),
  }, 'tạo booking');
  return sanitizePayloadForStorage({ venues: [], customers: [], reservations: [data] }).reservations[0];
}

export async function updateReservationOnServer(
  reservationId: string,
  patch: Partial<ReservationRequest>,
): Promise<ReservationRequest> {
  const data = await requestApi<ReservationRequest>(`/api/reservations/${encodeURIComponent(reservationId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  }, 'cập nhật booking');
  return sanitizePayloadForStorage({ venues: [], customers: [], reservations: [data] }).reservations[0];
}

export async function deleteReservationOnServer(reservationId: string): Promise<void> {
  await requestApi<{ id: string }>(`/api/reservations/${encodeURIComponent(reservationId)}`, {
    method: 'DELETE',
  }, 'xóa booking');
}

export async function createCustomerOnServer(customer: Customer): Promise<Customer> {
  return requestApi<Customer>('/api/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customer),
  }, 'tạo khách hàng');
}

export async function updateCustomerOnServer(customerId: string, customer: Customer): Promise<Customer> {
  return requestApi<Customer>(`/api/customers/${encodeURIComponent(customerId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customer),
  }, 'cập nhật khách hàng');
}

export async function deleteCustomerOnServer(customerId: string): Promise<void> {
  await requestApi<{ id: string }>(`/api/customers/${encodeURIComponent(customerId)}`, {
    method: 'DELETE',
  }, 'xóa khách hàng');
}

export async function createVenueOnServer(venue: Venue): Promise<Venue> {
  const data = await requestApi<Venue>('/api/venues', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(venue),
  }, 'tạo địa điểm');
  return sanitizePayloadForStorage({ venues: [data], customers: [], reservations: [] }).venues[0];
}

export async function updateVenueOnServer(venueId: string, patch: Partial<Venue>): Promise<Venue> {
  const data = await requestApi<Venue>(`/api/venues/${encodeURIComponent(venueId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  }, 'cập nhật địa điểm');
  return sanitizePayloadForStorage({ venues: [data], customers: [], reservations: [] }).venues[0];
}

export async function deleteVenueOnServer(venueId: string): Promise<void> {
  await requestApi<{ id: string }>(`/api/venues/${encodeURIComponent(venueId)}`, {
    method: 'DELETE',
  }, 'xóa địa điểm');
}
