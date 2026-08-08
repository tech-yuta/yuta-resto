'use client';

import {
  Avatar,
  Badge,
  Checkbox,
  IconButton,
  SimpleTable,
  SimpleTableBody,
  SimpleTableCell,
  SimpleTableHead,
  SimpleTableHeader,
  SimpleTableRow,
  cn,
} from '@yuta/ui';
import { ArrowLeftRight, MoreVertical } from 'lucide-react';
import { StockPrototypeTableFooter } from '../stock-prototype-table-footer';
import { movementTypePresentation } from './stock-movement-presentation';
import {
  formatStockCurrency,
  formatStockQuantity,
  type StockMovement,
} from './stock-movements-model';

export function StockMovementsTable({
  movements,
  selectedId,
  checkedIds,
  allChecked,
  onSelect,
  onToggle,
  onToggleAll,
}: {
  movements: readonly StockMovement[];
  selectedId: string | null;
  checkedIds: readonly string[];
  allChecked: boolean;
  onSelect(id: string): void;
  onToggle(id: string, checked: boolean): void;
  onToggleAll(checked: boolean): void;
}) {
  return (
    <>
      <SimpleTable className="min-w-[1060px]">
        <SimpleTableHeader className="bg-surface">
          <SimpleTableRow>
            <SimpleTableHead className="w-12">
              <Checkbox
                checked={allChecked}
                onCheckedChange={(value) => onToggleAll(value === true)}
                aria-label="Sélectionner tous les mouvements"
              />
            </SimpleTableHead>
            <SimpleTableHead>Date / Heure</SimpleTableHead>
            <SimpleTableHead>Type</SimpleTableHead>
            <SimpleTableHead>Article</SimpleTableHead>
            <SimpleTableHead>Quantité</SimpleTableHead>
            <SimpleTableHead>Unité</SimpleTableHead>
            <SimpleTableHead>Zone</SimpleTableHead>
            <SimpleTableHead>Référence</SimpleTableHead>
            <SimpleTableHead>Utilisateur</SimpleTableHead>
            <SimpleTableHead>Valeur</SimpleTableHead>
            <SimpleTableHead />
          </SimpleTableRow>
        </SimpleTableHeader>
        <SimpleTableBody>
          {movements.map((movement) => {
            const config = movementTypePresentation[movement.type];
            const TypeIcon = config.icon;
            return (
              <SimpleTableRow
                key={movement.id}
                onClick={() => onSelect(movement.id)}
                className={cn(
                  'cursor-pointer',
                  movement.id === selectedId &&
                    'bg-surface-selected hover:bg-surface-selected',
                )}
              >
                <SimpleTableCell>
                  <Checkbox
                    checked={checkedIds.includes(movement.id)}
                    onCheckedChange={(value) =>
                      onToggle(movement.id, value === true)
                    }
                    onClick={(event) => event.stopPropagation()}
                    aria-label={`Sélectionner ${movement.reference}`}
                  />
                </SimpleTableCell>
                <SimpleTableCell>
                  <p className="font-medium tabular-nums">{movement.date}</p>
                  <p className="text-xs text-muted">{movement.time}</p>
                </SimpleTableCell>
                <SimpleTableCell>
                  <Badge
                    tone={config.tone}
                    className="whitespace-nowrap rounded-md"
                  >
                    <TypeIcon className="h-3.5 w-3.5" />
                    {movement.type}
                  </Badge>
                </SimpleTableCell>
                <SimpleTableCell>
                  <p className="whitespace-nowrap font-semibold">
                    {movement.item}
                  </p>
                  <p className="text-xs text-muted">{movement.itemId}</p>
                </SimpleTableCell>
                <SimpleTableCell
                  className={cn(
                    'whitespace-nowrap font-bold tabular-nums',
                    movement.quantity > 0
                      ? 'text-status-success'
                      : 'text-status-danger',
                  )}
                >
                  {formatStockQuantity(movement.quantity)}
                </SimpleTableCell>
                <SimpleTableCell>{movement.unit}</SimpleTableCell>
                <SimpleTableCell>
                  <p className="whitespace-nowrap">{movement.zone}</p>
                  {movement.destination && (
                    <p className="text-xs text-muted">
                      → {movement.destination}
                    </p>
                  )}
                </SimpleTableCell>
                <SimpleTableCell>
                  <p className="whitespace-nowrap font-medium">
                    {movement.reference}
                  </p>
                  <p className="text-xs text-muted">
                    {movement.referenceDetail}
                  </p>
                </SimpleTableCell>
                <SimpleTableCell>
                  <div className="flex items-center gap-2">
                    <Avatar
                      fallback={movement.userInitials}
                      size="sm"
                      className="bg-surface-muted"
                    />
                    <span className="whitespace-nowrap">{movement.user}</span>
                  </div>
                </SimpleTableCell>
                <SimpleTableCell className="whitespace-nowrap font-medium tabular-nums">
                  {formatStockCurrency(movement.value)}
                </SimpleTableCell>
                <SimpleTableCell>
                  <IconButton
                    size="sm"
                    disabled
                    aria-label={`Actions indisponibles pour ${movement.reference}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </IconButton>
                </SimpleTableCell>
              </SimpleTableRow>
            );
          })}
        </SimpleTableBody>
      </SimpleTable>
      {movements.length === 0 && <StockMovementsEmptyState />}
      <StockPrototypeTableFooter
        visibleCount={movements.length}
        itemLabel="mouvement"
      />
    </>
  );
}

function StockMovementsEmptyState() {
  return (
    <div className="p-16 text-center">
      <ArrowLeftRight className="mx-auto h-8 w-8 text-muted" />
      <p className="mt-3 font-semibold">Aucun mouvement trouvé</p>
      <p className="mt-1 text-sm text-muted">
        Modifiez votre recherche ou vos filtres.
      </p>
    </div>
  );
}
