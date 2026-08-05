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
  title: { default: 'Réservation de table | YUTA', template: '%s | YUTA' },
  description:
    'Réservez une table simplement et directement auprès de votre restaurant avec YUTA.',
  applicationName: 'YUTA Réservation',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      {
        url: '/images/favicon-96x96.png',
        type: 'image/png',
        sizes: '96x96',
      },
    ],
    apple: '/images/apple-touch-icon.png',
  },
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
