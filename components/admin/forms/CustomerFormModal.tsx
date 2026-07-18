'use client';

import React, { useEffect, useState } from 'react';
import { VipStatus, type Customer } from '@/components/aurelius/types';
import { useAdminData } from '../AdminDataProvider';
import { isVietnamesePhone, slugId } from '../utils';
import { Button } from '../ui/Button';
import { FormField, inputClass, textareaClass } from '../ui/FormField';
import { Modal } from '../ui/Modal';

export function CustomerFormModal({ open, customer, onClose }: { open: boolean; customer?: Customer | null; onClose: () => void }) {
  const { saveCustomer, saving, showToast } = useAdminData();
  const [draft, setDraft] = useState({ fullName: '', phoneNumber: '', vipStatus: VipStatus.STANDARD, notes: '' });

  useEffect(() => {
    if (!open) return;
    // Reset the editable form whenever a different record is opened.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft({
      fullName: customer?.fullName || '',
      phoneNumber: customer?.phoneNumber || '',
      vipStatus: customer?.vipStatus || VipStatus.STANDARD,
      notes: customer?.notes || '',
    });
  }, [customer, open]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (draft.fullName.trim().length < 2) return showToast('error', 'Tên khách hàng cần ít nhất 2 ký tự.');
    if (!isVietnamesePhone(draft.phoneNumber)) return showToast('error', 'Số điện thoại không hợp lệ.');
    try {
      await saveCustomer({
        id: customer?.id || slugId('cust'),
        fullName: draft.fullName.trim(),
        phoneNumber: draft.phoneNumber.trim(),
        vipStatus: draft.vipStatus,
        notes: draft.notes.trim(),
        favoriteVenueIds: customer?.favoriteVenueIds || [],
        createdAt: customer?.createdAt || new Date().toISOString(),
      });
      onClose();
    } catch {
      // Provider displays the validation or synchronization error.
    }
  };

  return (
    <Modal open={open} title={customer ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng'} description="Hồ sơ riêng của khách và phân hạng chăm sóc." onClose={onClose} size="md" footer={<><Button variant="secondary" onClick={onClose}>Hủy</Button><Button type="submit" form="customer-form" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu khách hàng'}</Button></>}>
      <form id="customer-form" onSubmit={submit} className="space-y-5">
        <FormField label="Họ và tên" required><input className={inputClass} value={draft.fullName} onChange={(event) => setDraft({ ...draft, fullName: event.target.value })} /></FormField>
        <FormField label="Số điện thoại" required><input className={inputClass} value={draft.phoneNumber} onChange={(event) => setDraft({ ...draft, phoneNumber: event.target.value })} /></FormField>
        <FormField label="Phân hạng"><select className={inputClass} value={draft.vipStatus} onChange={(event) => setDraft({ ...draft, vipStatus: event.target.value as VipStatus })}>{Object.values(VipStatus).map((status) => <option key={status}>{status}</option>)}</select></FormField>
        <FormField label="Ghi chú"><textarea className={textareaClass} value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="Sở thích, lịch sử chăm sóc, lưu ý riêng..." /></FormField>
      </form>
    </Modal>
  );
}
