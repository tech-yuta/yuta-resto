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
  metadataBase: new URL(
    process.env.PUBLIC_BOOKING_BASE_URL ?? 'http://localhost:3005',
  ),
  title: { default: 'Réservation | YuTa', template: '%s | YuTa' },
  description: 'Réservez une table directement auprès de votre restaurant.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={geistSans.variable}>
      <body
        className={`${geistSans.className} min-h-screen bg-canvas text-primary`}
      >
        {children}
      </body>
    </html>
  );
}
