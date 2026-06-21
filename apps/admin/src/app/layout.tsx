import type { Metadata } from 'next';
import { AdminThemeProvider } from '../components/admin-theme-provider';
import { EmotionRegistry } from '../components/emotion-registry';

export const metadata: Metadata = {
  title: 'YuTa Admin',
  description: 'Không gian quản trị YuTa.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <EmotionRegistry>
          <AdminThemeProvider>{children}</AdminThemeProvider>
        </EmotionRegistry>
      </body>
    </html>
  );
}
