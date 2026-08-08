'use client';

import {
  Badge,
  Button,
  Card,
  IconButton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  cn,
} from '@yuta/ui';
import { Pencil, Plus, Shuffle, Sparkles, WandSparkles } from 'lucide-react';
import Image from 'next/image';

export function CreativeGeneratorPanel({
  prompt,
  setPrompt,
  format,
  setFormat,
  visualType,
  setVisualType,
}: {
  prompt: string;
  setPrompt(value: string): void;
  format: string;
  setFormat(value: string): void;
  visualType: string;
  setVisualType(value: string): void;
}) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="border-b border-border-default p-4">
        <h2 className="flex items-center gap-2 font-black text-brand-800">
          <Sparkles className="h-5 w-5" /> Générer un visuel avec l&apos;IA
        </h2>
      </div>
      <div className="space-y-5 p-4">
        <div>
          <label
            className="mb-2 block text-sm font-bold"
            htmlFor="visual-prompt"
          >
            1. Décrivez votre visuel
          </label>
          <Textarea
            id="visual-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={7}
            maxLength={800}
          />
          <p className="mt-1 text-right text-[11px] text-muted">
            {prompt.length} / 800
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-2"
            onClick={() =>
              setPrompt(
                'Annoncez notre menu du jour avec une ambiance fraîche, moderne et gourmande. Inclure notre logo.',
              )
            }
          >
            <Shuffle className="h-4 w-4" /> Idée aléatoire
          </Button>
        </div>
        <div>
          <p className="mb-2 text-sm font-bold">2. Style de votre restaurant</p>
          <div className="rounded-lg border border-border-default p-3">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-lg">
                <Image
                  src="/creative-studio/bao-poster.png"
                  alt="Style Luna"
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">
                  LUNA Street Food Viet
                </p>
                <div
                  className="mt-2 flex gap-2"
                  aria-label="Palette de couleurs"
                >
                  {[
                    'bg-neutral-950',
                    'bg-brand-200',
                    'bg-status-danger',
                    'bg-status-warning',
                    'bg-neutral-100',
                  ].map((color) => (
                    <span
                      key={color}
                      className={cn('h-4 w-4 rounded-full', color)}
                    />
                  ))}
                </div>
              </div>
            </div>
            <button
              type="button"
              disabled
              className="mt-3 flex items-center gap-1 text-sm font-semibold text-brand-800"
            >
              <Pencil className="h-4 w-4" /> Modifier le style
            </button>
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-bold">3. Format</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 2xl:grid-cols-2">
            {[
              ['Carré', '1080 × 1080'],
              ['Portrait', '1080 × 1350'],
              ['Story', '1080 × 1920'],
              ['Paysage', '1200 × 628'],
            ].map(([name, size]) => (
              <button
                key={name}
                type="button"
                onClick={() => setFormat(name!)}
                className={cn(
                  'rounded-lg border p-3 text-center',
                  format === name
                    ? 'border-brand-500 bg-surface-selected text-brand-800'
                    : 'border-border-default bg-surface',
                )}
              >
                <span className="block text-sm font-bold">{name}</span>
                <span className="mt-1 block text-[10px] text-muted">
                  {size}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-bold">
            4. Type de visuel
          </label>
          <Select value={visualType} onValueChange={setVisualType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="promotion">Promotion / Offre</SelectItem>
              <SelectItem value="menu">Menu du jour</SelectItem>
              <SelectItem value="event">Événement</SelectItem>
              <SelectItem value="social">Publication sociale</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="mb-2 text-sm font-bold">
            5. Éléments à inclure{' '}
            <span className="font-normal text-muted">(optionnel)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge tone="neutral">Logo du restaurant</Badge>
            <Badge tone="neutral">Photo de cocktail</Badge>
            <IconButton
              aria-label="Ajouter un élément"
              variant="secondary"
              disabled
              size="sm"
            >
              <Plus className="h-4 w-4" />
            </IconButton>
          </div>
        </div>
        <Button fullWidth size="lg" disabled>
          <WandSparkles className="h-5 w-5" /> Générer mes visuels
        </Button>
        <p className="-mt-3 text-xs text-muted">
          La génération reste indisponible dans ce prototype.
        </p>
      </div>
    </Card>
  );
}
