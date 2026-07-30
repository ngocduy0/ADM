import type { Customer, ReservationRequest, Venue } from '@/components/aurelius/types';

export type AdminNotification = {
  id: string;
  reservationId: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  tableColor?: string;
};

export type ConciergePayload = {
  venues: Venue[];
  reservations: ReservationRequest[];
  customers: Customer[];
};

export type ToastMessage = {
  id: number;
  kind: 'success' | 'error' | 'info';
  message: string;
};
