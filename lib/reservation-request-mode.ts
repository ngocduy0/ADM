export const ADMIN_BOOKING_REQUEST_HEADER = 'x-duyt-admin-request';

export function isExplicitAdminBookingRequest(
  request: Request,
  hasValidAdminSession: boolean,
) {
  return hasValidAdminSession
    && request.headers.get(ADMIN_BOOKING_REQUEST_HEADER) === '1';
}
