'use client';

import { AlertTriangle, CheckCircle2, ChevronRight, Download, FileJson, FileSpreadsheet, FileText, RefreshCcw, UploadCloud, XCircle } from 'lucide-react';
import { useRef, useState } from 'react';
import { BookingStatus, type ReservationRequest } from '@/components/aurelius/types';
import { useAdminData } from '../AdminDataProvider';
import type { ConciergePayload } from '../types';
import { Card } from '../ui/Card';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { PageHeader } from '../ui/PageHeader';
import { csvCell, downloadText, slugId } from '../utils';

function bookingCsv(reservations: ReservationRequest[]) {
  const header = ['id', 'referenceCode', 'fullName', 'phoneNumber', 'venueId', 'venueName', 'guestCount', 'date', 'arrivalTime', 'preferredTableId', 'preferredTableName', 'notes', 'status', 'source', 'createdAt'];
  return [header.map(csvCell).join(','), ...reservations.map((item) => header.map((key) => csvCell((item as unknown as Record<string, unknown>)[key])).join(','))].join('\n');
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') { value += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) { row.push(value); value = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(value); value = '';
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
    } else value += char;
  }
  if (value || row.length) { row.push(value); rows.push(row); }
  return rows;
}

export function DataFilesPage() {
  const { venues, reservations, customers, replaceData, resetData, showToast } = useAdminData();
  const [dragging, setDragging] = useState(false);
  const [state, setState] = useState<{ kind: 'idle' | 'success' | 'error'; message?: string }>({ kind: 'idle' });
  const [resetOpen, setResetOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const payload: ConciergePayload = { venues, reservations, customers };

  const exportJson = () => downloadText(`duyt-booking-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8');
  const exportCsv = () => downloadText(`duyt-bookings-${new Date().toISOString().slice(0, 10)}.csv`, `\uFEFF${bookingCsv(reservations)}`, 'text/csv;charset=utf-8');
  const exportExcel = () => {
    const rows = reservations.map((item) => `<tr><td>${item.referenceCode || item.id}</td><td>${item.fullName}</td><td>${item.phoneNumber}</td><td>${item.venueName}</td><td>${item.preferredTableName}</td><td>${item.date}</td><td>${item.arrivalTime}</td><td>${item.status}</td></tr>`).join('');
    downloadText(`duyt-bookings-${new Date().toISOString().slice(0, 10)}.xls`, `<!doctype html><html><head><meta charset="utf-8"></head><body><table border="1"><tr><th>Mã</th><th>Khách hàng</th><th>Điện thoại</th><th>Địa điểm</th><th>Bàn</th><th>Ngày</th><th>Giờ</th><th>Trạng thái</th></tr>${rows}</table></body></html>`, 'application/vnd.ms-excel;charset=utf-8');
  };
  const exportTemplate = () => downloadText('duyt-booking-import-template.csv', '\uFEFF' + ['fullName', 'phoneNumber', 'venueId', 'guestCount', 'date', 'arrivalTime', 'preferredTableId', 'notes', 'source'].map(csvCell).join(',') + '\n' + ['Nguyễn Văn A', '0901234567', venues[0]?.id || 'venue-1', '4', new Date().toISOString().slice(0, 10), '21:30', venues[0]?.preferredTables[0]?.id || '', 'Sinh nhật', 'Web Form'].map(csvCell).join(','), 'text/csv;charset=utf-8');

  const importFile = async (file?: File) => {
    if (!file) return;
    setState({ kind: 'idle' });
    try {
      const text = await file.text();
      if (file.name.toLowerCase().endsWith('.json')) {
        const json = JSON.parse(text) as Partial<ConciergePayload>;
        if (!Array.isArray(json.venues) || !Array.isArray(json.reservations) || !Array.isArray(json.customers)) throw new Error('File JSON phải có đủ venues, reservations và customers.');
        await replaceData(json as ConciergePayload);
        setState({ kind: 'success', message: `Đã nhập ${json.venues.length} địa điểm, ${json.reservations.length} booking và ${json.customers.length} khách hàng.` });
      } else if (file.name.toLowerCase().endsWith('.csv')) {
        const rows = parseCsv(text.replace(/^\uFEFF/, ''));
        if (rows.length < 2) throw new Error('File CSV không có dữ liệu.');
        const header = rows[0].map((cell) => cell.trim());
        const created: ReservationRequest[] = rows.slice(1).map((cells) => {
          const record = Object.fromEntries(header.map((key, index) => [key, cells[index] || '']));
          const venue = venues.find((item) => item.id === record.venueId) || venues.find((item) => item.name === record.venueName) || venues[0];
          if (!venue) throw new Error('Hệ thống chưa có địa điểm để gắn booking.');
          const table = venue.preferredTables.find((item) => item.id === record.preferredTableId) || venue.preferredTables[0];
          return {
            id: record.id || slugId('res'), referenceCode: record.referenceCode || `DT-${Date.now().toString().slice(-7)}`,
            fullName: record.fullName || 'Khách import', phoneNumber: record.phoneNumber || '', venueId: venue.id, venueName: venue.name,
            guestCount: Number(record.guestCount || 1), date: record.date || new Date().toISOString().slice(0, 10), arrivalTime: record.arrivalTime || '21:00',
            preferredTableId: table?.id || '', preferredTableName: table?.name || 'Chưa chọn bàn', preferredTableArea: table?.area,
            preferredTableMinimumSpend: table?.minimumSpend, preferredTableColor: table?.color, preferredTableCapacity: table?.capacity,
            notes: record.notes || '', status: Object.values(BookingStatus).includes(record.status as BookingStatus) ? record.status as BookingStatus : BookingStatus.NEW,
            source: ['WhatsApp', 'Telegram', 'Zalo', 'Instagram', 'Web Form'].includes(record.source) ? record.source as ReservationRequest['source'] : 'Web Form',
            createdAt: record.createdAt || new Date().toISOString(),
          };
        });
        await replaceData({ venues, customers, reservations: [...created, ...reservations] });
        setState({ kind: 'success', message: `Đã nhập ${created.length} booking từ CSV.` });
      } else throw new Error('Chỉ hỗ trợ file .json hoặc .csv.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể nhập dữ liệu.';
      setState({ kind: 'error', message });
      showToast('error', message);
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="pb-10">
      <PageHeader title="Tệp dữ liệu" description="Nhập, xuất, sao lưu và đặt lại dữ liệu quản trị." />
      <div className="mb-8 grid gap-5 md:grid-cols-3">
        <FileCard icon={<FileSpreadsheet size={24} />} title="Xuất dữ liệu" description="Tải danh sách booking để phân tích hoặc lưu trữ." actions={<><button onClick={exportExcel}>Excel (.xls)<Download size={15} /></button><button onClick={exportCsv}>CSV<Download size={15} /></button></>} />
        <FileCard icon={<FileText size={24} />} title="Mẫu Import" description="Tệp mẫu chuẩn để nhập booking hàng loạt." actions={<button onClick={exportTemplate}>CSV Template<ChevronRight size={15} /></button>} tone="warning" />
        <FileCard icon={<RefreshCcw size={24} />} title="Hệ thống" description="Sao lưu đầy đủ hoặc đặt lại dữ liệu mẫu." actions={<><button onClick={exportJson}>Sao lưu JSON<FileJson size={15} /></button><button className="!text-red-600 hover:!bg-red-50" onClick={() => setResetOpen(true)}>Đặt lại dữ liệu<AlertTriangle size={15} /></button></>} tone="danger" />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <button
            className={`w-full rounded-[30px] border-2 border-dashed bg-white p-1 text-center transition ${dragging ? 'border-[#1F3A8A] bg-[#1F3A8A]/5' : 'border-slate-300 hover:border-[#1F3A8A]'}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => { event.preventDefault(); setDragging(false); importFile(event.dataTransfer.files[0]); }}
          >
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[26px] bg-slate-50/60 px-8 py-14"><span className="grid h-20 w-20 place-items-center rounded-full bg-[#D9DFF5] text-[#1F3A8A]"><UploadCloud size={38} /></span><h2 className="mt-6 text-2xl font-black">Tải lên tệp dữ liệu</h2><p className="mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">Kéo thả file backup JSON hoặc CSV booking vào đây, hoặc nhấn để chọn từ máy tính.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black"><CheckCircle2 size={14} className="mr-1 inline text-[#1F3A8A]" />Hỗ trợ .json, .csv</span><span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black"><CheckCircle2 size={14} className="mr-1 inline text-[#1F3A8A]" />Đồng bộ Supabase</span></div></div>
          </button>
          <input ref={inputRef} type="file" accept=".json,.csv,text/csv,application/json" className="hidden" onChange={(event) => importFile(event.target.files?.[0])} />
        </div>
        <div className="space-y-5"><h3 className="px-2 text-lg font-black">Trạng thái xử lý</h3><Card className="p-5"><p className="text-xs font-black uppercase tracking-wider text-slate-400">Dữ liệu hiện tại</p><div className="mt-4 grid grid-cols-3 gap-2 text-center"><Count value={venues.length} label="Địa điểm" /><Count value={reservations.length} label="Booking" /><Count value={customers.length} label="Khách" /></div></Card>{state.kind === 'success' ? <div className="rounded-2xl border border-emerald-200 border-l-4 border-l-emerald-500 bg-emerald-50 p-5"><div className="flex gap-3"><CheckCircle2 size={20} className="shrink-0 text-emerald-600" /><div><p className="text-sm font-black">Nhập thành công</p><p className="mt-1 text-xs font-medium leading-5 text-slate-600">{state.message}</p></div></div></div> : null}{state.kind === 'error' ? <div className="rounded-2xl border border-red-200 border-l-4 border-l-red-500 bg-red-50 p-5"><div className="flex gap-3"><XCircle size={20} className="shrink-0 text-red-600" /><div><p className="text-sm font-black">Nhập thất bại</p><p className="mt-1 text-xs font-medium leading-5 text-slate-600">{state.message}</p></div></div></div> : null}</div>
      </div>
      <ConfirmDialog open={resetOpen} title="Đặt lại toàn bộ dữ liệu?" description="Tất cả dữ liệu hiện tại sẽ được thay bằng dữ liệu mẫu ban đầu. Hãy tải backup JSON trước khi tiếp tục." confirmLabel="Đặt lại dữ liệu" onClose={() => setResetOpen(false)} onConfirm={resetData} />
    </div>
  );
}

function FileCard({ icon, title, description, actions, tone = 'primary' }: { icon: React.ReactNode; title: string; description: string; actions: React.ReactNode; tone?: 'primary' | 'warning' | 'danger' }) { const cls = tone === 'warning' ? 'bg-amber-50 text-amber-600' : tone === 'danger' ? 'bg-red-50 text-red-600' : 'bg-[#D9DFF5] text-[#1F3A8A]'; return <Card className="p-6"><span className={`grid h-12 w-12 place-items-center rounded-2xl ${cls}`}>{icon}</span><h3 className="mt-4 text-lg font-black">{title}</h3><p className="mt-1 min-h-10 text-xs font-medium leading-5 text-slate-500">{description}</p><div className="mt-4 space-y-1 [&>button]:flex [&>button]:w-full [&>button]:items-center [&>button]:justify-between [&>button]:rounded-xl [&>button]:p-3 [&>button]:text-left [&>button]:text-sm [&>button]:font-black [&>button]:text-slate-800 [&>button]:transition [&>button:hover]:bg-slate-100">{actions}</div></Card>; }
function Count({ value, label }: { value: number; label: string }) { return <div className="rounded-xl bg-slate-50 p-3"><p className="text-xl font-black">{value}</p><p className="mt-1 text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p></div>; }
