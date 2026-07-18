import {
  Bell,
  CalendarDays,
  Film,
  FolderOpen,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  PhoneCall,
  Settings,
  TableProperties,
  Users,
} from 'lucide-react';

export const adminNavigation = [
  { name: 'Tổng quan', href: '/admin', icon: LayoutDashboard, section: 'Tổng quan' },
  { name: 'Đặt chỗ', href: '/admin/bookings', icon: CalendarDays, section: 'Vận hành' },
  { name: 'Bàn', href: '/admin/tables', icon: TableProperties, section: 'Vận hành' },
  { name: 'Địa điểm', href: '/admin/venues', icon: MapPin, section: 'Vận hành' },
  { name: 'Reels', href: '/admin/reels', icon: Film, section: 'Nội dung' },
  { name: 'Banners', href: '/admin/banners', icon: ImageIcon, section: 'Nội dung' },
  { name: 'Homepage', href: '/admin/homepage', icon: Home, section: 'Nội dung' },
  { name: 'Liên hệ', href: '/admin/contacts', icon: PhoneCall, section: 'Nội dung' },
  { name: 'Khách hàng', href: '/admin/customers', icon: Users, section: 'Khách hàng' },
  { name: 'Yêu cầu', href: '/admin/requests', icon: MessageSquare, section: 'Khách hàng' },
  { name: 'Tệp dữ liệu', href: '/admin/data-files', icon: FolderOpen, section: 'Hệ thống' },
  { name: 'Thông báo', href: '/admin/notifications', icon: Bell, section: 'Hệ thống' },
  { name: 'Cài đặt', href: '/admin/settings', icon: Settings, section: 'Hệ thống' },
];

export function getAdminPageTitle(pathname: string) {
  if (pathname === '/admin') return 'Dashboard';
  if (pathname.startsWith('/admin/bookings/calendar')) return 'Lịch đặt chỗ';
  if (/^\/admin\/venues\/[^/]+\/layout/.test(pathname)) return 'Sơ đồ bàn';
  if (pathname.startsWith('/admin/reels/new')) return 'Tạo Reel';
  return adminNavigation.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.name || 'DuyT Booking';
}
