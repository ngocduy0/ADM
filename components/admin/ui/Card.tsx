import React from 'react';
import { cn } from '../utils';

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_10px_40px_rgba(15,23,42,0.035)] transition-shadow duration-200 hover:shadow-[0_16px_50px_rgba(15,23,42,0.07)]',
        className,
      )}
      {...props}
    />
  );
}
