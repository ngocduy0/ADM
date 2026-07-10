'use client';

import LuxuryDashboard from './LuxuryDashboard';
import { Customer, ReservationRequest, Venue } from '../types';

interface AdminCRMProps {
  venues: Venue[];
  reservations: ReservationRequest[];
  customers: Customer[];
  onUpdateReservations: (reservations: ReservationRequest[]) => void;
  onUpdateCustomers: (customers: Customer[]) => void;
  onUpdateVenues: (venues: Venue[]) => void;
}

export default function AdminCRM({
  venues,
  reservations,
  customers,
  onUpdateReservations,
  onUpdateCustomers,
  onUpdateVenues,
}: AdminCRMProps) {
  return (
    <LuxuryDashboard
      coreVenues={venues}
      coreReservations={reservations}
      coreCustomers={customers}
      onUpdateReservations={onUpdateReservations}
      onUpdateCustomers={onUpdateCustomers}
      onUpdateVenues={onUpdateVenues}
    />
  );
}
