import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* 상단 주황 라인 */}
      <div className="h-2 bg-primary" />

      <div className="mx-auto max-w-3xl px-6 py-20">
        {/* 로고 */}
        <div className="flex items-center gap-3 mb-16">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-white font-black text-3xl">A</span>
          </div>
          <div>
            <div className="text-2xl font-black">
              <span className="text-text">auto</span>
              <span className="text-primary">link</span>
            </div>
            <div className="text-xs text-text-3">autolink.kr</div>
          </div>
        </div>

        {/* 헤드라인 */}
        <div className="text-sm font-bold text-primary tracking-widest mb-3">
          AUTOMATED LINK PAGE
        </div>
        <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
          쇼츠 한 편으로<br />
          매출 만드는 가장<br />
          빠른 방법
        </h1>
        <div className="w-16 h-1 bg-primary mb-8" />
        <p className="text-lg text-text-2 leading-relaxed mb-12 max-w-xl">
          인스타·스레드·유튜브 댓글이 자동으로 매출로 바뀝니다.<br />
          댓글에 키워드 → 자동 DM → 내 링크 페이지 → 구매.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition"
          >
            무료로 시작하기
          </Link>
          <Link
            href="#features"
            className="inline-flex items-center justify-center px-8 py-4 border border-border text-text font-bold rounded-xl hover:bg-primary-soft transition"
          >
            어떤 서비스인가요?
          </Link>
        </div>

        {/* 핵심 기능 박스 */}
        <div className="mt-20 p-6 bg-primary-soft border border-primary border-l-4 rounded-xl">
          <div className="text-sm font-bold text-primary mb-3">이 서비스로 할 수 있는 것</div>
          <ul className="space-y-2 text-text">
            <li className="flex gap-3"><span className="text-primary font-bold">✓</span>5분 만에 첫 링크 페이지 만들기</li>
            <li className="flex gap-3"><span className="text-primary font-bold">✓</span>인스타 댓글로 DM 자동 발송 셋업</li>
            <li className="flex gap-3"><span className="text-primary font-bold">✓</span>6가지 디자인 템플릿으로 업종별 페이지</li>
            <li className="flex gap-3"><span className="text-primary font-bold">✓</span>자동화 통계로 매출 늘리기</li>
          </ul>
        </div>

        {/* 푸터 */}
        <div className="mt-32 pt-8 border-t border-border text-center text-sm text-text-3">
          <p className="font-bold text-text">자동화하는 링크 페이지</p>
          <p className="text-primary mt-1">AutoLink</p>

<p className="text-xs text-text-3 mt-3">
  made by <span className="font-bold text-text">Zheila</span>
</p>
        </div>
      </div>
    </main>
  );
}
