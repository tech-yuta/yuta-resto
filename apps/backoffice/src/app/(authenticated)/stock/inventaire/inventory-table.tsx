'use client';

import {
  Badge,
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SimpleTable,
  SimpleTableBody,
  SimpleTableCell,
  SimpleTableHead,
  SimpleTableHeader,
  SimpleTableRow,
  cn,
} from '@yuta/ui';
import {
  Boxes,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreVertical,
} from 'lucide-react';
import {
  formatInventoryCurrency,
  formatInventoryStock,
  type InventoryItem,
} from './inventory-model';
import { inventoryStatusTones } from './inventory-presentation';

export function InventoryTable({
  items,
  selectedId,
  checkedIds,
  allChecked,
  onSelect,
  onToggle,
  onToggleAll,
}: {
  items: readonly InventoryItem[];
  selectedId: string;
  checkedIds: readonly string[];
  allChecked: boolean;
  onSelect(id: string): void;
  onToggle(id: string, checked: boolean): void;
  onToggleAll(checked: boolean): void;
}) {
  return (
    <>
      <SimpleTable className="min-w-[960px]">
        <SimpleTableHeader className="bg-surface">
          <SimpleTableRow>
            <SimpleTableHead className="w-12">
              <Checkbox
                checked={allChecked}
                onCheckedChange={(value) => onToggleAll(value === true)}
                aria-label="Sélectionner tous les articles"
              />
            </SimpleTableHead>
            <SimpleTableHead>Article</SimpleTableHead>
            <SimpleTableHead>Catégorie</SimpleTableHead>
            <SimpleTableHead>Emplacement</SimpleTableHead>
            <SimpleTableHead>Stock actuel</SimpleTableHead>
            <SimpleTableHead>Seuil min.</SimpleTableHead>
            <SimpleTableHead>Valeur</SimpleTableHead>
            <SimpleTableHead>Statut</SimpleTableHead>
            <SimpleTableHead>Dernier mouvement</SimpleTableHead>
            <SimpleTableHead />
          </SimpleTableRow>
        </SimpleTableHeader>
        <SimpleTableBody>
          {items.map((item) => (
            <SimpleTableRow
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={cn(
                'cursor-pointer',
                selectedId === item.id &&
                  'bg-surface-selected hover:bg-surface-selected',
              )}
            >
              <SimpleTableCell>
                <Checkbox
                  checked={checkedIds.includes(item.id)}
                  onCheckedChange={(value) => onToggle(item.id, value === true)}
                  onClick={(event) => event.stopPropagation()}
                  aria-label={`Sélectionner ${item.name}`}
                />
              </SimpleTableCell>
              <SimpleTableCell>
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface-muted text-xl">
                    {item.emoji}
                  </span>
                  <div>
                    <p className="whitespace-nowrap font-bold">{item.name}</p>
                    <p className="text-xs text-muted">
                      {item.id} · {item.unit}
                    </p>
                  </div>
                </div>
              </SimpleTableCell>
              <SimpleTableCell className="whitespace-nowrap">
                {item.category}
              </SimpleTableCell>
              <SimpleTableCell className="whitespace-nowrap">
                {item.location}
              </SimpleTableCell>
              <SimpleTableCell
                className={cn(
                  'whitespace-nowrap font-semibold tabular-nums',
                  item.status === 'Rupture'
                    ? 'text-status-danger'
                    : item.status === 'Stock faible'
                      ? 'text-status-warning'
                      : '',
                )}
              >
                {formatInventoryStock(item.stock, item.unit)}
              </SimpleTableCell>
              <SimpleTableCell className="whitespace-nowrap tabular-nums">
                {formatInventoryStock(item.minimum, item.unit)}
              </SimpleTableCell>
              <SimpleTableCell className="whitespace-nowrap font-medium tabular-nums">
                {formatInventoryCurrency(item.value)}
              </SimpleTableCell>
              <SimpleTableCell>
                <Badge
                  tone={inventoryStatusTones[item.status]}
                  className="whitespace-nowrap rounded-md"
                >
                  {item.status}
                </Badge>
              </SimpleTableCell>
              <SimpleTableCell>
                <p className="whitespace-nowrap text-sm">{item.movementDay}</p>
                <p className="text-xs text-muted">{item.movementTime}</p>
              </SimpleTableCell>
              <SimpleTableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <IconButton
                      size="sm"
                      disabled
                      aria-label={`Actions pour ${item.name}`}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </IconButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Ajuster le stock</DropdownMenuItem>
                    <DropdownMenuItem>Voir les mouvements</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem destructive>
                      Archiver l&apos;article
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SimpleTableCell>
            </SimpleTableRow>
          ))}
        </SimpleTableBody>
      </SimpleTable>
      {items.length === 0 && <InventoryEmptyState />}
      <InventoryPagination visibleCount={items.length} />
    </>
  );
}

function InventoryEmptyState() {
  return (
    <div className="p-16 text-center">
      <Boxes className="mx-auto h-8 w-8 text-muted" />
      <p className="mt-3 font-semibold">Aucun article trouvé</p>
      <p className="mt-1 text-sm text-muted">
        Modifiez les filtres ou choisissez Stock actuel.
      </p>
    </div>
  );
}

function InventoryPagination({ visibleCount }: { visibleCount: number }) {
  return (
    <footer className="flex flex-col gap-3 border-t border-border-default px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm">
        <strong>1 à {visibleCount}</strong> sur 248 références
      </p>
      <div className="flex items-center gap-2">
        <IconButton
          variant="secondary"
          size="sm"
          aria-label="Première page"
          disabled
        >
          <ChevronsLeft className="h-4 w-4" />
        </IconButton>
        <IconButton
          variant="secondary"
          size="sm"
          aria-label="Page précédente"
          disabled
        >
          <ChevronLeft className="h-4 w-4" />
        </IconButton>
        {[1, 2, 3, 4, 5].map((page) => (
          <Button
            key={page}
            size="sm"
            variant={page === 1 ? 'primary' : 'secondary'}
            className="w-9 px-0"
          >
            {page}
          </Button>
        ))}
        <IconButton variant="secondary" size="sm" aria-label="Page suivante">
          <ChevronRight className="h-4 w-4" />
        </IconButton>
        <IconButton variant="secondary" size="sm" aria-label="Dernière page">
          <ChevronsRight className="h-4 w-4" />
        </IconButton>
      </div>
      <Select defaultValue="25">
        <SelectTrigger className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="25">25 / page</SelectItem>
          <SelectItem value="50">50 / page</SelectItem>
        </SelectContent>
      </Select>
    </footer>
  );
}
