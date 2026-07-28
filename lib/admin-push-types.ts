export type AdminPushSubscriptionInput = {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  deviceName?: string;
};

export type AdminPushPayload = {
  title: string;
  body: string;
  url: string;
  tag: string;
  icon?: string;
  badge?: string;
  tableColor?: string;
  kind?: 'booking' | 'contact' | 'test' | 'system';
};

export type AdminPushDeliveryResult = {
  configured: boolean;
  attempted: number;
  delivered: number;
  failed: number;
  removed: number;
  reason?: string;
};

export type AdminPushStatusResponse = {
  ok: boolean;
  configured: boolean;
  enabledCount: number;
  error?: string;
};
