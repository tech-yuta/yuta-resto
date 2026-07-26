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
  metadataBase: new URL('https://yutapro.fr'),
  title: {
    default: 'YUTA — Suite de gestion pour restaurants',
    template: '%s | YUTA',
  },
  description:
    'YUTA réunit les outils essentiels pour organiser votre équipe, suivre votre activité, améliorer la relation client et simplifier la gestion quotidienne de votre restaurant.',
  applicationName: 'YUTA',
  authors: [{ name: 'YUTA', url: 'https://yutapro.fr' }],
  creator: 'YUTA',
  publisher: 'YUTA',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'YUTA',
    title: 'YUTA — Suite de gestion pour restaurants',
    description:
      'Une suite d’outils intelligents conçue pour simplifier la gestion quotidienne des restaurants.',
    url: '/',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'YUTA — Suite de gestion pour restaurants',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YUTA — Suite de gestion pour restaurants',
    description:
      'Une suite d’outils intelligents conçue pour simplifier la gestion quotidienne des restaurants.',
    images: ['/twitter-image'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      {
        url: '/images/favicon-96x96.png',
        type: 'image/png',
        sizes: '96x96',
      },
    ],
    apple: [
      {
        url: '/images/apple-touch-icon.png',
        type: 'image/png',
        sizes: '180x180',
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
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
