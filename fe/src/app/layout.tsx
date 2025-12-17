import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NAOS - 건강한 레시피 플랫폼',
  description: '요리와 영상의 병행이 어려운 문제를 해결하는 혁신적 요리 플랫폼',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
