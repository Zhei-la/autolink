'use client';

import { useEffect, useState, type ReactNode } from 'react';

/**
 * 공개 페이지에서 외부로 나가는 링크.
 * /api/click/{blockId}?to=... 를 거쳐 클릭을 기록하고 리다이렉트된다.
 * 마운트 후 referrer / utm 값을 쿼리에 붙여 클릭 기록에 유입경로가 남도록 함.
 * (렌더 시점에 붙이면 SSR 과 값이 달라 hydration 경고가 나므로 useEffect 에서 처리)
 */
export function buildClickHref(blockId: string, url: string, withContext = false): string {
  const params = new URLSearchParams({ to: url || '#' });
  if (withContext && typeof window !== 'undefined') {
    const search = new URLSearchParams(window.location.search);
    if (document.referrer) params.set('r', document.referrer);
    const us = search.get('utm_source');
    const um = search.get('utm_medium');
    const uc = search.get('utm_campaign');
    if (us) params.set('us', us);
    if (um) params.set('um', um);
    if (uc) params.set('uc', uc);
  }
  return `/api/click/${blockId}?${params.toString()}`;
}

export function TrackedLink({
  blockId,
  url,
  className,
  children,
}: {
  blockId: string;
  url: string;
  className?: string;
  children: ReactNode;
}) {
  const [href, setHref] = useState(() => buildClickHref(blockId, url, false));

  useEffect(() => {
    setHref(buildClickHref(blockId, url, true));
  }, [blockId, url]);

  return (
    <a href={href} target="_blank" rel="noopener" className={className}>
      {children}
    </a>
  );
}
