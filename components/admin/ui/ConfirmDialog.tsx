'use client';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';

export function ConfirmDialog({ open, title, description, confirmLabel = 'Xác nhận', danger = true, onClose, onConfirm }: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open={open} title={title} onClose={onClose} size="md" footer={<><Button variant="secondary" onClick={onClose}>Hủy</Button><Button variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button></>}>
      <div className="flex gap-4 rounded-2xl bg-red-50 p-4 text-red-800">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-100"><AlertTriangle size={20} /></div>
        <p className="pt-1 text-sm font-semibold leading-6">{description}</p>
      </div>
    </Modal>
  );
}
