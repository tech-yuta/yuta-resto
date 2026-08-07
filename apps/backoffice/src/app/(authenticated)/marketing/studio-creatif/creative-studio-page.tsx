'use client';

import { useState } from 'react';
import { PrototypeBackofficeNotice } from '../../../../components/prototype-backoffice-notice';
import { CreativeGeneratorPanel } from './creative-generator-panel';
import { CreativeInspirationCard } from './creative-inspiration-card';
import { CreativeStudioContent } from './creative-studio-content';
import { CreativeStudioHeader } from './creative-studio-header';
import type { CreativeStudioTab } from './creative-studio-model';

const initialPrompt =
  'Annonce pour notre Happy Hour :\n-20% sur tous les cocktails de 17h à 19h,\ndu lundi au jeudi.\nAmbiance chaleureuse et moderne.\nInclure notre logo.';

export function CreativeStudioPage() {
  const [activeTab, setActiveTab] = useState<CreativeStudioTab>('Accueil');
  const [activeFilter, setActiveFilter] = useState('Tous');
  const [format, setFormat] = useState('Portrait');
  const [visualType, setVisualType] = useState('promotion');
  const [prompt, setPrompt] = useState(initialPrompt);

  return (
    <div className="space-y-5">
      <CreativeStudioHeader />
      <PrototypeBackofficeNotice />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <CreativeStudioContent
          activeTab={activeTab}
          activeFilter={activeFilter}
          onTabChange={setActiveTab}
          onFilterChange={setActiveFilter}
        />
        <div className="space-y-4 xl:sticky xl:top-4">
          <CreativeGeneratorPanel
            prompt={prompt}
            setPrompt={setPrompt}
            format={format}
            setFormat={setFormat}
            visualType={visualType}
            setVisualType={setVisualType}
          />
          <CreativeInspirationCard />
        </div>
      </div>
    </div>
  );
}
