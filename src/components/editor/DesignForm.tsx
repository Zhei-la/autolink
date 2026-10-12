'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Eye } from 'lucide-react';
import type { Block, PageTheme } from '@/types';
import { updatePage } from '@/lib/db/pages';
import { FONTS, normalizeHex, resolveTheme } from '@/lib/theme';
import { useModalHistory } from '@/hooks/useModalHistory';
import { PhoneFrame, PreviewSheet } from './PageEditor';
import { PageView } from '@/components/page/PageView';
import { FieldLabel, ImageField, Segmented, Toggle } from './ui';
import { Wordmark } from '@/components/brand/Logo';

const BG_PRESETS = ['#ffffff', '#f5f5f6', '#ffedf1', '#fff4e0', '#e9f1ff', '#e8f4ec', '#efe9ff', '#171717'];
const BUTTON_PRESETS = ['#171717', '#fc1c49', '#ff7a1a', '#1f6feb', '#13795b', '#6b4eff', '#8a5a3c', '#ffffff'];

/** By링크 스타일 세트: 한 번 누르면 바탕·버튼·글꼴이 같이 바뀜 */
const STYLE_SETS: { key: string; name: string; theme: Partial<PageTheme> }[] = [
  { key: 'ink', name: '먹', theme: { bgColor: '#ffffff', primaryColor: '#171717', buttonShape: 'rounded', buttonStyle: 'fill', buttonScope: 'all', font: 'pretendard' } },
  { key: 'cherry', name: '체리', theme: { bgColor: '#ffedf1', primaryColor: '#fc1c49', buttonShape: 'pill', buttonStyle: 'fill', buttonScope: 'all', font: 'pretendard' } },
  { key: 'night', name: '밤', theme: { bgColor: '#171717', primaryColor: '#ffffff', buttonShape: 'rounded', buttonStyle: 'outline', buttonScope: 'all', font: 'ibm' } },
  { key: 'tangerine', name: '귤', theme: { bgColor: '#fff4e0', primaryColor: '#ff7a1a', buttonShape: 'pill', buttonStyle: 'shadow', buttonScope: 'highlight', font: 'jua' } },
  { key: 'sea', name: '바다', theme: { bgColor: '#e9f1ff', primaryColor: '#1f6feb', buttonShape: 'square', buttonStyle: 'fill', buttonScope: 'all', font: 'noto' } },
  { key: 'pine', name: '솔', theme: { bgColor: '#e8f4ec', primaryColor: '#13795b', buttonShape: 'rounded', buttonStyle: 'outline', buttonScope: 'all', font: 'gowun-batang' } },
];

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
  const dirty = useRef(false);
  useModalHistory(preview, () => setPreview(false));

  const hasProducts = blocks.some((b) => b.type === 'product_grid');

  function patch(p: Partial<PageTheme>) {
    if (readOnly) return;
    const next = { ...latest.current, ...p };
    latest.current = next;
    setTheme(next);
    setState('saving');
    if (timer.current) clearTimeout(timer.current);
    dirty.current = true;
    timer.current = setTimeout(save, 600);
  }

  async function save() {
    timer.current = null;
    const theme = latest.current;
    try {
      await updatePage(page.id, { theme });
      if (latest.current === theme) dirty.current = false;
      setState('saved');
      setError(null);
    } catch (e: any) {
      setState('error');
      setError(e?.message || '저장하지 못했어요');
    }
  }

  // 다른 탭으로 바로 넘어가도 마지막 변경은 저장 / 창을 닫으려 하면 경고
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      if (timer.current) {
        clearTimeout(timer.current);
        updatePage(page.id, { theme: latest.current }).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeSet = STYLE_SETS.find((st) =>
    Object.entries(st.theme).every(([k, v]) => String((theme as any)[k] ?? '').toLowerCase() === String(v).toLowerCase())
  )?.key;

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] lg:gap-14">
      <div className={`min-w-0 ${readOnly ? 'pointer-events-none opacity-60' : ''}`}>
        {/* 사용하는 폰트 미리 불러오기 */}
        {FONTS.filter((f) => f.href).map((f) => (
          // eslint-disable-next-line @next/next/no-page-custom-font
          <link key={f.key} rel="stylesheet" href={f.href} />
        ))}

        <div className="flex items-center justify-between h-6 px-0.5">
          <span className="text-[13px] text-[#8b8b90]">바꾸면 공개 페이지에 바로 적용돼요</span>
          <span className={`text-[12px] font-semibold ${state === 'error' ? 'text-cherry' : 'text-[#3f3f44]'}`}>
            {state === 'saving' ? '저장 중' : state === 'saved' ? '저장됨' : state === 'error' ? '저장 안 됨' : ''}
          </span>
        </div>
        {error && <div className="mt-2 p-3 bg-cherry-soft rounded-xl text-sm text-cherry-dark">{error}</div>}

        <Section title="스타일 세트" desc="하나 고른 다음 아래에서 세부를 바꿔도 돼요">
          <div className="grid grid-cols-3 gap-2.5">
            {STYLE_SETS.map((st) => (
              <StyleSetCard key={st.key} name={st.name} theme={st.theme} on={activeSet === st.key} onClick={() => patch(st.theme)} />
            ))}
          </div>
        </Section>

        <Section title="바탕">
          <Swatches value={theme.bgColor} presets={BG_PRESETS} onPick={(c) => patch({ bgColor: c })} />
          <div className="mt-5">
            <ImageField
              label="바탕 사진"
              hint="선택 · 사진 위에 버튼이 올라가요"
              value={theme.bgImage}
              preset="background"
              shape="wide"
              onChange={(url) => patch({ bgImage: url || undefined })}
            />
          </div>
        </Section>

        <Section title="버튼">
          <Swatches value={theme.primaryColor} presets={BUTTON_PRESETS} onPick={(c) => patch({ primaryColor: c })} />
          <div className="mt-5">
            <Segmented
              label="이 색을 쓸 버튼"
              value={theme.buttonScope || 'highlight'}
              onChange={(v) => patch({ buttonScope: v })}
              options={[
                { value: 'all', label: '모든 버튼' },
                { value: 'highlight', label: '강조한 버튼만' },
              ]}
            />
          </div>
          <div className="mt-5">
            <FieldLabel>모서리</FieldLabel>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ['square', '각지게', 6],
                  ['rounded', '둥글게', 14],
                  ['pill', '알약', 999],
                ] as const
              ).map(([v, l, r]) => {
                const on = theme.buttonShape === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => patch({ buttonShape: v })}
                    aria-pressed={on}
                    className={`h-[72px] rounded-[14px] border-2 flex flex-col items-center justify-center gap-2 transition bl-ring ${
                      on ? 'border-ink bg-white' : 'border-transparent bg-mist'
                    }`}
                  >
                    <span className="w-[70%] h-6" style={{ borderRadius: r, backgroundColor: on ? theme.primaryColor : '#d4d4d8' }} />
                    <span className={`text-[12px] ${on ? 'font-bold text-ink' : 'text-[#8b8b90]'}`}>{l}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-5">
            <Segmented
              label="질감"
              value={theme.buttonStyle || 'fill'}
              onChange={(v) => patch({ buttonStyle: v })}
              options={[
                { value: 'fill', label: '꽉 채우기' },
                { value: 'outline', label: '선만' },
                { value: 'shadow', label: '그림자' },
              ]}
            />
          </div>
        </Section>

        <Section title="글꼴">
          <div className="rounded-[16px] border border-line divide-y divide-line overflow-hidden">
            {FONTS.map((f) => {
              const on = theme.font === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => patch({ font: f.key })}
                  aria-pressed={on}
                  className={`w-full h-14 px-4 flex items-center gap-3 text-left transition ${on ? 'bg-mist' : 'bg-white hover:bg-mist/60'}`}
                >
                  <span className="flex-1 text-[17px] text-ink truncate" style={{ fontFamily: f.family }}>
                    오늘도 반가워요
                  </span>
                  <span className={`text-[12px] ${on ? 'text-ink font-bold' : 'text-[#8b8b90]'}`}>{f.label}</span>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center ${on ? 'bg-cherry text-white' : 'border border-line'}`}>
                    {on && <Check className="w-3 h-3" strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="맨 아래 표시">
          <div className="grid grid-cols-3 gap-2">
            <LogoOption on={(theme.footerLogo || 'bylink') === 'bylink'} onClick={() => patch({ footerLogo: 'bylink' })}>
              <Wordmark size="sm" />
            </LogoOption>
            <LogoOption on={theme.footerLogo === 'custom'} onClick={() => patch({ footerLogo: 'custom' })}>
              <span className="text-[13px] font-bold">내 로고</span>
            </LogoOption>
            <LogoOption on={theme.footerLogo === 'none'} onClick={() => patch({ footerLogo: 'none' })}>
              <span className="text-[13px] font-bold">표시 안 함</span>
            </LogoOption>
          </div>
          {theme.footerLogo === 'custom' && (
            <div className="mt-4">
              <ImageField
                label="로고 이미지"
                hint="바탕이 투명한 PNG가 잘 어울려요"
                value={theme.footerLogoUrl}
                preset="logo"
                onChange={(url) => patch({ footerLogoUrl: url || undefined })}
              />
            </div>
          )}
        </Section>

        {hasProducts && (
          <Section title="상품 검색창">
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-[#3f3f44]">상품 블록 위에 검색창 보이기</span>
              <Toggle size="sm" checked={theme.showSearch !== false} onChange={(v) => patch({ showSearch: v })} />
            </div>
          </Section>
        )}
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-[124px]">
          <PhoneFrame height="calc(100vh - 190px)">
            <PageView page={{ title: page.title, slug: page.slug, theme }} blocks={blocks} framed />
          </PhoneFrame>
          <p className="mt-3 text-center text-[12px] text-[#8b8b90]">고르는 대로 바로 바뀌어요</p>
        </div>
      </aside>

      <div className="lg:hidden fixed left-0 right-0 bottom-[calc(16px+env(safe-area-inset-bottom))] z-30 flex justify-center pointer-events-none">
        <button
          onClick={() => setPreview(true)}
          className="pointer-events-auto h-12 px-5 rounded-full bg-ink text-white text-[14px] font-semibold shadow-[0_8px_24px_rgba(23,23,23,0.28)] flex items-center gap-1.5"
        >
          <Eye className="w-4 h-4" /> 미리보기
        </button>
      </div>

      {preview && (
        <PreviewSheet page={{ title: page.title, slug: page.slug, theme }} blocks={blocks} onClose={() => setPreview(false)} />
      )}
    </div>
  );
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="py-7 border-b border-line last:border-b-0">
      <h2 className="text-[18px] font-extrabold text-ink tracking-tight">{title}</h2>
      {desc && <p className="text-[13px] text-[#8b8b90] mt-1">{desc}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** 스타일 세트 카드: 작은 휴대폰 화면처럼 바탕·버튼·글꼴을 그대로 보여줌 */
function StyleSetCard({ name, theme, on, onClick }: { name: string; theme: Partial<PageTheme>; on: boolean; onClick: () => void }) {
  const t = resolveTheme(theme);
  const radius = t.buttonShape === 'pill' ? 999 : t.buttonShape === 'square' ? 3 : 7;
  const btn = (strong: boolean): React.CSSProperties =>
    t.buttonStyle === 'outline'
      ? { border: `1.5px solid ${t.primaryColor}`, borderRadius: radius }
      : {
          backgroundColor: strong || t.buttonScope === 'all' ? t.primaryColor : '#ffffff',
          borderRadius: radius,
          boxShadow: t.buttonStyle === 'shadow' ? '0 3px 8px rgba(0,0,0,0.12)' : undefined,
        };
  const ink = t.bgColor === '#171717' ? '#ffffff' : '#171717';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`relative rounded-[18px] p-1.5 border-2 transition bl-ring ${on ? 'border-ink' : 'border-transparent hover:border-line'}`}
    >
      <span className="block rounded-[13px] px-3 pt-3.5 pb-3 border border-black/5" style={{ backgroundColor: t.bgColor, fontFamily: getFontFamily(t.font) }}>
        <span className="block mx-auto w-6 h-6 rounded-full" style={{ backgroundColor: ink, opacity: 0.85 }} />
        <span className="block mt-1.5 text-[11px] font-bold text-center" style={{ color: ink }}>
          {name}
        </span>
        <span className="block mt-2 h-3.5" style={btn(true)} />
        <span className="block mt-1.5 h-3.5" style={btn(false)} />
      </span>
      {on && (
        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-cherry text-white flex items-center justify-center ring-2 ring-white">
          <Check className="w-3 h-3" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

function getFontFamily(key?: string) {
  return (FONTS.find((f) => f.key === key) || FONTS[0]).family;
}

function Swatches({ value, presets, onPick }: { value: string; presets: string[]; onPick: (c: string) => void }) {
  const [hex, setHex] = useState(value);
  useEffect(() => setHex(value), [value]);
  const isCustom = !presets.includes((value || '').toLowerCase());
  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        {presets.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onPick(c)}
            aria-label={c}
            className={`w-10 h-10 rounded-full border transition bl-ring ${
              value?.toLowerCase() === c ? 'ring-2 ring-offset-2 ring-ink border-transparent' : 'border-black/10 hover:scale-105'
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-[13px] font-semibold text-[#3f3f44]">직접 고르기</span>
        <label
          className={`relative w-9 h-9 rounded-full border overflow-hidden cursor-pointer ${
            isCustom ? 'ring-2 ring-offset-2 ring-ink border-transparent' : 'border-black/10'
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
          className="w-28 h-9 px-3 rounded-full bg-mist text-[13px] tabular-nums uppercase outline-none focus:bg-white focus:ring-2 focus:ring-ink"
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
      aria-pressed={on}
      className={`h-14 rounded-[14px] border-2 flex items-center justify-center transition bl-ring ${
        on ? 'border-ink bg-white text-ink' : 'border-transparent bg-mist text-[#8b8b90]'
      }`}
    >
      {children}
    </button>
  );
}
