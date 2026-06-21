import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'YuTa — Tools that work together',
  description: 'Nền tảng công cụ YuTa.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
