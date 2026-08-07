'use client';

import {
  Badge,
  Button,
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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreVertical,
  Truck,
} from 'lucide-react';
import { SupplierLogo } from './supplier-logo';
import type { Supplier } from './suppliers-model';

export function SuppliersTable({
  suppliers,
  selectedId,
  onSelect,
}: {
  suppliers: readonly Supplier[];
  selectedId: string;
  onSelect(id: string): void;
}) {
  return (
    <>
      <SimpleTable className="min-w-[820px]">
        <SimpleTableHeader className="bg-surface">
          <SimpleTableRow>
            <SimpleTableHead>Fournisseur</SimpleTableHead>
            <SimpleTableHead>Catégorie</SimpleTableHead>
            <SimpleTableHead>Contact</SimpleTableHead>
            <SimpleTableHead>Conditions</SimpleTableHead>
            <SimpleTableHead>Dernière commande</SimpleTableHead>
            <SimpleTableHead>Statut</SimpleTableHead>
            <SimpleTableHead>Actions</SimpleTableHead>
          </SimpleTableRow>
        </SimpleTableHeader>
        <SimpleTableBody>
          {suppliers.map((supplier) => (
            <SimpleTableRow
              key={supplier.id}
              onClick={() => onSelect(supplier.id)}
              className={cn(
                'cursor-pointer',
                supplier.id === selectedId &&
                  'bg-surface-selected hover:bg-surface-selected',
              )}
            >
              <SimpleTableCell>
                <div className="flex items-center gap-3">
                  <SupplierLogo supplier={supplier} size="sm" />
                  <div>
                    <p className="whitespace-nowrap font-bold">
                      {supplier.name}
                    </p>
                    <p className="text-xs text-muted">{supplier.id}</p>
                  </div>
                </div>
              </SimpleTableCell>
              <SimpleTableCell className="max-w-44 text-xs leading-5">
                {supplier.categories}
              </SimpleTableCell>
              <SimpleTableCell>
                <p className="whitespace-nowrap text-sm">{supplier.phone}</p>
                <p className="whitespace-nowrap text-xs text-muted">
                  {supplier.email}
                </p>
              </SimpleTableCell>
              <SimpleTableCell>
                <p className="whitespace-nowrap text-xs">
                  Paiement : {supplier.payment}
                </p>
                <p className="whitespace-nowrap text-xs">
                  Livraison : {supplier.delivery}
                </p>
              </SimpleTableCell>
              <SimpleTableCell>
                <p className="whitespace-nowrap text-sm">
                  {supplier.lastOrderDate}
                </p>
                <p className="text-xs font-medium">
                  {supplier.lastOrderAmount}
                </p>
              </SimpleTableCell>
              <SimpleTableCell>
                <Badge
                  tone={supplier.status === 'Actif' ? 'success' : 'neutral'}
                  className="rounded-md"
                >
                  {supplier.status}
                </Badge>
              </SimpleTableCell>
              <SimpleTableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <IconButton
                      size="sm"
                      disabled
                      aria-label={`Actions pour ${supplier.name}`}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </IconButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Voir les détails</DropdownMenuItem>
                    <DropdownMenuItem>Nouvelle commande</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem destructive>Désactiver</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SimpleTableCell>
            </SimpleTableRow>
          ))}
        </SimpleTableBody>
      </SimpleTable>
      {suppliers.length === 0 && (
        <div className="p-16 text-center">
          <Truck className="mx-auto h-8 w-8 text-muted" />
          <p className="mt-3 font-semibold">Aucun fournisseur trouvé</p>
          <p className="mt-1 text-sm text-muted">
            Modifiez votre recherche ou vos filtres.
          </p>
        </div>
      )}
      <SuppliersPagination visibleCount={suppliers.length} />
    </>
  );
}

function SuppliersPagination({ visibleCount }: { visibleCount: number }) {
  return (
    <footer className="flex flex-col gap-3 border-t border-border-default px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm">
        <strong>1 à {visibleCount}</strong> sur 28 fournisseurs
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
        <Button size="sm" className="w-9 px-0">
          1
        </Button>
        <Button variant="secondary" size="sm" className="w-9 px-0">
          2
        </Button>
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
