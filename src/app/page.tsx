import Link from 'next/link';
import { Logo, Wordmark } from '@/components/brand/Logo';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f5f0e8] text-[#111]">
      <div className="mx-auto max-w-3xl px-6 pt-8 pb-20">
        <header className="flex items-center justify-between">
          <Logo size="md" />
          <Link href="/login" className="h-10 px-4 rounded-full bg-[#111] text-white text-sm font-semibold inline-flex items-center">
            로그인
          </Link>
        </header>

        <section className="pt-20 md:pt-28">
          <p className="text-[13px] font-semibold tracking-[0.2em] text-[#8a7f70]">BYRAN LINK</p>
          <h1 className="mt-4 text-[44px] md:text-[60px] font-black leading-[1.08] tracking-tight">
            링크 하나로
            <br />
            내 브랜드를
            <br />
            보여주세요
          </h1>
          <p className="mt-6 text-[17px] text-[#5b5348] leading-relaxed max-w-xl">
            사진 한 장, 버튼 몇 개면 홈페이지 같은 프로필 링크가 완성돼요.
            <br className="hidden md:block" />
            누가 어디서 들어와 무엇을 눌렀는지도 한눈에 보여드려요.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center h-14 px-8 rounded-2xl bg-[#111] text-white font-semibold"
            >
              무료로 시작하기
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center justify-center h-14 px-8 rounded-2xl border border-[#d8cfc2] font-semibold"
            >
              어떤 걸 만들 수 있나요?
            </Link>
          </div>
        </section>

        <section id="features" className="mt-24 grid sm:grid-cols-2 gap-3">
          {[
            ['커버 사진 · 썸네일 버튼', '사진이 들어간 버튼과 커버로 업종에 맞는 분위기를 만들어요.'],
            ['그룹 링크 · 갤러리 · 동영상', '포트폴리오, 후기, 유튜브 영상을 한 페이지에 정리해요.'],
            ['디자인 탭', '배경, 버튼 색과 모양, 한글 폰트 9종, 내 로고까지 직접 골라요.'],
            ['분석 탭', '방문·클릭·클릭률, 유입 채널, 기기, 블록별 클릭 순위를 기간별로 봐요.'],
          ].map(([t, d]) => (
            <div key={t} className="rounded-3xl bg-white/70 p-6">
              <div className="font-bold text-[17px]">{t}</div>
              <div className="mt-2 text-[14px] text-[#5b5348] leading-relaxed">{d}</div>
            </div>
          ))}
        </section>

        <footer className="mt-24 pt-8 border-t border-[#e2d9cc] flex items-center justify-between text-[13px] text-[#8a7f70]">
          <Wordmark size="sm" />
          <span>바이란미디어</span>
        </footer>
      </div>
    </main>
  );
}
