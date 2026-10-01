'use client';

import { useEffect, useRef } from 'react';

/**
 * 모달이 열릴 때 history 항목을 하나 쌓아, 모바일 "뒤로가기"가 페이지를 떠나는 대신 모달만 닫히게 함.
 *
 * - open → pushState (Next.js 내부 state(__NA 등)는 유지해야 App Router가 reload 하지 않음)
 * - 뒤로가기(popstate) → onClose()
 * - 버튼으로 닫힘 → 우리가 쌓은 항목을 history.back() 으로 정리
 */
export function useModalHistory(open: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open || typeof window === 'undefined') return;

    const key = `al-modal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    let closedByPop = false;

    window.history.pushState({ ...(window.history.state || {}), alModal: key }, '');

    const onPop = () => {
      closedByPop = true;
      onCloseRef.current();
    };
    window.addEventListener('popstate', onPop);

    return () => {
      window.removeEventListener('popstate', onPop);
      if (!closedByPop && window.history.state?.alModal === key) {
        window.history.back();
      }
    };
  }, [open]);
}
