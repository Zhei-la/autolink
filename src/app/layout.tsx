import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '오토링크 - 자동화하는 링크 페이지',
  description: '인스타·스레드·유튜브 댓글 자동 응대 + 미니 홈페이지를 한 번에. 쇼츠 한 편으로 매출 만드는 가장 빠른 방법.',
  keywords: ['오토링크', '인스타 자동화', '링크 페이지', 'autolink', 'DM 자동화'],
  openGraph: {
    title: '오토링크',
    description: '자동화하는 링크 페이지',
    locale: 'ko_KR',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#f97316',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-white text-text antialiased">
        {children}
      </body>
    </html>
  );
}
