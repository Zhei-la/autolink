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
  { name: '二쇳솴', value: '#f97316' },
  { name: '寃??, value: '#0a0b0d' },
  { name: '?뚮옉', value: '#3b82f6' },
  { name: '鍮④컯', value: '#ef4444' },
  { name: '?묓겕', value: '#ec4899' },
  { name: '蹂대씪', value: '#8b5cf6' },
  { name: '珥덈줉', value: '#10b981' },
];

const BG_PRESETS = [
  { name: '?고쉶??, value: '#fafafa' },
  { name: '?곗깋', value: '#ffffff' },
  { name: '?곗＜??, value: '#fff7ed' },
  { name: '?고뙆??, value: '#eff6ff' },
  { name: '?고븨??, value: '#fdf2f8' },
  { name: '?곗큹濡?, value: '#f0fdf4' },
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
      setInfo('??λ릺?덉뒿?덈떎');
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`?뺣쭚 "${title}" ?섏씠吏瑜???젣?섏떆寃좎뼱?? 紐⑤뱺 釉붾줉쨌?듦퀎媛 ?④퍡 ??젣?섎ŉ 蹂듦뎄?????놁뒿?덈떎.`)) return;
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
      {/* 湲곕낯 ?뺣낫 */}
      <section>
        <h2 className="font-bold mb-3">湲곕낯 ?뺣낫</h2>
        <div className="space-y-3">
          <Input label="?섏씠吏 ?대쫫" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={50} required />
          <div>
            <label className="block text-sm font-bold mb-2">URL</label>
            <div className="flex items-center gap-1 px-4 h-12 border border-border rounded-xl">
              <span className="text-text-3 text-sm">autolink.kr/p/</span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                pattern="[a-z0-9\-]{3,30}"
                required
                className="flex-1 outline-none bg-transparent"
              />
            </div>
            <p className="text-xs text-text-3 mt-1">?곷Ц ?뚮Ц?? ?レ옄, ?섏씠?덈쭔 媛??쨌 蹂寃???湲곗〈 URL ?묐룞 X</p>
          </div>
        </div>
      </section>

      {/* 怨듦컻 ?ㅼ젙 */}
      <section>
        <h2 className="font-bold mb-3">怨듦컻 ?ㅼ젙</h2>
        <label className="flex items-center justify-between p-4 border border-border rounded-xl cursor-pointer">
          <div>
            <div className="font-bold text-sm">?섏씠吏 怨듦컻</div>
            <div className="text-xs text-text-3 mt-0.5">{isPublished ? '?꾧뎄??URL濡??묒냽 媛?? : 'URL???뚯븘???묒냽 遺덇?'}</div>
          </div>
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="w-5 h-5 accent-primary"
          />
        </label>
      </section>

      {/* ?붿옄??- ?ъ씤????*/}
      <section>
        <h2 className="font-bold mb-3">?ъ씤???됯퉼</h2>
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
          label="吏곸젒 ?낅젰 (HEX)"
          value={primaryColor}
          onChange={(e) => setPrimaryColor(e.target.value)}
          placeholder="#f97316"
          className="mt-3"
        />
      </section>

      {/* ?붿옄??- 諛곌꼍??*/}
      <section>
        <h2 className="font-bold mb-3">諛곌꼍??/h2>
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

      {/* ????ㅻ쪟 */}
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
      {info && <div className="p-3 bg-primary-soft border border-primary rounded-lg text-sm text-primary-dark">{info}</div>}

      <Button type="submit" loading={saving} size="lg" className="w-full">???/Button>

      {/* ?꾪뿕 ?곸뿭 */}
      <section className="pt-8 border-t border-border">
        <h2 className="font-bold mb-3 text-red-500">?꾪뿕 ?곸뿭</h2>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="w-full h-12 border border-red-300 text-red-500 font-bold rounded-xl hover:bg-red-50 transition"
        >
          {deleting ? '??젣 以?..' : '?섏씠吏 ??젣'}
        </button>
      </section>
    </form>
  );
}
