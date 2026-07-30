import React from 'react';
import { cn } from '../utils';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const variants: Record<Variant, string> = {
  primary: 'bg-[#1F3A8A] text-white shadow-lg shadow-[#1F3A8A]/20 hover:bg-[#172d6d]',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
  outline: 'border border-slate-200 bg-white text-slate-900 hover:bg-slate-50',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
  danger: 'bg-red-600 text-white shadow-lg shadow-red-600/15 hover:bg-red-700',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 rounded-lg px-3 text-xs',
  md: 'h-11 rounded-xl px-5 text-sm',
  lg: 'h-12 rounded-xl px-7 text-sm',
  icon: 'h-10 w-10 rounded-xl',
};

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }>(
  ({ className, variant = 'primary', size = 'md', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-2 font-bold transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
