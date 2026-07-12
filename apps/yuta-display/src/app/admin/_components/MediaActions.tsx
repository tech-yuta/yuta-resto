'use client';

import { useState } from 'react';
import { Button, Input, Checkbox, Label } from '@yuta/ui';
import type { DisplayMedia } from '../../../types/display-media';
import { uiText } from '../../../constants/ui-text';

type MediaActionsProps = {
  item: DisplayMedia;
  onRefresh: () => Promise<void>;
};

type EditValues = {
  title: string;
  duration: number;
  sortOrder: number;
  isActive: boolean;
};

export function MediaActions({ item, onRefresh }: MediaActionsProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<EditValues>({
    title: item.title ?? '',
    duration: item.duration,
    sortOrder: item.sortOrder,
    isActive: item.isActive,
  });

  const handleDelete = async () => {
    if (!window.confirm(uiText.confirmDelete)) return;
    await fetch(`/api/display-media/${item.id}`, { method: 'DELETE' });
    await onRefresh();
  };

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/display-media/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: values.title || null,
        duration: values.duration,
        sortOrder: values.sortOrder,
        isActive: values.isActive,
      }),
    });
    setSaving(false);
    setEditing(false);
    await onRefresh();
  };

  if (editing) {
    return (
      <div className="min-w-50 space-y-2 py-1">
        {/* Title */}
        <Input
          type="text"
          value={values.title}
          onChange={e => setValues(v => ({ ...v, title: e.target.value }))}
          placeholder={uiText.title}
        />

        {/* Duration — images only */}
        {item.type === 'image' && (
          <Input
            type="number"
            value={values.duration}
            onChange={e => setValues(v => ({ ...v, duration: Number(e.target.value) }))}
            min={1}
            placeholder={uiText.duration}
          />
        )}

        {/* Sort order */}
        <Input
          type="number"
          value={values.sortOrder}
          onChange={e => setValues(v => ({ ...v, sortOrder: Number(e.target.value) }))}
          min={0}
          placeholder={uiText.sortOrder}
        />

        {/* Active toggle */}
        <label className="flex items-center gap-2 text-sm text-primary">
          <Checkbox
            checked={values.isActive}
            onCheckedChange={(checked) => setValues(v => ({ ...v, isActive: !!checked }))}
          />
          <Label>{uiText.active}</Label>
        </label>

        {/* Confirm / cancel */}
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? uiText.loading : uiText.save}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>
            {uiText.cancel}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
        {uiText.edit}
      </Button>
      <Button size="sm" variant="danger" onClick={handleDelete}>
        {uiText.delete}
      </Button>
    </div>
  );
}
