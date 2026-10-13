'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { withBase } from '@/lib/utils';

/**
 * 편집 화면에서 '내 페이지 보기'(?from=edit)로 들어왔을 때만 보이는 "돌아가기" 버튼.
 * - 같은 창에서 열리므로 휴대폰 뒤로가기도 편집 화면으로 돌아감
 * - 이 창(탭)에서는 새로고침·앞으로가기를 해도 버튼이 남아 있음 (sessionStorage)
 * - 주소창의 ?from=edit 는 지워서, 주소를 복사해 공유해도 방문자에겐 안 보임
 */
export function BackToEditor({ pageId }: { pageId: string }) {
  const [show, setShow] = useState(false);
  const key = `bl_from_edit_${pageId}`;

  useEffect(() => {
    let on = false;
    try {
      const u = new URL(window.location.href);
      if (u.searchParams.get('from') === 'edit') {
        on = true;
        try { sessionStorage.setItem(key, '1'); } catch {}
        u.searchParams.delete('from');
        window.history.replaceState(window.history.state, '', u.pathname + u.search + u.hash);
      } else {
        try { on = sessionStorage.getItem(key) === '1'; } catch {}
      }
    } catch {}
    setShow(on);
  }, [key]);

  if (!show) return null;

  function back() {
    const fromApp = /\/(edit|dashboard)(\/|$|\?)/.test(document.referrer) && window.history.length > 1;
    if (fromApp) window.history.back();
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
