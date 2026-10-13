'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound } from 'lucide-react';
import { redeemInvite } from '@/lib/db/invites';

/** 내 페이지 목록: 받은 코드 넣고 페이지 받기 */
export function RedeemForm() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await redeemInvite(code);
      if (r.ok) router.push(`/edit/${r.pageId}`);
      else setError(r.error);
    });
  }

  return (
    <form onSubmit={submit} className="rounded-[20px] bg-mist p-4 mb-6">
      <div className="flex items-center gap-1.5 text-[14px] font-bold text-ink">
        <KeyRound className="w-4 h-4" /> 코드로 페이지 받기
      </div>
      <p className="text-[12px] text-[#6b6b70] mt-1">페이지를 만들어 준 분께 받은 코드를 넣어 주세요.</p>
      <div className="mt-3 flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="예: K7Q-9MX"
          maxLength={9}
          autoCapitalize="characters"
          className="flex-1 min-w-0 h-11 px-3.5 rounded-[12px] bg-white border border-transparent text-[16px] tracking-[0.1em] font-bold outline-none focus:border-ink"
        />
        <button disabled={pending || code.replace(/[^A-Za-z0-9]/g, '').length < 6} className="h-11 px-4 rounded-[12px] bg-ink text-white text-[14px] font-bold disabled:opacity-40">
          {pending ? '확인 중' : '받기'}
        </button>
      </div>
      {error && <p className="mt-2 text-[13px] text-cherry">{error}</p>}
    </form>
  );
}
