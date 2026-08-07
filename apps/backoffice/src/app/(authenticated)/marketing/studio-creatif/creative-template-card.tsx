import { cn } from '@yuta/ui';
import Image from 'next/image';
import type { CreativeTemplate } from './creative-studio-model';

export function CreativeTemplateCard({
  template,
}: {
  template: CreativeTemplate;
}) {
  return (
    <button
      type="button"
      disabled
      className="group relative aspect-[4/5] overflow-hidden rounded-lg border border-border-default text-left shadow-sm"
    >
      <Image
        src={template.image}
        alt=""
        fill
        sizes="(max-width: 768px) 50vw, 220px"
        className="object-cover transition duration-300 group-hover:scale-105"
      />
      <span
        className={cn(
          'absolute inset-0',
          template.dark ? 'bg-neutral-950/35' : 'bg-white/10',
        )}
      />
      <span
        className={cn(
          'absolute inset-x-0 top-0 block p-4',
          template.dark ? 'text-inverse' : 'text-primary',
        )}
      >
        <span className="block text-xs font-bold tracking-widest">
          {template.eyebrow}
        </span>
        <span className="mt-1 block text-2xl font-black leading-none md:text-3xl">
          {template.title}
        </span>
        <span className="mt-3 block text-[10px] font-bold uppercase tracking-wide">
          {template.detail}
        </span>
      </span>
      <span
        className={cn(
          'absolute bottom-3 left-4 text-[10px] font-black tracking-widest',
          template.dark ? 'text-inverse' : 'text-primary',
        )}
      >
        LUNA
      </span>
    </button>
  );
}
