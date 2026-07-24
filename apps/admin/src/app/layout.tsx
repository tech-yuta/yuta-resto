import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:3001';

export const metadata: Metadata = {
  metadataBase: new URL(adminUrl),
  applicationName: 'YuTa Admin',
  title: {
    default: 'YuTa Admin',
    template: '%s | YuTa Admin',
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
    siteName: 'YuTa Admin',
    title: 'YuTa Admin',
    description:
      'Back office restaurant YuTa pour suivre les operations quotidiennes.',
    images: [
      {
        url: '/images/logo-slogan.png',
        alt: 'YuTa Admin',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YuTa Admin',
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
    <html lang="fr">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
