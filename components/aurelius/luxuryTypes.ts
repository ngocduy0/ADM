export interface Booking {
  id: string;
  guestName: string;
  avatar: string;
  venue: string;
  date: string;
  time: string;
  partySize: number;
  depositStatus: 'Paid' | 'Pending' | 'Refunded';
  bookingStatus: 'Confirmed' | 'Pending' | 'Cancelled' | 'Completed';
  notes?: string;
}

export interface VenuePerformance {
  id: string;
  name: string;
  bookingsCount: number;
  revenue: number;
  occupancy: number; // percentage
  miniChartPoints: number[]; // relative coordinates from 0 to 100 for line chart
  tagline: string;
}

export interface Message {
  id: string;
  senderName: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  replies: {
    sender: 'user' | 'admin';
    text: string;
    time: string;
  }[];
}

export interface Review {
  id: string;
  guestName: string;
  avatar: string;
  venueName: string;
  rating: number;
  reviewText: string;
  date: string;
}

export interface ScheduleItem {
  id: string;
  time: string;
  guestName: string;
  venue: string;
  status: string;
  isCustom?: boolean;
}
