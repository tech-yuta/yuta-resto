import { cn } from '@yuta/ui';
import type { Supplier } from './suppliers-model';

export function SupplierLogo({
  supplier,
  size,
}: {
  supplier: Supplier;
  size: 'sm' | 'lg';
}) {
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-full font-black shadow-xs',
        supplier.logoTone,
        size === 'lg' ? 'h-14 w-14 text-sm' : 'h-10 w-10 text-[10px]',
      )}
    >
      {supplier.logo}
    </span>
  );
}
