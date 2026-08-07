import {
  Files,
  Megaphone,
  MessageCircleMore,
  Smartphone,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import type { CreativeTemplate, RecentCreation } from './creative-studio-model';

export const creativeFormatCards: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
  tone: string;
}> = [
  {
    title: 'Affiche / Promotion',
    description: 'Promotions, offres spéciales, événements',
    icon: Megaphone,
    tone: 'bg-surface-selected text-brand-800',
  },
  {
    title: 'Réseaux sociaux',
    description: 'Facebook, Instagram, LinkedIn, TikTok',
    icon: MessageCircleMore,
    tone: 'bg-status-danger-soft text-status-danger',
  },
  {
    title: 'Menu du jour',
    description: 'Menu, ardoise, suggestions du chef',
    icon: UtensilsCrossed,
    tone: 'bg-status-warning-soft text-status-warning',
  },
  {
    title: 'Story / Reel',
    description: 'Stories Instagram, Reels, TikTok',
    icon: Smartphone,
    tone: 'bg-status-success-soft text-status-success',
  },
  {
    title: 'Autre format',
    description: 'Flyer, bannière, carte, etc.',
    icon: Files,
    tone: 'bg-status-info-soft text-status-info',
  },
];

export const popularCreativeTemplates: CreativeTemplate[] = [
  {
    image: '/creative-studio/bao-poster.png',
    eyebrow: 'HAPPY HOUR',
    title: '-20%',
    detail: '17H – 19H',
    dark: true,
  },
  {
    image: '/creative-studio/pho-poster.png',
    eyebrow: 'NOUVEAU',
    title: 'PHỞ BÒ',
    detail: 'Découvrez notre recette',
    dark: true,
  },
  {
    image: '/creative-studio/menu-poster.png',
    eyebrow: 'MENU',
    title: 'DU JOUR',
    detail: 'MARDI · 16,90 €',
    dark: false,
  },
  {
    image: '/creative-studio/rolls-poster.png',
    eyebrow: 'SUMMER',
    title: 'ROLLS',
    detail: 'Frais, légers & maison',
    dark: false,
  },
  {
    image: '/creative-studio/pho-poster.png',
    eyebrow: 'SOIRÉE',
    title: 'STREET FOOD',
    detail: 'Vendredi · à partir de 19h',
    dark: true,
  },
];

export const recentCreativeCreations: RecentCreation[] = [
  {
    image: '/creative-studio/bao-poster.png',
    status: 'Planifiée',
    title: 'Offre étudiants – Mai',
    format: '1080 × 1350 · Instagram post',
    meta: 'Planifiée le 16/05 à 12:00',
  },
  {
    image: '/creative-studio/pho-poster.png',
    status: 'Brouillon',
    title: 'Nouveau Banh Mi',
    format: '1080 × 1080 · Instagram post',
    meta: 'Modifié il y a 2 heures',
  },
  {
    image: '/creative-studio/bao-poster.png',
    status: 'Planifiée',
    title: 'Happy Hour Cocktails',
    format: '1080 × 1920 · Story',
    meta: 'Planifiée le 18/05 à 18:00',
  },
  {
    image: '/creative-studio/rolls-poster.png',
    status: 'Publié',
    title: 'Menu du jour – 12/05',
    format: '1080 × 1080 · Instagram post',
    meta: 'Publié le 12/05 à 11:30',
  },
  {
    image: '/creative-studio/menu-poster.png',
    status: 'Brouillon',
    title: 'Fête des mères',
    format: '1080 × 1350 · Instagram post',
    meta: 'Modifié il y a 1 jour',
  },
];
