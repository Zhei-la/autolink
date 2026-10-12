'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { updatePage, deletePage } from '@/lib/db/pages';
import { SLUG_PATTERN } from '@/lib/utils';
import { publicUrl } from '@/lib/theme';
import { ConfirmDialog, FieldLabel, TextField, Toggle } from './ui';

interface Props {
  page: any;
}

/** 페이지 설정: 이름 · 주소(아이디) · 공개 여부 · 삭제. 색·폰트는 디자인 탭에서 */
export function PageSettingsForm({ page }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(page.title || '');
  const [slug, setSlug] = useState(page.slug || '');
  const [isPublished, setIsPublished] = useState(!!page.is_published);
  const [origin, setOrigin] = useState('');
  useEffect(() => setOrigin(window.location.origin), []);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [askDelete, setAskDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const base = publicUrl('', origin).replace(/^https?:\/\//, '');

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSaving(true);
    try {
      await updatePage(page.id, { title, slug, is_published: isPublished });
      setInfo('저장했어요');
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setAskDelete(false);
    setDeleting(true);
    try {
      await deletePage(page.id);
    } catch (e: any) {
      if (String(e?.digest || e?.message || '').includes('NEXT_REDIRECT')) return;
      setError(e.message);
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <section className="bl-panel p-4 space-y-4">
        <h2 className="text-[15px] font-bold">기본 정보</h2>
        <TextField label="페이지 이름 (나만 보는 이름)" value={title} onChange={setTitle} maxLength={50} required />
        <div>
          <FieldLabel>페이지 주소</FieldLabel>
          <div className="flex items-center h-12 px-3.5 rounded-xl border border-[#e4e4e7] bg-white focus-within:border-[#111]">
            <span className="text-[#a1a1a6] text-[14px] whitespace-nowrap">{base}</span>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              pattern={SLUG_PATTERN}
              required
              className="flex-1 min-w-0 outline-none bg-transparent text-[15px]"
            />
          </div>
          <p className="text-[12px] text-[#a1a1a6] mt-1.5">
            영문 소문자·숫자·하이픈(-)·밑줄(_)·마침표(.) 3~30자. 바꾸면 예전 주소는 더 이상 열리지 않아요.
          </p>
        </div>
      </section>

      <section className="bl-panel p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[15px] font-bold">페이지 공개</div>
            <div className="text-[12px] text-[#a1a1a6] mt-0.5">{isPublished ? '누구나 주소로 들어올 수 있어요' : '주소를 알아도 열리지 않아요'}</div>
          </div>
          <Toggle checked={isPublished} onChange={setIsPublished} label="페이지 공개" />
        </div>
      </section>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}
      {info && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">{info}</div>}

      <button type="submit" disabled={saving} className="w-full h-13 py-3.5 rounded-2xl bg-[#111] text-white font-semibold disabled:opacity-50">
        {saving ? '저장 중…' : '저장'}
      </button>

      <section className="pt-6">
        <button
          type="button"
          onClick={() => setAskDelete(true)}
          disabled={deleting}
          className="w-full h-12 rounded-2xl border border-red-200 bg-white text-red-500 text-sm font-semibold"
        >
          {deleting ? '삭제 중…' : '이 페이지 삭제'}
        </button>
      </section>

      <ConfirmDialog
        open={askDelete}
        danger
        title="페이지 삭제"
        message={`"${title}" 페이지를 삭제할까요?\n모든 블록과 통계가 함께 지워지고 되돌릴 수 없어요.`}
        confirmText="삭제"
        onCancel={() => setAskDelete(false)}
        onConfirm={handleDelete}
      />
    </form>
  );
}
