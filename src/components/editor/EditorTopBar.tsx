'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Check, Copy, ExternalLink, Settings, Share } from 'lucide-react';
import { publicUrl } from '@/lib/theme';

export function EditorTopBar({ pageId, slug, title }: { pageId: string; slug: string; title: string }) {
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => setOrigin(window.location.origin), []);

  const url = publicUrl(slug, origin);
  const label = url.replace(/^https?:\/\//, '');

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* 취소 */
      }
    }
    copy();
  }

  return (
    <header className="sticky top-0 z-30 bg-[#f2f2f4]/90 backdrop-blur">
      <div className="mx-auto max-w-[560px] px-4 pt-3 pb-2">
        <div className="h-12 rounded-2xl bg-white flex items-center gap-1 pl-4 pr-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <a
            href={`/p/${slug}`}
            target="_blank"
            rel="noopener"
            className="flex-1 min-w-0 text-[14px] text-[#3b6cf6] underline underline-offset-2 truncate"
            title="내 페이지 열기"
          >
            {label || `/p/${slug}`}
          </a>
          <IconBtn onClick={copy} label="주소 복사">
            {copied ? <Check className="w-[18px] h-[18px] text-[#22c55e]" /> : <Copy className="w-[18px] h-[18px]" />}
          </IconBtn>
          <IconBtn onClick={share} label="공유">
            <Share className="w-[18px] h-[18px]" />
          </IconBtn>
          <a
            href={`/p/${slug}`}
            target="_blank"
            rel="noopener"
            aria-label="새 창에서 열기"
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#111] hover:bg-[#f4f4f5]"
          >
            <ExternalLink className="w-[18px] h-[18px]" />
          </a>
          <Link
            href={`/edit/${pageId}/settings`}
            aria-label="페이지 설정"
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#111] hover:bg-[#f4f4f5]"
          >
            <Settings className="w-[18px] h-[18px]" />
          </Link>
        </div>
        {copied && <div className="text-center text-[12px] text-[#22c55e] mt-1.5">주소를 복사했어요</div>}
      </div>
    </header>
  );
}

function IconBtn({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="w-9 h-9 rounded-full flex items-center justify-center text-[#111] hover:bg-[#f4f4f5]"
    >
      {children}
    </button>
  );
}
