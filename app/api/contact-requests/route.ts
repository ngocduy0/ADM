import { NextResponse } from 'next/server';
import { getSupabaseAdminClient, writeSecurityLog } from '@/lib/concierge-repository';
import { consumeRateLimit, getClientIp } from '@/lib/request-rate-limit';

export const dynamic = 'force-dynamic';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;
const CONTACT_PREFIX = 'contact-';

type ContactRequestBody = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  message?: unknown;
  locale?: unknown;
  website?: unknown;
};

function text(value: unknown, maxLength: number) {
  return String(value ?? '').trim().replace(/\r\n?/g, '\n').slice(0, maxLength);
}

function validationError(error: string, field: string) {
  return NextResponse.json({ ok: false, error, field }, { status: 422 });
}

export async function POST(request: Request) {
  const rate = consumeRateLimit(`contact:${getClientIp(request)}`, 5, 15 * 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { ok: false, error: 'Bạn đã gửi quá nhiều yêu cầu liên hệ. Vui lòng thử lại sau.' },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null) as ContactRequestBody | null;
  if (!body) return NextResponse.json({ ok: false, error: 'Dữ liệu gửi lên không hợp lệ.' }, { status: 400 });

  // Honeypot: người dùng thật không nhìn thấy và không điền trường này.
  if (text(body.website, 200)) {
    return NextResponse.json({ ok: true, referenceCode: 'LH-RECEIVED' }, { status: 201 });
  }

  const name = text(body.name, 80);
  const email = text(body.email, 160).toLowerCase();
  const phone = text(body.phone, 32).replace(/[\s().-]/g, '');
  const message = text(body.message, 1_500);
  const locale = text(body.locale, 12) || 'vi';

  if (name.length < 2) return validationError('Vui lòng nhập tên ít nhất 2 ký tự.', 'name');
  if (!EMAIL_PATTERN.test(email)) return validationError('Email chưa đúng định dạng.', 'email');
  if (!PHONE_PATTERN.test(phone)) return validationError('Số điện thoại chưa hợp lệ. Vui lòng kiểm tra mã vùng và số điện thoại.', 'phone');
  if (message.length < 10) return validationError('Nội dung yêu cầu cần ít nhất 10 ký tự.', 'message');

  const now = new Date();
  const token = crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase();
  const requestId = `${CONTACT_PREFIX}${now.getTime()}-${token.toLowerCase()}`;
  const referenceCode = `LH-${token.slice(0, 8)}`;
  const createdAt = now.toISOString();

  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from('AdminNotification').insert({
      id: requestId,
      reservationId: requestId,
      title: `Liên hệ mới · ${name}`,
      message: `Email: ${email}\nSố điện thoại: ${phone}\nNội dung:\n${message}\nMã yêu cầu: ${referenceCode}`,
      tableColor: '#7C3AED',
      isRead: false,
      createdAt,
      updatedAt: createdAt,
    });

    if (error) throw error;

    void writeSecurityLog('CONTACT_REQUEST_POST', request, {
      requestId,
      referenceCode,
      locale,
      emailDomain: email.split('@')[1] || '',
      phoneSuffix: phone.slice(-4),
      messageLength: message.length,
    });

    return NextResponse.json({
      ok: true,
      data: { id: requestId, referenceCode, createdAt },
    }, { status: 201 });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') console.error('[Contact request]', error);
    return NextResponse.json(
      { ok: false, error: 'Không thể ghi nhận yêu cầu liên hệ. Vui lòng thử lại hoặc dùng kênh liên hệ trực tiếp.' },
      { status: 503 },
    );
  }
}
