'use client';

import { useEffect, useRef, useState } from 'react';
import { Eye } from 'lucide-react';
import type { Block, PageTheme } from '@/types';
import { updatePage } from '@/lib/db/pages';
import { FONTS, normalizeHex, resolveTheme } from '@/lib/theme';
import { useModalHistory } from '@/hooks/useModalHistory';
import { PreviewSheet } from './PageEditor';
import { FieldLabel, ImageField, Segmented, Toggle } from './ui';
import { LogoMark, Wordmark } from '@/components/brand/Logo';

const BG_PRESETS = ['#f4f4f5', '#ffffff', '#f5f0e8', '#d8d2c8', '#eef4ff', '#fdf2f8', '#ecfdf5', '#111111'];
const BUTTON_PRESETS = ['#111111', '#7c3aed', '#2563eb', '#f9a8d4', '#99f6e4', '#a7d7a9', '#fde68a', '#b08968'];

export function DesignForm({
  page,
  blocks,
  readOnly,
}: {
  page: { id: string; slug: string; title: string; theme: Partial<PageTheme> };
  blocks: Block[];
  readOnly?: boolean;
}) {
  const [theme, setTheme] = useState<PageTheme>(() => resolveTheme(page.theme) as PageTheme);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(theme);
  useModalHistory(preview, () => setPreview(false));

  const hasProducts = blocks.some((b) => b.type === 'product_grid');

  function patch(p: Partial<PageTheme>) {
    if (readOnly) return;
    const next = { ...latest.current, ...p };
    latest.current = next;
    setTheme(next);
    setState('saving');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await updatePage(page.id, { theme: latest.current });
        setState('saved');
        setError(null);
      } catch (e: any) {
        setState('error');
        setError(e?.message || '저장하지 못했어요');
      }
    }, 600);
  }

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <div className={`space-y-3 ${readOnly ? 'pointer-events-none opacity-60' : ''}`}>
      {/* 사용하는 폰트 미리 불러오기 */}
      {FONTS.filter((f) => f.href).map((f) => (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link key={f.key} rel="stylesheet" href={f.href} />
      ))}

      <div className="flex items-center justify-end h-5 px-1 text-[11px] text-[#a1a1a6]">
        {state === 'saving' ? '저장 중…' : state === 'saved' ? '자동 저장됨' : state === 'error' ? '저장 실패' : ''}
      </div>
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

      {/* 배경 */}
      <Card title="배경">
        <Swatches value={theme.bgColor} presets={BG_PRESETS} onPick={(c) => patch({ bgColor: c })} />
        <div className="mt-4">
          <ImageField
            label="배경 사진 (선택)"
            hint="사진 위에 버튼이 올라가요"
            value={theme.bgImage}
            preset="background"
            shape="wide"
            onChange={(url) => patch({ bgImage: url || undefined })}
          />
        </div>
      </Card>

      {/* 버튼 */}
      <Card title="버튼색">
        <Swatches value={theme.primaryColor} presets={BUTTON_PRESETS} onPick={(c) => patch({ primaryColor: c })} />
        <div className="mt-4 flex items-center gap-5 text-[14px]">
          {(
            [
              ['highlight', '부분 적용 (강조 버튼만)'],
              ['all', '전체 적용'],
            ] as const
          ).map(([v, l]) => (
            <label key={v} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="buttonScope"
                checked={(theme.buttonScope || 'highlight') === v}
                onChange={() => patch({ buttonScope: v })}
                className="w-4 h-4 accent-[#111]"
              />
              {l}
            </label>
          ))}
        </div>
      </Card>

      <Card title="버튼 모양">
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ['square', '각진', 6],
              ['rounded', '둥근', 14],
              ['pill', '알약', 999],
            ] as const
          ).map(([v, l, r]) => (
            <button
              key={v}
              type="button"
              onClick={() => patch({ buttonShape: v })}
              className={`h-16 rounded-xl border flex flex-col items-center justify-center gap-1.5 ${
                theme.buttonShape === v ? 'border-[#111] bg-[#fafafa]' : 'border-[#e4e4e7]'
              }`}
            >
              <span className="w-16 h-5 bg-[#d4d4d8]" style={{ borderRadius: r }} />
              <span className="text-[12px]">{l}</span>
            </button>
          ))}
        </div>
        <div className="mt-3">
          <Segmented
            value={theme.buttonStyle || 'fill'}
            onChange={(v) => patch({ buttonStyle: v })}
            options={[
              { value: 'fill', label: '채우기' },
              { value: 'outline', label: '테두리' },
              { value: 'shadow', label: '그림자' },
            ]}
          />
        </div>
      </Card>

      {/* 폰트 */}
      <Card title="폰트">
        <div className="grid grid-cols-2 gap-2">
          {FONTS.map((f) => {
            const on = theme.font === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => patch({ font: f.key })}
                className={`h-[60px] rounded-xl flex flex-col items-center justify-center ${
                  on ? 'bg-[#111] text-white' : 'bg-white border border-[#e4e4e7] text-[#111]'
                }`}
              >
                <span className="text-[16px]" style={{ fontFamily: f.family }}>
                  안녕하세요!
                </span>
                <span className={`text-[10px] ${on ? 'text-white/60' : 'text-[#a1a1a6]'}`}>{f.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* 하단 로고 */}
      <Card title="로고">
        <div className="space-y-2">
          <LogoOption
            on={(theme.footerLogo || 'bylink') === 'bylink'}
            onClick={() => patch({ footerLogo: 'bylink' })}
          >
            <span className="inline-flex items-center gap-1.5 text-[13px]">
              made with <Wordmark size="sm" />
            </span>
          </LogoOption>
          <LogoOption on={theme.footerLogo === 'custom'} onClick={() => patch({ footerLogo: 'custom' })}>
            <span className="text-[14px] font-semibold">내 로고</span>
          </LogoOption>
          <LogoOption on={theme.footerLogo === 'none'} onClick={() => patch({ footerLogo: 'none' })}>
            <span className="text-[14px]">로고 없음</span>
          </LogoOption>
        </div>
        {theme.footerLogo === 'custom' && (
          <div className="mt-4">
            <ImageField
              label="로고 이미지"
              hint="배경이 투명한 PNG 추천"
              value={theme.footerLogoUrl}
              preset="logo"
              onChange={(url) => patch({ footerLogoUrl: url || undefined })}
            />
          </div>
        )}
      </Card>

      {hasProducts && (
        <Card title="상품 검색창">
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-[#444]">상품 그리드 위에 검색창 보이기</span>
            <Toggle size="sm" checked={theme.showSearch !== false} onChange={(v) => patch({ showSearch: v })} />
          </div>
        </Card>
      )}

      <div className="flex items-center justify-center gap-2 pt-4 text-[12px] text-[#a1a1a6]">
        <LogoMark size={18} /> 바뀐 디자인은 바로 공개 페이지에 반영돼요
      </div>

      <div className="fixed left-0 right-0 bottom-[84px] z-30 pointer-events-none">
        <div className="mx-auto max-w-[560px] px-4">
          <button
            onClick={() => setPreview(true)}
            className="pointer-events-auto h-11 pl-3.5 pr-4 rounded-full bg-[#3b6cf6] text-white text-sm font-semibold shadow-lg flex items-center gap-1.5"
          >
            <Eye className="w-4 h-4" /> 미리보기
          </button>
        </div>
      </div>

      {preview && (
        <PreviewSheet page={{ title: page.title, slug: page.slug, theme }} blocks={blocks} onClose={() => setPreview(false)} />
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <h2 className="text-[15px] font-bold mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Swatches({ value, presets, onPick }: { value: string; presets: string[]; onPick: (c: string) => void }) {
  const [hex, setHex] = useState(value);
  useEffect(() => setHex(value), [value]);
  const isCustom = !presets.includes((value || '').toLowerCase());
  return (
    <div>
      <div className="grid grid-cols-8 gap-2">
        {presets.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onPick(c)}
            aria-label={c}
            className={`aspect-square rounded-xl border transition ${
              value?.toLowerCase() === c ? 'ring-2 ring-offset-2 ring-[#3b6cf6] border-transparent' : 'border-[#e4e4e7]'
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <FieldLabel>직접 고르기</FieldLabel>
        <label
          className={`relative w-9 h-9 rounded-xl border overflow-hidden cursor-pointer ${
            isCustom ? 'ring-2 ring-offset-2 ring-[#3b6cf6] border-transparent' : 'border-[#e4e4e7]'
          }`}
          style={{ backgroundColor: value }}
        >
          <input
            type="color"
            value={normalizeHex(value) || '#000000'}
            onChange={(e) => onPick(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>
        <input
          value={hex}
          onChange={(e) => {
            setHex(e.target.value);
            const n = normalizeHex(e.target.value);
            if (n) onPick(n);
          }}
          className="w-28 h-9 px-2.5 rounded-lg border border-[#e4e4e7] text-[13px] font-mono uppercase"
          maxLength={7}
        />
      </div>
    </div>
  );
}

function LogoOption({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full h-12 rounded-xl flex items-center justify-center transition ${
        on ? 'bg-[#111] text-white' : 'bg-white border border-[#e4e4e7] text-[#9a9aa0]'
      }`}
    >
      {children}
    </button>
  );
}
