'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { updatePage, deletePage } from '@/lib/db/pages';

interface Props {
  page: any;
}

const COLOR_PRESETS = [
  { name: '주황', value: '#f97316' },
  { name: '검정', value: '#0a0b0d' },
  { name: '파랑', value: '#3b82f6' },
  { name: '빨강', value: '#ef4444' },
  { name: '핑크', value: '#ec4899' },
  { name: '보라', value: '#8b5cf6' },
  { name: '초록', value: '#10b981' },
];

const BG_PRESETS = [
  { name: '연회색', value: '#fafafa' },
  { name: '흰색', value: '#ffffff' },
  { name: '연주황', value: '#fff7ed' },
  { name: '연파랑', value: '#eff6ff' },
  { name: '연핑크', value: '#fdf2f8' },
  { name: '연초록', value: '#f0fdf4' },
];

export function PageSettingsForm({ page }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(page.title || '');
  const [slug, setSlug] = useState(page.slug || '');
  const [primaryColor, setPrimaryColor] = useState(page.theme?.primaryColor || '#f97316');
  const [bgColor, setBgColor] = useState(page.theme?.bgColor || '#fafafa');
  const [isPublished, setIsPublished] = useState(page.is_published);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSaving(true);
    try {
      await updatePage(page.id, {
        title,
        slug,
        is_published: isPublished,
        theme: {
          ...page.theme,
          primaryColor,
          bgColor,
        },
      });
      setInfo('저장되었습니다');
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`정말 "${title}" 페이지를 삭제하시겠어요? 모든 블록·통계가 함께 삭제되며 복구할 수 없습니다.`)) return;
    setDeleting(true);
    try {
      await deletePage(page.id);
    } catch (e: any) {
      setError(e.message);
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* 기본 정보 */}
      <section>
        <h2 className="font-bold mb-3">기본 정보</h2>
        <div className="space-y-3">
          <Input label="페이지 이름" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={50} required />
          <div>
            <label className="block text-sm font-bold mb-2">URL</label>
            <div className="flex items-center gap-1 px-4 h-12 border border-border rounded-xl">
              <span className="text-text-3 text-sm">autolink.kr/p/</span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                pattern="[a-z0-9-]{3,30}"
                required
                className="flex-1 outline-none bg-transparent"
              />
            </div>
            <p className="text-xs text-text-3 mt-1">영문 소문자, 숫자, 하이픈만 가능 · 변경 시 기존 URL 작동 X</p>
          </div>
        </div>
      </section>

      {/* 공개 설정 */}
      <section>
        <h2 className="font-bold mb-3">공개 설정</h2>
        <label className="flex items-center justify-between p-4 border border-border rounded-xl cursor-pointer">
          <div>
            <div className="font-bold text-sm">페이지 공개</div>
            <div className="text-xs text-text-3 mt-0.5">{isPublished ? '누구나 URL로 접속 가능' : 'URL을 알아도 접속 불가'}</div>
          </div>
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="w-5 h-5 accent-primary"
          />
        </label>
      </section>

      {/* 디자인 - 포인트 색 */}
      <section>
        <h2 className="font-bold mb-3">포인트 색깔</h2>
        <div className="grid grid-cols-7 gap-2">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setPrimaryColor(c.value)}
              className={`aspect-square rounded-xl border-2 ${primaryColor === c.value ? 'border-text scale-105' : 'border-border'} transition`}
              style={{ backgroundColor: c.value }}
              title={c.name}
            />
          ))}
        </div>
        <Input
          label="직접 입력 (HEX)"
          value={primaryColor}
          onChange={(e) => setPrimaryColor(e.target.value)}
          placeholder="#f97316"
          className="mt-3"
        />
      </section>

      {/* 디자인 - 배경색 */}
      <section>
        <h2 className="font-bold mb-3">배경색</h2>
        <div className="grid grid-cols-6 gap-2">
          {BG_PRESETS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setBgColor(c.value)}
              className={`aspect-square rounded-xl border-2 ${bgColor === c.value ? 'border-text scale-105' : 'border-border'} transition`}
              style={{ backgroundColor: c.value }}
              title={c.name}
            />
          ))}
        </div>
      </section>

      {/* 저장/오류 */}
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
      {info && <div className="p-3 bg-primary-soft border border-primary rounded-lg text-sm text-primary-dark">{info}</div>}

      <Button type="submit" loading={saving} size="lg" className="w-full">저장</Button>

      {/* 위험 영역 */}
      <section className="pt-8 border-t border-border">
        <h2 className="font-bold mb-3 text-red-500">위험 영역</h2>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="w-full h-12 border border-red-300 text-red-500 font-bold rounded-xl hover:bg-red-50 transition"
        >
          {deleting ? '삭제 중...' : '페이지 삭제'}
        </button>
      </section>
    </form>
  );
}
