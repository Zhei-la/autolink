'use client';

import { useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, Play } from 'lucide-react';
import type { Block, PageTheme } from '@/types';
import { BlockPreview } from '@/components/blocks/BlockPreview';
import { TrackedLink } from '@/components/blocks/TrackedLink';
import { Wordmark } from '@/components/brand/Logo';
import { buttonLook, getFont, isScheduledVisible, readableOn, resolveTheme, withAlpha } from '@/lib/theme';
import { snsHref, snsMeta } from './icons';
import { normalizeUrl } from '@/lib/url';

type Theme = ReturnType<typeof resolveTheme>;

export interface PageViewProps {
  page: { title?: string; slug?: string; theme?: Partial<PageTheme> | null };
  blocks: Block[];
  /** true = 실제 방문자 화면 (클릭 추적·폼 동작). false = 편집기 미리보기 */
  isPublic?: boolean;
  /** 미리보기용: 폰 프레임 안에서 렌더 (fixed 배경 대신 absolute) */
  framed?: boolean;
}

/**
 * By링크 공개 페이지 렌더러 — 공개 페이지(/p/[slug])와 편집기 미리보기가 같은 화면을 그린다.
 */
export function PageView({ page, blocks, isPublic = false, framed = false }: PageViewProps) {
  const theme = resolveTheme(page.theme);
  const font = getFont(theme.font);
  const ink = readableOn(theme.bgColor);
  const [query, setQuery] = useState('');

  // 보이는 블록만: 켜져 있고(ON) 예약 공개 기간 안에 있는 것
  // 공개 페이지는 서버에서 이미 걸러서 보냄(렌더 중 시간 비교 → 화면 불일치 방지). 미리보기만 여기서 거름
  const visible = useMemo(
    () => blocks.filter((b) => b.is_active !== false && (isPublic || isScheduledVisible(b.data))),
    [blocks, isPublic]
  );
  const profile = visible.find((b) => b.type === 'profile');
  const rest = visible.filter((b) => b.type !== 'profile');
  const hasProducts = rest.some((b) => b.type === 'product_grid');
  const showSearch = hasProducts && theme.showSearch;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rest;
    return rest.filter((b) => blockSearchText(b).toLowerCase().includes(q));
  }, [query, rest]);

  return (
    <div
      className={`${framed ? 'min-h-full' : 'min-h-screen'} relative`}
      style={{ backgroundColor: theme.bgColor, color: ink, fontFamily: font.family }}
    >
      {font.href && (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link rel="stylesheet" href={font.href} />
      )}

      {theme.bgImage && (
        <div
          aria-hidden
          className={`${framed ? 'absolute' : 'fixed'} inset-0 bg-cover bg-center pointer-events-none`}
          style={{ backgroundImage: `url(${theme.bgImage})` }}
        />
      )}

      <div className="relative mx-auto w-full max-w-[480px] px-4 pb-10">
        {profile ? (
          <ProfileView block={profile} theme={theme} ink={ink} />
        ) : (
          <div className="h-8" />
        )}

        <div className="space-y-3">
          {showSearch && (
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50 text-[#111]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="상품명이나 번호를 검색하세요"
                className="w-full h-12 pl-9 pr-4 rounded-2xl border border-black/5 bg-white text-sm text-[#111] outline-none shadow-sm"
              />
            </div>
          )}

          {filtered.length === 0 && query ? (
            <div className="bg-white rounded-2xl p-6 text-center text-sm text-[#888]">검색 결과가 없어요</div>
          ) : (
            filtered.map((block) => (
              <BlockView key={block.id} block={block} theme={theme} ink={ink} isPublic={isPublic} />
            ))
          )}
        </div>

        <Footer theme={theme} ink={ink} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 프로필 (레이아웃 4종)
// ---------------------------------------------------------------------------

function titleClass(size?: string) {
  if (size === 's') return 'text-lg';
  if (size === 'l') return 'text-[26px] leading-tight';
  return 'text-[21px] leading-snug';
}

function ProfileView({ block, theme, ink }: { block: Block; theme: Theme; ink: string }) {
  const d = block.data || {};
  const layout = d.layout || 'circle';
  const name = d.name || '';
  const bio = d.bio || '';
  const img = d.avatarUrl as string | undefined;
  const sub = withAlpha(ink, 0.62);

  if (layout === 'cover' || layout === 'background') {
    const isBg = layout === 'background';
    return (
      <div className="-mx-4 mb-6">
        <div className={`relative w-full ${isBg ? 'aspect-[4/5]' : 'aspect-[5/4]'} overflow-hidden`}>
          {img ? (
            <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0" style={{ backgroundColor: withAlpha(ink, 0.08) }} />
          )}
          {isBg ? (
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0) 35%, rgba(0,0,0,0.65) 100%)' }}
            />
          ) : (
            <div
              className="absolute inset-x-0 bottom-0 h-2/5"
              style={{ background: `linear-gradient(to bottom, ${withAlpha(theme.bgColor, 0)} 0%, ${theme.bgColor} 100%)` }}
            />
          )}
          {isBg && (
            <div className="absolute inset-x-0 bottom-0 px-6 pb-7 text-center text-white">
              <h1 className={`font-bold ${titleClass(d.titleSize)}`}>{name}</h1>
              {bio && <p className="mt-1.5 text-sm text-white/80 whitespace-pre-line">{bio}</p>}
            </div>
          )}
        </div>
        {!isBg && (name || bio) && (
          <div className="relative px-6 -mt-3 text-center">
            <h1 className={`font-semibold ${titleClass(d.titleSize)}`}>{name}</h1>
            {bio && (
              <p className="mt-1.5 text-sm whitespace-pre-line" style={{ color: sub }}>
                {bio}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  const sizePx = layout === 'small' ? 64 : 96;
  return (
    <div className="pt-10 pb-6 text-center">
      {img ? (
        <img
          src={img}
          alt=""
          className="mx-auto rounded-full object-cover mb-4"
          style={{ width: sizePx, height: sizePx }}
        />
      ) : (
        <div
          className="mx-auto rounded-full flex items-center justify-center font-bold mb-4"
          style={{
            width: sizePx,
            height: sizePx,
            backgroundColor: theme.primaryColor,
            color: readableOn(theme.primaryColor),
            fontSize: sizePx * 0.4,
          }}
        >
          {d.initial || name?.[0] || '?'}
        </div>
      )}
      <h1 className={`font-semibold ${titleClass(d.titleSize)}`}>{name}</h1>
      {bio && (
        <p className="mt-1.5 text-sm whitespace-pre-line" style={{ color: sub }}>
          {bio}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 블록 분기
// ---------------------------------------------------------------------------

function BlockView({ block, theme, ink, isPublic }: { block: Block; theme: Theme; ink: string; isPublic: boolean }) {
  switch (block.type) {
    case 'link':
      return <LinkView block={block} theme={theme} isPublic={isPublic} />;
    case 'link_collection':
      return <CollectionView block={block} theme={theme} ink={ink} isPublic={isPublic} />;
    case 'sns':
      return <SnsView block={block} ink={ink} isPublic={isPublic} />;
    case 'video':
      return <VideoView block={block} isPublic={isPublic} />;
    case 'image_banner':
      return <GalleryView block={block} ink={ink} isPublic={isPublic} />;
    case 'spacer':
      return <SpacerView block={block} ink={ink} />;
    case 'text':
      return <TextView block={block} ink={ink} />;
    default:
      // 상품 그리드·문의·달력·이메일 수집은 기존 컴포넌트 사용
      return <BlockPreview block={block} primaryColor={theme.primaryColor} isPublic={isPublic} />;
  }
}

/** 공개 화면에서는 클릭 추적 링크, 미리보기에서는 그냥 div */
function Clickable({
  isPublic,
  blockId,
  url,
  className,
  style,
  children,
}: {
  isPublic: boolean;
  blockId: string;
  url?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const href = normalizeUrl(url);
  if (isPublic && href) {
    return (
      <TrackedLink blockId={blockId} url={href} className={className} style={style}>
        {children}
      </TrackedLink>
    );
  }
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 단일 링크 (카드 3종 + 강조)
// ---------------------------------------------------------------------------

function LinkView({ block, theme, isPublic }: { block: Block; theme: Theme; isPublic: boolean }) {
  const d = block.data || {};
  const size = d.cardSize || 's';
  const look = buttonLook(theme, !!d.highlight);
  const title = d.title || '제목 없음';
  const wide = d.highlight ? '-mx-1.5' : '';
  // 사진이 큰 카드는 알약 모양이면 타원이 되므로 모서리만 크게
  const boxRadius = theme.buttonShape === 'pill' ? 28 : theme.buttonShape === 'square' ? 8 : 18;

  if (size === 'l') {
    return (
      <Clickable
        isPublic={isPublic}
        blockId={block.id}
        url={d.url}
        className={`block relative overflow-hidden transition active:scale-[0.99] ${wide}`}
        style={{ ...look.style, padding: 0, borderRadius: boxRadius }}
      >
        <div className="relative aspect-square w-full">
          {d.thumbnail ? (
            <img src={d.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0" style={{ backgroundColor: withAlpha(theme.primaryColor, 0.12) }} />
          )}
          <div
            className="absolute inset-x-0 bottom-0 p-4 pt-12"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.6))' }}
          >
            <div className="font-bold text-white text-[17px] leading-snug">{title}</div>
          </div>
        </div>
      </Clickable>
    );
  }

  if (size === 'm') {
    return (
      <Clickable
        isPublic={isPublic}
        blockId={block.id}
        url={d.url}
        className={`block overflow-hidden transition active:scale-[0.99] ${wide}`}
        style={{ ...look.style, padding: 0, borderRadius: d.thumbnail ? boxRadius : look.style.borderRadius }}
      >
        {d.thumbnail && (
          <div className="relative aspect-[2/1] w-full">
            <img src={d.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" />
          </div>
        )}
        <div className="px-4 py-4 text-center font-medium text-[15px] leading-snug">{title}</div>
      </Clickable>
    );
  }

  // 작은 카드 (리틀리 기본형): 왼쪽 정사각 썸네일 + 가운데 제목
  return (
    <Clickable
      isPublic={isPublic}
      blockId={block.id}
      url={d.url}
      className={`flex items-center gap-3 transition active:scale-[0.99] ${d.thumbnail ? 'p-2.5' : 'px-4'} ${
        d.highlight ? 'min-h-[76px] ' + wide : 'min-h-[60px]'
      }`}
      style={look.style}
    >
      {d.thumbnail && (
        <img
          src={d.thumbnail}
          alt=""
          className="flex-shrink-0 object-cover"
          style={{
            width: d.highlight ? 60 : 54,
            height: d.highlight ? 60 : 54,
            borderRadius: theme.buttonShape === 'pill' ? 9999 : 12,
          }}
        />
      )}
      <div className={`flex-1 min-w-0 text-center font-medium text-[15px] leading-snug py-3 ${d.thumbnail ? 'pr-[54px]' : ''}`}>
        <span className="line-clamp-2">{title}</span>
      </div>
    </Clickable>
  );
}

// ---------------------------------------------------------------------------
// 그룹 링크 (배치 5종 + 접기)
// ---------------------------------------------------------------------------

function CollectionView({ block, theme, ink, isPublic }: { block: Block; theme: Theme; ink: string; isPublic: boolean }) {
  const d = block.data || {};
  const items: any[] = (d.links || []).filter((l: any) => l && (l.title || l.thumbnail || l.url));
  const layout = d.layout || 'list';
  const [open, setOpen] = useState(false);
  const limit = 3;
  const collapsed = !!d.collapse && !open && items.length > limit && (layout === 'list' || layout.startsWith('grid'));
  const shown = collapsed ? items.slice(0, limit) : items;
  const look = buttonLook(theme, !!d.highlight);
  const radius = theme.buttonShape === 'pill' ? 20 : theme.buttonShape === 'square' ? 8 : 16;

  if (items.length === 0) {
    return isPublic ? null : (
      <div className="rounded-2xl border border-dashed p-5 text-center text-sm" style={{ borderColor: withAlpha(ink, 0.2), color: withAlpha(ink, 0.5) }}>
        그룹 링크에 링크를 추가해주세요
      </div>
    );
  }

  const header = d.title ? (
    <div className="text-[15px] font-bold mb-2 px-1">{d.title}</div>
  ) : null;

  const more = collapsed ? (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="mt-2 w-full h-10 inline-flex items-center justify-center gap-1 text-sm font-semibold rounded-xl"
      style={{ color: withAlpha(ink, 0.7) }}
    >
      더보기 ({items.length - limit}) <ChevronDown className="w-4 h-4" />
    </button>
  ) : null;

  if (layout === 'carousel1' || layout === 'carousel2') {
    const basis = layout === 'carousel1' ? '86%' : '46%';
    return (
      <div>
        {header}
        <div className="-mx-4 px-4 scroll-px-4 flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((it) => (
            <Clickable
              key={it.id}
              isPublic={isPublic}
              blockId={block.id}
              url={it.url}
              className="snap-start flex-shrink-0 overflow-hidden bg-white text-[#111]"
              style={{ flexBasis: basis, borderRadius: radius, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
            >
              <div className={`relative w-full ${layout === 'carousel1' ? 'aspect-[16/10]' : 'aspect-square'}`}>
                {it.thumbnail ? (
                  <img src={it.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0" style={{ backgroundColor: withAlpha(theme.primaryColor, 0.1) }} />
                )}
              </div>
              <div className="px-3 py-2.5 text-[13px] font-semibold leading-snug line-clamp-2">{it.title}</div>
            </Clickable>
          ))}
          <div className="flex-shrink-0 w-px" aria-hidden />
        </div>
      </div>
    );
  }

  if (layout === 'grid2' || layout === 'grid3') {
    return (
      <div>
        {header}
        <div className={`grid gap-2.5 ${layout === 'grid2' ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {shown.map((it) => (
            <Clickable
              key={it.id}
              isPublic={isPublic}
              blockId={block.id}
              url={it.url}
              className="block overflow-hidden bg-white text-[#111]"
              style={{ borderRadius: radius, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
            >
              <div className="relative aspect-square w-full">
                {it.thumbnail ? (
                  <img src={it.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0" style={{ backgroundColor: withAlpha(theme.primaryColor, 0.1) }} />
                )}
              </div>
              <div className={`px-2.5 py-2 font-semibold leading-snug line-clamp-2 ${layout === 'grid3' ? 'text-[12px]' : 'text-[13px]'}`}>
                {it.title}
              </div>
            </Clickable>
          ))}
        </div>
        {more}
      </div>
    );
  }

  // 기본 배치: 세로 목록 (단일 링크 작은 카드와 같은 모양)
  return (
    <div>
      {header}
      <div className="space-y-2.5">
        {shown.map((it) => (
          <Clickable
            key={it.id}
            isPublic={isPublic}
            blockId={block.id}
            url={it.url}
            className={`flex items-center gap-3 min-h-[56px] transition active:scale-[0.99] ${it.thumbnail ? 'p-2' : 'px-4'}`}
            style={look.style}
          >
            {it.thumbnail && (
              <img src={it.thumbnail} alt="" className="w-11 h-11 rounded-[10px] object-cover flex-shrink-0" />
            )}
            <div className={`flex-1 min-w-0 text-center text-[14px] font-medium py-2.5 ${it.thumbnail ? 'pr-11' : ''}`}>
              <span className="line-clamp-2">{it.title}</span>
            </div>
          </Clickable>
        ))}
      </div>
      {more}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SNS 아이콘 줄
// ---------------------------------------------------------------------------

function SnsView({ block, ink, isPublic }: { block: Block; ink: string; isPublic: boolean }) {
  const links: any[] = (block.data?.links || []).filter((l: any) => l?.url);
  if (links.length === 0) {
    return isPublic ? null : (
      <div className="text-center text-sm py-2" style={{ color: withAlpha(ink, 0.5) }}>
        SNS를 추가해주세요
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5 py-1">
      {links.map((l, i) => {
        const meta = snsMeta(l.platform);
        const Icon = meta.Icon;
        const href = snsHref(l.platform, l.url);
        const inner = <Icon className="w-[22px] h-[22px]" />;
        const cls = 'w-11 h-11 rounded-full flex items-center justify-center transition hover:scale-105';
        const style = { color: ink, backgroundColor: withAlpha(ink, 0.06) };
        return isPublic ? (
          <a
            key={i}
            href={href}
            target={href.startsWith('http') ? '_blank' : undefined}
            rel="noopener"
            aria-label={meta.label}
            className={cls}
            style={style}
          >
            {inner}
          </a>
        ) : (
          <span key={i} className={cls} style={style} aria-label={meta.label}>
            {inner}
          </span>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 동영상
// ---------------------------------------------------------------------------

export function youtubeId(url: string): string | null {
  if (!url) return null;
  const m =
    url.match(/youtu\.be\/([\w-]{6,})/) ||
    url.match(/youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)([\w-]{6,})/);
  return m ? m[1] : null;
}

function VideoView({ block, isPublic }: { block: Block; isPublic: boolean }) {
  const d = block.data || {};
  const id = youtubeId(d.url || '');
  const isShorts = /youtube\.com\/shorts\//.test(d.url || '');
  const isFile = /\.(mp4|webm|mov)(\?|$)/i.test(d.url || '');
  // 방문자 화면에서는 주소가 없거나 잘못된 영상 블록을 숨김
  if (isPublic && !id && !isFile) return null;

  return (
    <div>
      {d.title && <div className="text-[15px] font-bold mb-2 px-1">{d.title}</div>}
      {id ? (
        <div className={`relative w-full overflow-hidden rounded-2xl bg-black ${isShorts ? 'aspect-[9/16] max-w-[300px] mx-auto' : 'aspect-video'}`}>
          <iframe
            src={`https://www.youtube.com/embed/${id}?rel=0&playsinline=1`}
            title={d.title || '동영상'}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      ) : /\.(mp4|webm|mov)(\?|$)/i.test(d.url || '') ? (
        <video src={d.url} controls playsInline className="w-full rounded-2xl bg-black" />
      ) : (
        <div className="aspect-video rounded-2xl bg-black/5 flex flex-col items-center justify-center gap-2 text-sm text-[#888]">
          <Play className="w-8 h-8" />
          유튜브 주소를 넣어주세요
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 갤러리 (한 장씩 / 슬라이드 / 2열)
// ---------------------------------------------------------------------------

function GalleryView({ block, ink, isPublic }: { block: Block; ink: string; isPublic: boolean }) {
  const d = block.data || {};
  const images: any[] = (d.images || []).filter((i: any) => i?.url);
  const layout = d.layout || 'single';
  const ratio = d.ratio === 'wide' ? 'aspect-[16/10]' : d.ratio === 'tall' ? 'aspect-[4/5]' : 'aspect-square';
  const [idx, setIdx] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);

  if (images.length === 0) {
    return isPublic ? null : (
      <div className="rounded-2xl border border-dashed p-5 text-center text-sm" style={{ borderColor: withAlpha(ink, 0.2), color: withAlpha(ink, 0.5) }}>
        갤러리에 사진을 추가해주세요
      </div>
    );
  }

  const img = (im: any, cls: string) => {
    const pic = <img src={im.url} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />;
    return im.link ? (
      <Clickable isPublic={isPublic} blockId={block.id} url={im.link} className={`relative block overflow-hidden ${cls}`}>
        {pic}
      </Clickable>
    ) : (
      <div className={`relative overflow-hidden ${cls}`}>{pic}</div>
    );
  };

  const title = d.title ? <div className="text-[15px] font-bold mb-2 px-1">{d.title}</div> : null;

  if (layout === 'slide') {
    return (
      <div>
        {title}
        <div
          ref={scroller}
          onScroll={(e) => {
            const el = e.currentTarget;
            setIdx(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
          }}
          className="flex overflow-x-auto snap-x snap-mandatory rounded-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((im) => (
            <div key={im.id} className="snap-start flex-shrink-0 w-full">
              {img(im, `${ratio} w-full`)}
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-2.5">
            {images.map((im, i) => (
              <span
                key={im.id}
                className="h-1.5 rounded-full transition-all"
                style={{ width: i === idx ? 16 : 6, backgroundColor: withAlpha(ink, i === idx ? 0.8 : 0.25) }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (layout === 'grid2') {
    return (
      <div>
        {title}
        <div className="grid grid-cols-2 gap-2">
          {images.map((im) => (
            <div key={im.id}>{img(im, 'aspect-square w-full rounded-xl')}</div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {title}
      <div className="space-y-2">
        {images.map((im) => (
          <div key={im.id}>{img(im, `${ratio} w-full rounded-2xl`)}</div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 여백 · 텍스트
// ---------------------------------------------------------------------------

function SpacerView({ block, ink }: { block: Block; ink: string }) {
  const d = block.data || {};
  const h = d.size === 's' ? 8 : d.size === 'l' ? 48 : 24;
  return (
    <div style={{ height: h }} className="flex items-center">
      {d.line && <div className="w-full h-px" style={{ backgroundColor: withAlpha(ink, 0.15) }} />}
    </div>
  );
}

function TextView({ block, ink }: { block: Block; ink: string }) {
  const d = block.data || {};
  const align = d.align === 'left' ? 'text-left' : 'text-center';
  if (d.variant === 'divider') return <div className="h-px my-2" style={{ backgroundColor: withAlpha(ink, 0.15) }} />;
  if (d.variant === 'heading') {
    return <h2 className={`font-bold text-lg pt-3 pb-1 px-1 ${align}`}>{d.text}</h2>;
  }
  return (
    <p className={`text-sm leading-relaxed whitespace-pre-wrap px-1 ${align}`} style={{ color: withAlpha(ink, 0.75) }}>
      {d.text}
    </p>
  );
}

// ---------------------------------------------------------------------------
// 하단 로고
// ---------------------------------------------------------------------------

function Footer({ theme, ink }: { theme: Theme; ink: string }) {
  if (theme.footerLogo === 'none') return <div className="h-10" />;
  if (theme.footerLogo === 'custom' && theme.footerLogoUrl) {
    return (
      <div className="mt-12 flex justify-center">
        <img src={theme.footerLogoUrl} alt="" className="max-h-12 max-w-[200px] object-contain" />
      </div>
    );
  }
  return (
    <div className="mt-12 flex justify-center">
      <a href={`${process.env.NEXT_PUBLIC_LOUNGE_URL || 'https://byranmedia.com'}/bylink`} className="inline-flex items-center gap-1.5 text-[11px] opacity-60 hover:opacity-100 transition" style={{ color: ink }}>
        <span>made with</span>
        <Wordmark size="sm" />
      </a>
    </div>
  );
}

// ---------------------------------------------------------------------------

function blockSearchText(block: any): string {
  const d = block.data || {};
  if (block.type === 'product_grid') {
    return (d.products || [])
      .map((p: any) => [p.title, p.name, p.code, p.number, p.id, p.price, p.url, p.description].filter(Boolean).join(' '))
      .join(' ');
  }
  if (block.type === 'link_collection') {
    return [d.title, ...(d.links || []).map((l: any) => l.title)].filter(Boolean).join(' ');
  }
  return [d.title, d.name, d.bio, d.text, d.description, d.buttonText, d.url].filter(Boolean).join(' ');
}
