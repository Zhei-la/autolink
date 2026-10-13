'use client';

import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { withBase } from '@/lib/utils';

/**
 * 편집 화면에서 '내 페이지 보기'로 들어왔을 때만 보이는 "돌아가기" 버튼.
 * 뒤로가기와 같은 동작이라, 휴대폰에서 뒤로가기를 눌러도 편집 화면으로 돌아간다.
 */
export function BackToEditor({ pageId }: { pageId: string }) {
  // 주소창의 ?from=edit 는 지워서, 주소를 복사해도 깔끔하게
  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      if (u.searchParams.has('from')) {
        u.searchParams.delete('from');
        window.history.replaceState(window.history.state, '', u.pathname + u.search + u.hash);
      }
    } catch {}
  }, []);

  function back() {
    const fromEditor = /\/(edit|dashboard)(\/|$|\?)/.test(document.referrer) && window.history.length > 1;
    if (fromEditor) window.history.back();
    else window.location.href = withBase(`/edit/${pageId}`);
  }

  return (
    <button
      type="button"
      onClick={back}
      className="fixed z-50 left-3 top-[calc(env(safe-area-inset-top)+12px)] h-9 pl-2.5 pr-3.5 rounded-full bg-[#171717]/85 backdrop-blur text-white text-[13px] font-bold flex items-center gap-1 shadow-lg"
    >
      <ArrowLeft className="w-4 h-4" />
      돌아가기
    </button>
  );
}
