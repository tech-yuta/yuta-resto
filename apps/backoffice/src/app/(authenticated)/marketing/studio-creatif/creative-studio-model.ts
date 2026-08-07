export const creativeStudioTabs = [
  'Accueil',
  'Modèles',
  'Mes créations',
  'Planification',
  'Bibliothèque',
] as const;
export type CreativeStudioTab = (typeof creativeStudioTabs)[number];

export const creativeStudioFilters = [
  'Tous',
  'Promotion',
  'Nouveau plat',
  'Événement',
  'Happy hour',
  'Livraison',
  'Saisonnier',
] as const;

export type CreativeTemplate = {
  image: string;
  eyebrow: string;
  title: string;
  detail: string;
  dark: boolean;
};
export type RecentCreation = {
  image: string;
  status: string;
  title: string;
  format: string;
  meta: string;
};

export function getCreationStatusTone(
  status: string,
): 'success' | 'info' | 'neutral' {
  if (status === 'Planifiée') return 'success';
  if (status === 'Publié') return 'info';
  return 'neutral';
}
