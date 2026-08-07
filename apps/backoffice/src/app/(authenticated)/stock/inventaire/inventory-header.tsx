import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@yuta/ui';
import { ChevronDown, Download, Plus } from 'lucide-react';

export function InventoryHeader() {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Inventaire</h1>
        <p className="mt-1 text-sm text-secondary">
          Suivez vos stocks, réalisez vos comptages et identifiez les écarts.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="lg" disabled>
              <Download className="h-4 w-4" />
              Exporter
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Exporter en CSV</DropdownMenuItem>
            <DropdownMenuItem>Exporter en PDF</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button size="lg" disabled>
          <Plus className="h-5 w-5" />
          Nouvel inventaire
        </Button>
      </div>
    </header>
  );
}
