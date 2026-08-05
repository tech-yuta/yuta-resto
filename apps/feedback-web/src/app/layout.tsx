import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  subsets: ['latin'],
  display: 'swap',
  fallback: ['Inter'],
  variable: '--font-geist-sans',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://feedback.yutapro.fr'),
  title: {
    default: 'YUTA Avis — Les retours clients, simplement',
    template: '%s | YUTA Avis',
  },
  description:
    "YUTA Avis permet aux restaurants de recueillir simplement les retours de leurs clients et d'améliorer leur expérience.",
  applicationName: 'YUTA Avis',
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={geistSans.variable}>
      <body>{children}</body>
    </html>
  );
}
