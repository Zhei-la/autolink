import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'By링크 - 바이란 링크',
  description: '링크 하나로 내 브랜드를 보여주는 페이지. 사진·링크·SNS·문의를 한 화면에 담고 방문 통계까지 확인하세요.',
  keywords: ['By링크', '바이란 링크', '링크 페이지', '프로필 링크', '바이란미디어'],
  openGraph: {
    title: 'By링크',
    description: '바이란 링크 — 링크 하나로 내 브랜드를 보여주세요',
    locale: 'ko_KR',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#ffffff',
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
