'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useModalHistory } from '@/hooks/useModalHistory';
import { getShareInfo, type ShareInfo } from '@/lib/db/invites';
import { SharePanel, SharedNotice } from './SharePanel';

/** 편집 화면 어디서나 여는 '페이지 공유하기' 창 */
export function ShareSheet({
  pageId,
  pageTitle,
  isOwner,
  onClose,
}: {
  pageId: string;
  pageTitle: string;
  isOwner: boolean;
  onClose: () => void;
}) {
  const [info, setInfo] = useState<ShareInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  useModalHistory(true, onClose);

  useEffect(() => {
    if (!isOwner) return;
    getShareInfo(pageId).then(setInfo, (e) => setError(e?.message || '불러오지 못했어요'));
  }, [pageId, isOwner]);

  return (
    <div className="fixed inset-0 z-[60] bg-ink/40 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-[520px] rounded-t-[24px] sm:rounded-[24px] max-h-[90vh] overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+16px)]"
      >
        <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-5 h-14">
          <h2 className="font-extrabold text-[17px] text-ink">페이지 공유하기</h2>
          <button onClick={onClose} aria-label="닫기" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-mist">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-4">
          {!isOwner ? (
            <SharedNotice pageId={pageId} ownerName="페이지 주인" />
          ) : info ? (
            <SharePanel pageId={pageId} pageTitle={pageTitle} info={info} />
          ) : (
            <div className="py-10 text-center text-[13px] text-[#8b8b90]">{error || '불러오는 중…'}</div>
          )}
        </div>
      </div>
    </div>
  );
}
