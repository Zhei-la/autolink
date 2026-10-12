'use client';

import { useEffect } from 'react';
import { withBase } from '@/lib/utils';

/**
 * 공개 페이지 방문을 /api/view 로 보고.
 * - 같은 탭에서 새로고침 반복해도 세션당 1회만 (sessionStorage)
 * - referrer / utm 은 브라우저에서만 정확히 알 수 있어 클라이언트에서 보냄
 */
export function ViewTracker({ pageId }: { pageId: string }) {
  useEffect(() => {
    const key = `al_viewed_${pageId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      // sessionStorage 막힌 환경(일부 인앱) — 그냥 기록 진행
    }

    const search = new URLSearchParams(window.location.search);
    const payload = JSON.stringify({
      pageId,
      referrer: document.referrer || null,
      utm_source: search.get('utm_source'),
      utm_medium: search.get('utm_medium'),
      utm_campaign: search.get('utm_campaign'),
    });

    // sendBeacon 은 페이지 이탈 중에도 전송 보장. JSON 헤더를 위해 Blob 사용.
    const sent =
      typeof navigator.sendBeacon === 'function' &&
      navigator.sendBeacon(withBase('/api/view'), new Blob([payload], { type: 'application/json' }));

    if (!sent) {
      fetch(withBase('/api/view'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  }, [pageId]);

  return null;
}
