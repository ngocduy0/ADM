# ADM Admin Screen Inventory

Project: `ADM Admin Responsive Redesign`  
Project ID: `8133016219890591615`  
Source of truth: `LuxuryDashboard.tsx` and its imported admin components.

| ID | Nhom chuc nang | Man hinh / UI state | Component nguon | File nguon | State / tab key | Cach mo | Desktop | Tablet | Mobile | Stitch hien co | Stitch ID | Coverage | Uu tien | Trang thai |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ADM-001 | Shell | Admin shell, sidebar mo/thu gon | DashboardContent | LuxuryDashboard.tsx | activeTab | Dang nhap `/admin` | Co | Co | Co | Co, ten cu | 33da... / a383... | Mot phan | P0 | REDESIGN |
| ADM-002 | Shell | Mobile bottom navigation va sheet Them | DashboardContent | LuxuryDashboard.tsx | activeTab | Mobile viewport | Khong | Co | Co | Mot phan | 222927... | Mot phan | P0 | REDESIGN |
| ADM-003 | Shell | Notification popover / center | DashboardContent | LuxuryDashboard.tsx | notificationOpen | Bam chuong | Co | Co | Co | Co, mobile | 222927... | Mot phan | P0 | REDESIGN |
| ADM-004 | Shell | Search, pagination, loading/empty/error | DashboardContent, PaginationControls | LuxuryDashboard.tsx | searchQuery/loading | Theo page state | Co | Co | Co | Chua day du | - | Thieu | P0 | TODO |
| ADM-005 | Dashboard | Tong quan | DashboardOverview | LuxuryDashboard.tsx | dashboard | Sidebar | Co | Co | Co | Hai ban trung | 33da... / a383... | Mot phan | P0 | REDESIGN |
| ADM-006 | Bookings | Danh sach/table/cards | BookingsPage | LuxuryDashboard.tsx | bookings | Sidebar | Co | Co | Co | Co, ten cu | fb3e... / 5b68... / 9804... | Mot phan | P0 | REDESIGN |
| ADM-007 | Bookings | Search/filter/status | BookingsPage | LuxuryDashboard.tsx | searchQuery/status | Toolbar/card action | Co | Co | Co | Mobile filter | 980477... | Mot phan | P0 | REDESIGN |
| ADM-008 | Bookings | Tao/sua booking | BookingModal | LuxuryDashboard.tsx | modal=booking/editingId | Page action/Sua | Co | Co | Co | Mobile create | 0d25... | Mot phan | P0 | REDESIGN |
| ADM-009 | Bookings | Empty/loading/error/delete confirm | BookingsPage, ConfirmDialog | LuxuryDashboard.tsx | async/confirmDialog | Data/action | Co | Co | Co | Chua | - | Thieu | P0 | TODO |
| ADM-010 | Guests | Danh sach khach | GuestsPage | LuxuryDashboard.tsx | guests | Sidebar | Co | Co | Co | Mobile detail only | 230298... | Thieu | P0 | TODO |
| ADM-011 | Guests | Lich su khach | CustomerHistoryModal | LuxuryDashboard.tsx | historyCustomer | Xem lich su | Co | Co | Co | Mot phan | 230298... | Mot phan | P0 | REDESIGN |
| ADM-012 | Guests | Tao/sua khach | CustomerModal | LuxuryDashboard.tsx | modal=customer/editingId | Page action/Sua | Co | Co | Co | Chua | - | Thieu | P0 | TODO |
| ADM-013 | Guests | Empty/loading/error/delete confirm | GuestsPage, ConfirmDialog | LuxuryDashboard.tsx | async/confirmDialog | Data/action | Co | Co | Co | Chua | - | Thieu | P1 | TODO |
| ADM-014 | Venues | Danh sach venue | VenuesPage | LuxuryDashboard.tsx | venues | Sidebar | Co | Co | Co | Mobile | 82ae... | Mot phan | P0 | REDESIGN |
| ADM-015 | Venues | Tao/sua venue day du | VenueModal | LuxuryDashboard.tsx | modal=venue/editingId | Page action/Sua | Co | Co | Co | Chua | - | Thieu | P0 | TODO |
| ADM-016 | Venues | Gallery/menu/media states | VenueModal | LuxuryDashboard.tsx | upload/loading/error | Trong venue editor | Co | Co | Co | Mot phan | 82ae... | Mot phan | P0 | TODO |
| ADM-017 | Table map | Manager desktop/tablet/mobile | TableMapManagerModal | TableMapManagerModal.tsx | tableManagerOpen | Quan ly so do | Co | Co | Co | Chua | - | Thieu | P0 | TODO |
| ADM-018 | Table map | Zone/table/element/theme/preview | TableMapManagerModal, FloorPlanSelector | TableMapManagerModal.tsx | editor tabs | Trong manager | Co | Co | Co | Chua | - | Thieu | P0 | TODO |
| ADM-019 | Reels | Grid/list/empty | ReelsPage | LuxuryDashboard.tsx | reels | Sidebar | Co | Co | Co | Chua | - | Thieu | P0 | TODO |
| ADM-020 | Reels | Tao/sua/preview | ReelModal | LuxuryDashboard.tsx | reelEditor | Them/Sua reel | Co | Co | Co | Chua | - | Thieu | P0 | TODO |
| ADM-021 | Reels | Upload video/poster/progress/error | ReelModal | LuxuryDashboard.tsx | uploading/error | Upload | Co | Co | Co | Media chung | 222927... | Mot phan | P0 | TODO |
| ADM-022 | Payments | Tong quan/table/cards/empty | PaymentsPage | LuxuryDashboard.tsx | payments | Sidebar | Co | Co | Co | Chua | - | Thieu | P1 | TODO |
| ADM-023 | Reviews | Tong quan/list/empty | ReviewsPage | LuxuryDashboard.tsx | reviews | Sidebar | Co | Co | Co | Chua | - | Thieu | P1 | TODO |
| ADM-024 | Messages | Booking-based messages/empty | MessagesPage | LuxuryDashboard.tsx | messages | Sidebar | Co | Co | Co | Chua | - | Thieu | P1 | TODO |
| ADM-025 | Analytics | Metrics/charts/empty | AnalyticsPage | LuxuryDashboard.tsx | analytics | Sidebar | Co | Co | Co | Chua | - | Thieu | P1 | TODO |
| ADM-026 | Files | Import/export/reset | FilesPage | LuxuryDashboard.tsx | files | Sidebar | Co | Co | Co | Chua | - | Thieu | P1 | TODO |
| ADM-027 | Files | Import progress/success/error | FilesPage | LuxuryDashboard.tsx | import async | Chon file | Co | Co | Co | Chua | - | Thieu | P1 | TODO |
| ADM-028 | Settings | Language/logo/settings | SettingsPage | LuxuryDashboard.tsx | settings | Sidebar | Co | Co | Co | Chua | - | Thieu | P0 | TODO |
| ADM-029 | Settings | Banner video manager | BannerVideoManager | BannerVideoManager.tsx | open/loading/saving | Settings | Co | Co | Co | Chua | - | Thieu | P0 | TODO |
| ADM-030 | Global | Confirm dialog | ConfirmDialog | LuxuryDashboard.tsx | confirmDialog | Delete/reset | Co | Co | Co | Chua | - | Thieu | P0 | TODO |
| ADM-031 | Global | Booking live toast | BookingLiveToast | LuxuryDashboard.tsx | liveToast | Realtime booking | Co | Co | Co | Chua | - | Thieu | P0 | TODO |
| ADM-032 | Global | Success/error/info toast | Toast | LuxuryDashboard.tsx | toast | Mutation result | Co | Co | Co | Chua | - | Thieu | P1 | TODO |
| ADM-033 | Global | Modal/sheet/drawer/disabled/saving | ModalShell, forms | LuxuryDashboard.tsx | modal/async | Theo action | Co | Co | Co | Chua | - | Thieu | P0 | TODO |

## Business contracts

- Booking statuses, customer tiers, venue categories, table statuses/shapes/modes and reel placements are preserved exactly.
- Vietnamese phone validation, opening-hour validation, 30-minute lead time, party size 1-30, table capacity and 500-character notes remain unchanged.
- Supabase schema, API routes, authentication, realtime subscriptions, notification history, uploads and production data are outside design scope.

## Final status

All inventory rows ADM-001 through ADM-033 are now either **DESIGNED** or **COVERED_BY_COMPONENT_BOARD**. Canonical screen IDs are maintained in `STITCH_COVERAGE.md`.

- ADM-001 through ADM-003: DESIGNED in shell screens.
- ADM-004: COVERED_BY_COMPONENT_BOARD.
- ADM-005 through ADM-008: DESIGNED.
- ADM-009: COVERED_BY_COMPONENT_BOARD and booking domain board.
- ADM-010 through ADM-012: DESIGNED.
- ADM-013: COVERED_BY_COMPONENT_BOARD and guest state strip.
- ADM-014 through ADM-021: DESIGNED.
- ADM-022 through ADM-029: DESIGNED.
- ADM-030 through ADM-033: COVERED_BY_COMPONENT_BOARD and feedback boards.
