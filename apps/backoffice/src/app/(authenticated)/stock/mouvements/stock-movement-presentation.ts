import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  Package,
  type LucideIcon,
} from 'lucide-react';
import type { MovementType } from './stock-movements-model';

export const movementTypePresentation: Record<
  MovementType,
  {
    tone: 'success' | 'danger' | 'warning' | 'brand';
    icon: LucideIcon;
  }
> = {
  Entrée: { tone: 'success', icon: ArrowDown },
  Sortie: { tone: 'danger', icon: ArrowUp },
  Ajustement: { tone: 'warning', icon: ArrowLeftRight },
  Transfert: { tone: 'brand', icon: Package },
};
