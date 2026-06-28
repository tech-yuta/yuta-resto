import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'YuTa POS',
  description: 'Point de vente interne YuTa.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
