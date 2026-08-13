import { ImageResponse } from 'next/og';

export const alt = 'DuyT Booking — Da Nang Nightlife Concierge';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background:
            'linear-gradient(135deg, #05060a 0%, #0c1020 55%, #173064 100%)',
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#ffffff',
              color: '#080a10',
              fontSize: 30,
              fontWeight: 900,
            }}
          >
            DT
          </div>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 800, letterSpacing: '-0.02em' }}>
            DuyT Booking
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 940 }}>
          <div
            style={{
              display: 'flex',
              fontSize: 66,
              lineHeight: 1.03,
              fontWeight: 900,
              letterSpacing: '-0.045em',
            }}
          >
            Da Nang Nightlife Concierge
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 24,
              fontSize: 27,
              lineHeight: 1.35,
              color: 'rgba(255,255,255,0.76)',
            }}
          >
            Curated venues · Table & room requests · Direct concierge support
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 20,
            color: 'rgba(255,255,255,0.62)',
          }}
        >
          <div style={{ display: 'flex' }}>www.duyt.com.vn</div>
          <div style={{ display: 'flex' }}>DuyT Concierge</div>
        </div>
      </div>
    ),
    size,
  );
}
