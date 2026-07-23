'use client';

import type {
  AllergySeverity,
  ItemInstructionConfig,
  ItemVariantSelection,
  SelectedItemInstruction,
} from '@yuta/core';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@yuta/ui';
import {
  ChevronDown,
  MessageSquarePlus,
  Minus,
  Plus,
  TriangleAlert,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { updateOrderItemInstructionsAction } from '../../../actions';

const allergyOptions = [
  { code: 'PEANUTS', label: 'Cacahuètes' },
  { code: 'GLUTEN', label: 'Gluten' },
  { code: 'SOY', label: 'Soja' },
  { code: 'CRUSTACEANS', label: 'Crustacés' },
  { code: 'EGGS', label: 'Œufs' },
  { code: 'MILK', label: 'Lait' },
  { code: 'SESAME', label: 'Sésame' },
  { code: 'FISH', label: 'Poisson' },
  { code: 'OTHER', label: 'Autre' },
] as const;

const allergySeverityOptions: Array<{
  value: AllergySeverity;
  label: string;
}> = [
  { value: 'intolerance', label: 'Intolérance' },
  { value: 'allergy', label: 'Allergie' },
  {
    value: 'severe_no_traces',
    label: 'Allergie sévère – traces interdites',
  },
];

type OrderItemNoteDialogProps = {
  orderId: string;
  orderItemId: string;
  itemName: string;
  quantity: number;
  instructionConfig: ItemInstructionConfig;
  initialNote: string | null;
  initialQuickInstructions: SelectedItemInstruction[];
  initialVariants: ItemVariantSelection[];
  initialHasAllergy: boolean;
  initialAllergenCodes: string[];
  initialAllergySeverity: AllergySeverity | null;
  initialAllergyNote: string | null;
  disabled?: boolean;
};

export function OrderItemNoteDialog({
  orderId,
  orderItemId,
  itemName,
  quantity,
  instructionConfig,
  initialNote,
  initialQuickInstructions,
  initialVariants,
  initialHasAllergy,
  initialAllergenCodes,
  initialAllergySeverity,
  initialAllergyNote,
  disabled = false,
}: OrderItemNoteDialogProps) {
  const [note, setNote] = useState(initialNote ?? '');
  const [selectedCodes, setSelectedCodes] = useState(
    initialQuickInstructions.map((instruction) => instruction.code),
  );
  const [variantQuantities, setVariantQuantities] = useState(
    Object.fromEntries(
      initialVariants.map((variant) => [variant.code, variant.quantity]),
    ),
  );
  const [hasAllergy, setHasAllergy] = useState(initialHasAllergy);
  const [allergenCodes, setAllergenCodes] = useState(initialAllergenCodes);
  const [allergySeverity, setAllergySeverity] = useState<AllergySeverity | ''>(
    initialAllergySeverity ?? '',
  );
  const [allergyNote, setAllergyNote] = useState(initialAllergyNote ?? '');
  const [showAdditional, setShowAdditional] = useState(false);
  const [open, setOpen] = useState(false);

  const allOptions = useMemo(
    () => [
      ...instructionConfig.defaultOptions,
      ...instructionConfig.additionalOptions,
    ],
    [instructionConfig],
  );
  const selectedVariants = instructionConfig.variantOptions
    .map((variant) => ({
      code: variant.code,
      quantity: variantQuantities[variant.code] ?? 0,
    }))
    .filter((variant) => variant.quantity > 0);
  const requiredVariantCount = quantity * 2;
  const selectedVariantCount = selectedVariants.reduce(
    (total, variant) => total + variant.quantity,
    0,
  );
  const allergyValid =
    !hasAllergy ||
    (allergenCodes.length > 0 &&
      Boolean(allergySeverity) &&
      (!allergenCodes.includes('OTHER') || Boolean(allergyNote.trim())));
  const variantsValid =
    instructionConfig.variantOptions.length === 0 ||
    selectedVariantCount === requiredVariantCount;

  function resetState() {
    setNote(initialNote ?? '');
    setSelectedCodes(
      initialQuickInstructions.map((instruction) => instruction.code),
    );
    setVariantQuantities(
      Object.fromEntries(
        initialVariants.map((variant) => [variant.code, variant.quantity]),
      ),
    );
    setHasAllergy(initialHasAllergy);
    setAllergenCodes(initialAllergenCodes);
    setAllergySeverity(initialAllergySeverity ?? '');
    setAllergyNote(initialAllergyNote ?? '');
    setShowAdditional(false);
  }

  function toggleInstruction(code: string) {
    setSelectedCodes((current) => {
      if (current.includes(code)) {
        return current.filter((selected) => selected !== code);
      }
      const option = allOptions.find((candidate) => candidate.code === code);
      const conflicts = new Set(option?.conflictsWith ?? []);
      return [...current.filter((selected) => !conflicts.has(selected)), code];
    });
  }

  function toggleAllergen(code: string) {
    setAllergenCodes((current) =>
      current.includes(code)
        ? current.filter((selected) => selected !== code)
        : [...current, code],
    );
  }

  async function saveNote(formData: FormData) {
    await updateOrderItemInstructionsAction(formData);
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) resetState();
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" disabled={disabled}>
          <MessageSquarePlus className="h-3.5 w-3.5" />
          {initialNote ||
          initialHasAllergy ||
          initialQuickInstructions.length > 0 ||
          initialVariants.length > 0
            ? 'Modifier les instructions'
            : 'Notes / allergie'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Instruction pour {itemName}</DialogTitle>
          <DialogDescription>
            Les choix apparaissent sous cet article en cuisine et sur le ticket.
          </DialogDescription>
        </DialogHeader>

        <form action={saveNote} className="mt-4 grid gap-5">
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="orderItemId" value={orderItemId} />
          <input
            type="hidden"
            name="hasAllergy"
            value={hasAllergy ? 'true' : 'false'}
          />
          <input
            type="hidden"
            name="selectedInstructionCodes"
            value={JSON.stringify(selectedCodes)}
          />
          <input
            type="hidden"
            name="selectedVariants"
            value={JSON.stringify(selectedVariants)}
          />
          <input
            type="hidden"
            name="allergenCodes"
            value={JSON.stringify(allergenCodes)}
          />
          <input type="hidden" name="allergySeverity" value={allergySeverity} />

          {(instructionConfig.defaultOptions.length > 0 ||
            instructionConfig.additionalOptions.length > 0) && (
            <section className="grid gap-3">
              <Label>Suggestions rapides</Label>
              <div className="flex flex-wrap gap-2">
                {instructionConfig.defaultOptions.map((option) => (
                  <Button
                    key={option.code}
                    type="button"
                    variant={
                      selectedCodes.includes(option.code)
                        ? 'primary'
                        : 'outline'
                    }
                    size="sm"
                    onClick={() => toggleInstruction(option.code)}
                  >
                    {option.label}
                  </Button>
                ))}
                {instructionConfig.additionalOptions.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdditional((value) => !value)}
                  >
                    Autres <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              {showAdditional && (
                <div className="flex flex-wrap gap-2 rounded-lg bg-surface-muted p-3">
                  {instructionConfig.additionalOptions.map((option) => (
                    <Button
                      key={option.code}
                      type="button"
                      variant={
                        selectedCodes.includes(option.code)
                          ? 'primary'
                          : 'outline'
                      }
                      size="sm"
                      onClick={() => toggleInstruction(option.code)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              )}
            </section>
          )}

          {instructionConfig.variantOptions.length > 0 && (
            <section className="grid gap-3 rounded-lg border border-border-default p-4">
              <div>
                <Label>Parfums Mochi</Label>
                <p className="mt-1 text-sm font-semibold text-secondary">
                  Choisissez {requiredVariantCount} pièce(s) au total —{' '}
                  {selectedVariantCount}/{requiredVariantCount} sélectionnée(s).
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {instructionConfig.variantOptions.map((variant) => {
                  const variantQuantity = variantQuantities[variant.code] ?? 0;
                  return (
                    <div
                      key={variant.code}
                      className="flex items-center justify-between rounded-lg bg-surface-muted p-2"
                    >
                      <span className="text-sm font-black">
                        {variant.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          aria-label={`Retirer ${variant.label}`}
                          disabled={variantQuantity === 0}
                          onClick={() =>
                            setVariantQuantities((current) => ({
                              ...current,
                              [variant.code]: Math.max(0, variantQuantity - 1),
                            }))
                          }
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="min-w-4 text-center font-black">
                          {variantQuantity}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          aria-label={`Ajouter ${variant.label}`}
                          disabled={
                            selectedVariantCount >= requiredVariantCount
                          }
                          onClick={() =>
                            setVariantQuantities((current) => ({
                              ...current,
                              [variant.code]: variantQuantity + 1,
                            }))
                          }
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <div className="grid gap-2">
            <Label htmlFor={`note-${orderItemId}`}>Note libre</Label>
            <Textarea
              id={`note-${orderItemId}`}
              name="note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ex: Couper en deux"
              className="min-h-24"
              maxLength={300}
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border-default bg-surface p-4">
            <Checkbox
              checked={hasAllergy}
              onCheckedChange={(checked) => setHasAllergy(checked === true)}
              aria-label="Allergie pour cet article"
              className="mt-0.5"
            />
            <span className="grid gap-1">
              <span className="font-black">Allergie pour cet article</span>
              <span className="text-sm font-semibold text-secondary">
                Une préférence « sans » ne signifie pas automatiquement une
                allergie.
              </span>
            </span>
          </label>

          {hasAllergy && (
            <section className="grid gap-4">
              <Alert tone="danger">
                <TriangleAlert className="h-4 w-4" />
                <AlertTitle>Information de sécurité</AlertTitle>
                <AlertDescription>
                  La cuisine devra confirmer cette alerte avant de terminer le
                  plat.
                </AlertDescription>
              </Alert>

              <div className="grid gap-2">
                <Label>Allergènes</Label>
                <div className="flex flex-wrap gap-2">
                  {allergyOptions.map((option) => (
                    <Button
                      key={option.code}
                      type="button"
                      variant={
                        allergenCodes.includes(option.code)
                          ? 'danger'
                          : 'outline'
                      }
                      size="sm"
                      onClick={() => toggleAllergen(option.code)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor={`severity-${orderItemId}`}>Gravité</Label>
                <Select
                  value={allergySeverity}
                  onValueChange={(value) =>
                    setAllergySeverity(value as AllergySeverity)
                  }
                >
                  <SelectTrigger id={`severity-${orderItemId}`}>
                    <SelectValue placeholder="Choisir la gravité" />
                  </SelectTrigger>
                  <SelectContent>
                    {allergySeverityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor={`allergy-${orderItemId}`}>
                  Détail de l'allergie
                </Label>
                <Textarea
                  id={`allergy-${orderItemId}`}
                  name="allergyNote"
                  value={allergyNote}
                  onChange={(event) => setAllergyNote(event.target.value)}
                  placeholder="Ex: Traces interdites"
                  required={allergenCodes.includes('OTHER')}
                  className="min-h-20"
                  maxLength={300}
                />
              </div>
            </section>
          )}

          <DialogFooter>
            <Button
              type="submit"
              variant="primary"
              disabled={!allergyValid || !variantsValid}
            >
              Enregistrer les instructions
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
