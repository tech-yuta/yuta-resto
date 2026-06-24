import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'YuTa Admin',
  description: 'Không gian quản trị YuTa.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
