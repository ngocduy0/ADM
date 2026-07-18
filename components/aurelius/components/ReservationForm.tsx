import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Copy, ExternalLink, Send, Users } from 'lucide-react';
import { Venue, ReservationRequest, PreferredTable } from '../types';
import { useI18n } from '../i18n';
import { buildReservationMessage, buildContactUrl, getContactChannels } from '../contactConfig';
import { usePublicSettings } from '../public/usePublicData';

interface ReservationFormProps {
  venue: Venue;
  onSubmit: (formData: Omit<ReservationRequest, 'id' | 'venueId' | 'venueName' | 'status' | 'createdAt' | 'source'>) => Promise<void> | void;
  onClose?: () => void;
  initialPreferredTableId?: string;
}

type SubmittedReservation = Omit<ReservationRequest, 'id' | 'venueId' | 'venueName' | 'status' | 'createdAt' | 'source'> & {
  venueName: string;
  area: string;
  minSpend: number;
  referenceCode: string;
};

function isVietnamPhone(phone: string) {
  return /^(\+84|84|0)(3|5|7|8|9)\d{8}$/.test(phone.replace(/[\s.-]/g, ''));
}

function getLocalDateInputValue(value = new Date()) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function timeOptionsForOpeningHours(open = '18:00', close = '02:00') {
  const start = toMinutes(open);
  let end = toMinutes(close);
  if (end <= start) end += 24 * 60;
  const result: string[] = [];
  for (let value = start; value <= end; value += 30) {
    const normalized = value % (24 * 60);
    const hours = String(Math.floor(normalized / 60)).padStart(2, '0');
    const minutes = String(normalized % 60).padStart(2, '0');
    result.push(`${hours}:${minutes}`);
  }
  return result;
}

function getDefaultArrivalTime(open = '18:00') {
  return open;
}

function isTimeWithinOpeningHours(time: string, open = '18:00', close = '02:00') {
  const options = timeOptionsForOpeningHours(open, close);
  return options.includes(time);
}

