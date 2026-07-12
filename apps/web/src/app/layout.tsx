import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'YuTa - Outils simples pour restaurants',
  description:
    'Plateforme modulaire pour centraliser reservations, avis, messages, taches, POS et affichage restaurant.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
