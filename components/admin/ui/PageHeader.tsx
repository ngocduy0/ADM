import React from 'react';

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="duyt-admin-page-header mb-7 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2.5">{actions}</div> : null}
    </div>
  );
}
