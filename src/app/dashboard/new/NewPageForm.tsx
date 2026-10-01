'use client';

import { useState, useTransition } from 'react';
import { createPage } from '@/lib/db/pages';
import { SLUG_PATTERN, toSlug } from '@/lib/utils';
import { publicUrl } from '@/lib/theme';

export function NewPageForm({ remaining }: { remaining: number }) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onTitleChange(v: string) {
    setTitle(v);
    if (!slugTouched) {
      // 한글 제목이면 슬러그로 못 쓰니 영문/숫자만 남김
      setSlug(toSlug(v).replace(/[^a-z0-9-]/g, ''));
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const res = await createPage(fd);
        // 성공 시 서버에서 redirect 되므로 여기 오면 실패
        if (res && !res.ok) setError(res.error);
      } catch (err: any) {
        // redirect 는 여기서 throw 로 전달됨 (NEXT_REDIRECT) → 무시
        if (err?.message !== 'NEXT_REDIRECT' && !String(err?.digest || '').startsWith('NEXT_REDIRECT')) {
          setError(err?.message || '페이지를 만들지 못했어요');
        }
      }
    });
  }

  if (remaining <= 0) {
    return (
      <div className="p-5 border border-border rounded-2xl bg-primary-soft text-sm">
        <strong>페이지 상한에 도달했어요.</strong>
        <p className="text-text-2 mt-1">더 많은 페이지가 필요하면 운영자에게 요청해주세요.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="title" className="block text-sm font-bold mb-2">페이지 이름</label>
        <input
          id="title"
          name="title"
          type="text"
          placeholder="내 링크 페이지"
          required
          maxLength={50}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          disabled={pending}
          className="w-full h-12 px-4 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
        />
        <p className="text-xs text-text-3 mt-1.5">나만 보는 이름이에요. 예: 대건 D&C, 바이란 마케팅</p>
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-bold mb-2">
          페이지 주소 <span className="text-text-3 font-normal">(나중에 변경 가능)</span>
        </label>
        <div className="flex items-center gap-1 px-4 h-12 border border-border rounded-xl focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary">
          <span className="text-text-3 text-sm whitespace-nowrap">{publicUrl('').replace(/^https?:\/\//, '') || '/p/'}</span>
          <input
            id="slug"
            name="slug"
            type="text"
            placeholder="byran.mk"
            pattern={SLUG_PATTERN}
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value.toLowerCase());
            }}
            disabled={pending}
            className="flex-1 outline-none bg-transparent"
          />
        </div>
        <p className="text-xs text-text-3 mt-1.5">영문 소문자·숫자·하이픈(-)·밑줄(_)·마침표(.) · 비워두면 자동 생성</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full h-14 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition disabled:opacity-50"
      >
        {pending ? '만드는 중...' : '만들기'}
      </button>

      <p className="text-xs text-text-3 text-center">남은 페이지 {remaining}개</p>
    </form>
  );
}
