import type { HTMLAttributes, PropsWithChildren } from 'react';

export function Card({ children, className = '', ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div className={`rounded-2xl border border-yuta-line bg-white p-5 shadow-card ${className}`} {...props}>
      {children}
    </div>
  );
}