function isArrivalValid(date: string, time: string, open = '18:00', close = '02:00') {
  if (!date || !time || !/^\d{2}:\d{2}$/.test(time)) return false;
  if (!isTimeWithinOpeningHours(time, open, close)) return false;
  const bookingDate = new Date(`${date}T${time}:00`);
  if (Number.isNaN(bookingDate.getTime())) return false;
  if (date === getLocalDateInputValue()) return bookingDate.getTime() - Date.now() >= 30 * 60 * 1000;
  return bookingDate >= new Date(`${getLocalDateInputValue()}T00:00:00`);
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat('vi-VN').format(value)}đ`;
}

function colorText(hex = '') {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#FFFFFF';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 170 ? '#111827' : '#FFFFFF';
}

function bookingModeText(table?: PreferredTable) {
  if (table?.bookingMode === 'BIDDING') return 'Bidding · DuyT hỗ trợ giữ giá';
  if (table?.bookingMode === 'LOTTERY') return 'Lottery · cần xác nhận cùng venue';
  if (table?.bookingMode === 'MESSAGE_ONLY') return 'Cần xác nhận trực tiếp trước khi giữ chỗ';
  return 'Request · Concierge kiểm tra rồi xác nhận';
}

export default function ReservationForm({ venue, onSubmit, onClose, initialPreferredTableId }: ReservationFormProps) {
  const { siteSettings } = usePublicSettings();
  const { t } = useI18n();
  const availableTables = useMemo(() => venue.preferredTables.filter((table) => table.status !== 'HIDDEN'), [venue.preferredTables]);
  const initialTable = availableTables.find((table) => table.id === initialPreferredTableId) || availableTables[0];
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [guestCount, setGuestCount] = useState(Math.min(Math.max(2, initialTable?.capacity || 2), 12));
  const [date, setDate] = useState(getLocalDateInputValue());
  const openingHours = venue.openingHours || { open: '18:00', close: '02:00', label: '18:00 - 02:00' };
  const arrivalOptions = useMemo(() => timeOptionsForOpeningHours(openingHours.open, openingHours.close), [openingHours.open, openingHours.close]);
  const [arrivalTime, setArrivalTime] = useState(getDefaultArrivalTime(openingHours.open));
  const [preferredTableId, setPreferredTableId] = useState(initialTable?.id || '');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submittedData, setSubmittedData] = useState<SubmittedReservation | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedTable = availableTables.find((table) => table.id === preferredTableId) || availableTables[0];
  const maxGuests = Math.max(1, selectedTable?.capacity || 12);
  const guestOptions = Array.from({ length: Math.min(maxGuests, 12) }, (_, index) => index + 1);

  useEffect(() => {
    const nextTable = availableTables.find((table) => table.id === initialPreferredTableId) || availableTables[0];
    const timer = window.setTimeout(() => setPreferredTableId(nextTable?.id || ''), 0);
    return () => window.clearTimeout(timer);
  }, [initialPreferredTableId, availableTables]);

  useEffect(() => {
    const timer = window.setTimeout(() => setGuestCount((current) => Math.min(Math.max(1, current), maxGuests)), 0);
    return () => window.clearTimeout(timer);
  }, [maxGuests]);

  const copyMessage = async (message: string) => {
    try {
      await navigator.clipboard.writeText(message);
      setNotice('Đã copy nội dung. Nếu app không tự điền, hãy dán tin nhắn vừa copy.');
    } catch {
      setNotice('Không thể copy tự động. Bạn có thể copy thủ công trong ô tin nhắn.');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (fullName.trim().length < 2) return setError('Vui lòng nhập tên khách ít nhất 2 ký tự.');
    if (!isVietnamPhone(phoneNumber)) return setError('Vui lòng nhập đúng số điện thoại Việt Nam.');
    if (!isArrivalValid(date, arrivalTime, openingHours.open, openingHours.close)) return setError(`Vui lòng chọn giờ đến trong khung hoạt động của địa điểm (${openingHours.label || `${openingHours.open} - ${openingHours.close}`}). Nếu đặt hôm nay, giờ đến cần cách hiện tại ít nhất 30 phút.`);
    if (guestCount < 1 || guestCount > maxGuests) return setError(`Số khách vượt quá sức chứa của bàn ${selectedTable?.name || ''}.`);
    if (notes.length > 500) return setError('Ghi chú nên dưới 500 ký tự.');

    const referenceCode = `DUYT-${Date.now().toString().slice(-6)}`;
    const payload = {
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      guestCount,
      date,
      arrivalTime,
      preferredTableId: selectedTable?.id || '',
      preferredTableName: selectedTable?.name || 'Concierge chọn bàn phù hợp',
      notes: notes.trim(),
      referenceCode,
    };

    setSubmitting(true);
    try {
      await onSubmit(payload);
      setSubmittedData({
        ...payload,
        venueName: venue.name,
        area: selectedTable?.area || 'VIP Area',
        minSpend: selectedTable?.minimumSpend || 0,
        referenceCode,
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Không thể gửi booking. Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedData) {
    const message = buildReservationMessage({
      fullName: submittedData.fullName,
      phoneNumber: submittedData.phoneNumber,
      venueName: submittedData.venueName,
      date: submittedData.date,
      arrivalTime: submittedData.arrivalTime,
      guestCount: submittedData.guestCount,
      preferredTableName: submittedData.preferredTableName,
      notes: submittedData.notes,
      referenceCode: submittedData.referenceCode,
    });
    const socialChannels = getContactChannels(siteSettings);

    return (
      <div className="mx-auto max-w-xl overflow-hidden rounded-[28px] border border-gold/20 bg-[#101217] text-on-surface shadow-2xl shadow-black/35">
        <div className="bg-gradient-to-r from-[#6F1D1B] via-[#A7312D] to-[#6F1D1B] px-6 py-6 text-center text-white">
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-gold" />
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/70">Yêu cầu đã tạo</p>
          <h3 className="mt-1 text-2xl font-black">{submittedData.preferredTableName}</h3>
          <p className="mt-1 text-xs text-white/70">Mã tham chiếu: {submittedData.referenceCode}</p>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info label="Khách" value={submittedData.fullName} />
            <Info label="Địa điểm" value={submittedData.venueName} />
            <Info label="Ngày / giờ" value={`${submittedData.date} · ${submittedData.arrivalTime}`} />
            <Info label="Số khách" value={`${submittedData.guestCount} khách`} />
            <div className="col-span-2"><Info label="Chi tiêu tối thiểu dự kiến" value={`${submittedData.preferredTableName} · ${formatMoney(submittedData.minSpend)}`} gold /></div>
          </div>

          <div className="rounded-2xl border border-gold/15 bg-gold/10 p-4 text-xs leading-relaxed text-on-surface-variant">
            Hãy chọn kênh liên hệ. Hệ thống sẽ copy sẵn nội dung; với WhatsApp/Email/Telegram có thể mở kèm nội dung, còn Zalo/Instagram/Facebook sẽ mở kênh và bạn chỉ cần dán nếu app không tự điền.
          </div>

          <div className="rounded-2xl border border-gold/15 bg-deep-black/50 p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gold">Prepared message</span>
              <button type="button" onClick={() => copyMessage(message)} className="rounded-full border border-gold/20 px-3 py-1 text-[10px] font-bold text-gold hover:bg-gold/10"><Copy className="mr-1 inline h-3 w-3" />Copy</button>
            </div>
            <textarea readOnly value={message} rows={6} className="w-full resize-none rounded-xl border border-gold/10 bg-deep-black/80 p-3 text-xs leading-relaxed text-on-surface-variant outline-none" />
          </div>

          {notice && <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-100">{notice}</div>}

          <div className="grid grid-cols-2 gap-3">
            {socialChannels.map((channel) => {
              const href = buildContactUrl(channel.name, message, socialChannels);
              return (
                <a key={channel.name} href={href} target={channel.name === 'Email' ? undefined : '_blank'} rel="noopener noreferrer" onClick={() => copyMessage(message)} className="flex min-h-[92px] flex-col items-center justify-center rounded-2xl border border-gold/10 bg-deep-black/30 p-3 transition hover:border-gold/40 hover:bg-gold/5">
                  <img src={channel.icon} alt={channel.name} className="mb-2 h-9 w-9 rounded-full object-contain" />
                  <span className="text-xs font-bold text-on-surface">{channel.name}</span>
                  <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-gold">Mở kênh <ExternalLink className="h-3 w-3" /></span>
                </a>
              );
            })}
          </div>
          {onClose && <button type="button" onClick={onClose} className="w-full rounded-2xl border border-gold/15 px-4 py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant transition hover:border-gold hover:text-gold">Quay lại chi tiết địa điểm</button>}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl overflow-hidden rounded-[28px] border border-gold/20 bg-[#101217] text-left font-sans text-on-surface shadow-2xl shadow-black/35">
      <div className="relative px-5 py-5 text-white" style={{ background: `linear-gradient(135deg, ${selectedTable?.color || '#A7312D'}, rgba(0,0,0,0.74))` }}>
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/70">{selectedTable?.area || venue.name}</p>
        <h3 className="mt-1 text-3xl font-black leading-none">{selectedTable?.name || 'Chọn bàn'}</h3>
      </div>

      <div className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3">
          <Info label="Chi tiêu tối thiểu" value={formatMoney(selectedTable?.minimumSpend || 0)} gold />
          <Info label="Sức chứa" value={`Tối đa ${maxGuests}`} />
        </div>

        <div>
          <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-gold">Chọn bàn / khu</label>
          <select value={preferredTableId} onChange={(e) => setPreferredTableId(e.target.value)} className="w-full rounded-2xl border border-gold/10 bg-deep-black/80 px-4 py-3 text-sm font-semibold text-on-surface outline-none focus:border-gold">
            {availableTables.map((table) => <option key={table.id} value={table.id} className="bg-dark-navy text-on-surface">{table.name} · {table.area} · {formatMoney(table.minimumSpend)} · max {table.capacity}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div><label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-gold"><CalendarDays className="mr-1 inline h-3.5 w-3.5" />Ngày</label><input type="date" required min={getLocalDateInputValue()} value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} /></div>
          <div><label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-gold">Giờ đến</label><select required value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} className={inputClass}>{arrivalOptions.map((option) => <option key={option} value={option} className="bg-dark-navy text-on-surface">{option}</option>)}</select><p className="mt-1 text-[10px] font-semibold text-on-surface-variant/80">Giờ hoạt động: {openingHours.label || `${openingHours.open} - ${openingHours.close}`}</p></div>
        </div>

        <div>
          <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-gold"><Users className="mr-1 inline h-3.5 w-3.5" />Số khách · {guestCount}</label>
          <div className="flex flex-wrap gap-2">{guestOptions.map((num) => <button key={num} type="button" onClick={() => setGuestCount(num)} className={`min-w-10 rounded-full border px-3 py-2 text-xs font-black transition ${guestCount === num ? 'border-gold bg-gold text-dark-navy' : 'border-gold/10 bg-deep-black/50 text-on-surface hover:border-gold/40'}`}>{num}</button>)}</div>
        </div>

        <div><label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-gold">Tên</label><input type="text" required placeholder="Nguyễn Minh A" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} /></div>
        <div><label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-gold">Số điện thoại</label><input type="tel" required placeholder="0865 251 125" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className={inputClass} /></div>
        <div><label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-gold">Ghi chú</label><textarea rows={3} maxLength={500} placeholder="Ví dụ: setup sinh nhật, cần góc riêng, yêu cầu đồ uống..." value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputClass} resize-none leading-relaxed`} /><p className="mt-1 text-right text-[10px] text-on-surface-variant/60">{notes.length}/500</p></div>

        {error && <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-200">{error}</div>}

        <div className="rounded-2xl border border-gold/15 bg-gold/5 p-3 text-center"><p className="text-[11px] leading-relaxed text-gold-light/90">🔒 Concierge xác nhận trực tiếp với địa điểm. Chỗ chỉ được giữ sau khi có phản hồi chính thức.</p></div>
        <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gold px-5 py-4 text-xs font-black uppercase tracking-widest text-dark-navy shadow-lg shadow-gold/15 transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"><Send className="h-4 w-4" />{submitting ? 'Đang gửi...' : t('requestReservation')}</button>
      </div>
    </form>
  );
}

const inputClass = 'w-full rounded-2xl border border-gold/10 bg-deep-black/80 px-4 py-3 text-sm font-semibold text-on-surface outline-none transition focus:border-gold';

function Info({ label, value, gold = false }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="rounded-2xl border border-gold/10 bg-deep-black/45 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant/65">{label}</p>
      <p className={`mt-1 text-sm font-black ${gold ? 'text-gold' : 'text-on-surface'}`}>{value}</p>
    </div>
  );
}
