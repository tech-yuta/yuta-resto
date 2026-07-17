import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans } from 'next/font/google';
import './globals.css';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const posUrl = process.env.NEXT_PUBLIC_POS_URL ?? 'http://localhost:3003';

export const metadata: Metadata = {
  metadataBase: new URL(posUrl),
  applicationName: 'YuTa POS',
  title: {
    default: 'YuTa POS',
    template: '%s | YuTa POS',
  },
  description:
    'Point de vente interne YuTa pour prendre les commandes, suivre la cuisine, gerer les paiements et imprimer les tickets.',
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
    siteName: 'YuTa POS',
    title: 'YuTa POS',
    description:
      'Point de vente interne YuTa pour les commandes, la cuisine et les paiements.',
    images: [
      {
        url: '/images/web-app-manifest-512x512.png',
        width: 512,
        height: 512,
        alt: 'YuTa POS',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'YuTa POS',
    description:
      'Point de vente interne YuTa pour les commandes, la cuisine et les paiements.',
    images: ['/images/web-app-manifest-512x512.png'],
  },
  appleWebApp: {
    capable: true,
    title: 'YuTa POS',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
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
      <body className={ibmPlexSans.className}>
        {children}
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
