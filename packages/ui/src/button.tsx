import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }
>;

export function Button({ children, className = '', variant = 'primary', ...props }: ButtonProps) {
  const styles =
    variant === 'primary'
      ? 'bg-yuta-ink text-white hover:bg-yuta-ink/90'
      : 'border border-yuta-line bg-white text-yuta-ink hover:bg-yuta-mist';

  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-yuta-accent focus:ring-offset-2 ${styles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
