import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  subsets: ['latin'],
  display: 'swap',
  fallback: ['Inter'],
  variable: '--font-geist-sans',
});

const backofficeUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001';

export const metadata: Metadata = {
  metadataBase: new URL(backofficeUrl),
  applicationName: 'Espace restaurateur YUTA',
  title: {
    default: 'Espace restaurateur YUTA',
    template: '%s | Espace restaurateur YUTA',
  },
  description:
    'Back office YuTa pour piloter les operations restaurant, le POS, les reservations, les menus, les stocks et les clients.',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/images/logo.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/images/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [
      {
        url: '/images/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    shortcut: ['/favicon.ico'],
  },
  openGraph: {
    type: 'website',
    siteName: 'Espace restaurateur YUTA',
    title: 'Espace restaurateur YUTA',
    description:
      'Back office restaurant YuTa pour suivre les operations quotidiennes.',
    images: [
      {
        url: '/images/logo-slogan.png',
        alt: 'Espace restaurateur YUTA',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Espace restaurateur YUTA',
    description:
      'Back office restaurant YuTa pour suivre les operations quotidiennes.',
    images: ['/images/logo-slogan.png'],
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#3a9c7c',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={geistSans.variable}>
      <body className={geistSans.className}>{children}</body>
    </html>
  );
}
