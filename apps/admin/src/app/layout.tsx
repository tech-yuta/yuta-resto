import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AdminFrame } from '../components/admin-frame';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'YuTa Admin',
  description: 'Khong gian quan tri YuTa.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <AdminFrame>{children}</AdminFrame>
      </body>
    </html>
  );
}
