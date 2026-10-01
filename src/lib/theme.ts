import type { CSSProperties } from 'react';
import type { FontKey, PageTheme } from '@/types';
import { DEFAULT_THEME } from '@/types';

/** 한글 웹폰트 목록 (디자인 탭에서 고름) */
export const FONTS: { key: FontKey; label: string; family: string; href?: string }[] = [
  { key: 'pretendard', label: '프리텐다드', family: "'Pretendard', system-ui, sans-serif" },
  {
    key: 'noto',
    label: '본고딕',
    family: "'Noto Sans KR', sans-serif",
    href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap',
  },
  {
    key: 'nanum',
    label: '나눔고딕',
    family: "'Nanum Gothic', sans-serif",
    href: 'https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700;800&display=swap',
  },
  {
    key: 'serif',
    label: '나눔명조',
    family: "'Nanum Myeongjo', serif",
    href: 'https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&display=swap',
  },
  {
    key: 'gowun-dodum',
    label: '고운돋움',
    family: "'Gowun Dodum', sans-serif",
    href: 'https://fonts.googleapis.com/css2?family=Gowun+Dodum&display=swap',
  },
  {
    key: 'gowun-batang',
    label: '고운바탕',
    family: "'Gowun Batang', serif",
    href: 'https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&display=swap',
  },
  {
    key: 'ibm',
    label: 'IBM 플렉스',
    family: "'IBM Plex Sans KR', sans-serif",
    href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;600;700&display=swap',
  },
  {
    key: 'do-hyeon',
    label: '도현',
    family: "'Do Hyeon', sans-serif",
    href: 'https://fonts.googleapis.com/css2?family=Do+Hyeon&display=swap',
  },
  {
    key: 'jua',
    label: '주아',
    family: "'Jua', sans-serif",
    href: 'https://fonts.googleapis.com/css2?family=Jua&display=swap',
  },
];

export function getFont(key?: string) {
  return FONTS.find((f) => f.key === key) || FONTS[0];
}

/** 저장된 theme 을 기본값과 합쳐 항상 완전한 형태로 */
export function resolveTheme(theme: Partial<PageTheme> | null | undefined): Required<
  Omit<PageTheme, 'bgImage' | 'footerLogoUrl'>
> & Pick<PageTheme, 'bgImage' | 'footerLogoUrl'> {
  const t = { ...DEFAULT_THEME, ...(theme || {}) } as PageTheme;
  return {
    primaryColor: normalizeHex(t.primaryColor) || DEFAULT_THEME.primaryColor,
    bgColor: normalizeHex(t.bgColor) || DEFAULT_THEME.bgColor,
    font: t.font || 'pretendard',
    buttonShape: t.buttonShape || 'rounded',
    bgImage: t.bgImage || undefined,
    // 예전 페이지(오토링크 시절)는 포인트 색이 모든 버튼에 들어가지 않았으므로 기본은 '강조만'
    buttonScope: t.buttonScope || 'highlight',
    buttonStyle: t.buttonStyle || 'fill',
    footerLogo: t.footerLogo || 'bylink',
    footerLogoUrl: t.footerLogoUrl || undefined,
    showSearch: t.showSearch ?? true,
  };
}

export function normalizeHex(v?: string | null): string | null {
  if (!v) return null;
  const s = v.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(s)) {
    return ('#' + s.slice(1).split('').map((c) => c + c).join('')).toLowerCase();
  }
  return null;
}

/** 배경색 위에 올릴 글자색 (밝은 배경 → 검정, 어두운 배경 → 흰색) */
export function readableOn(hex: string): string {
  const h = normalizeHex(hex) || '#ffffff';
  const r = parseInt(h.slice(1, 3), 16) / 255;
  const g = parseInt(h.slice(3, 5), 16) / 255;
  const b = parseInt(h.slice(5, 7), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return L > 0.45 ? '#111111' : '#ffffff';
}

/** hex + 투명도 → rgba */
export function withAlpha(hex: string, alpha: number): string {
  const h = normalizeHex(hex) || '#000000';
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function shapeRadius(shape: PageTheme['buttonShape']): string {
  if (shape === 'square') return '8px';
  if (shape === 'pill') return '9999px';
  return '18px';
}

/** 버튼(링크 카드) 모양 계산. highlight = 블록의 강조(별) 여부 */
export function buttonLook(theme: ReturnType<typeof resolveTheme>, highlight: boolean) {
  const colored = highlight || theme.buttonScope === 'all';
  const radius = shapeRadius(theme.buttonShape);
  const base = colored ? theme.primaryColor : '#ffffff';
  const text = readableOn(base);

  if (theme.buttonStyle === 'outline') {
    const line = colored ? theme.primaryColor : readableOn(theme.bgColor) === '#ffffff' ? '#ffffff' : '#111111';
    return {
      radius,
      style: {
        backgroundColor: colored ? withAlpha(theme.primaryColor, 0.08) : 'transparent',
        color: readableOn(theme.bgColor) === '#ffffff' && !colored ? '#ffffff' : '#111111',
        border: `1.5px solid ${line}`,
        borderRadius: radius,
      } as CSSProperties,
      colored,
    };
  }

  return {
    radius,
    style: {
      backgroundColor: base,
      color: text,
      border: colored ? `1px solid ${base}` : '1px solid rgba(0,0,0,0.06)',
      borderRadius: radius,
      boxShadow:
        theme.buttonStyle === 'shadow'
          ? '0 6px 18px rgba(0,0,0,0.10)'
          : '0 1px 2px rgba(0,0,0,0.04)',
    } as CSSProperties,
    colored,
  };
}

/** 예약 공개: 지금 보여야 하는 블록인지 */
export function isScheduledVisible(data: any, now: number = Date.now()): boolean {
  const from = data?.visibleFrom ? Date.parse(data.visibleFrom) : NaN;
  const until = data?.visibleUntil ? Date.parse(data.visibleUntil) : NaN;
  if (!Number.isNaN(from) && now < from) return false;
  if (!Number.isNaN(until) && now > until) return false;
  return true;
}

/**
 * 공개 주소. NEXT_PUBLIC_PUBLIC_HOST(예: link.byranmedia.com)가 있으면 짧은 주소,
 * 없으면 지금 서버의 /p/<slug>.
 */
export function publicPath(slug: string): string {
  return `/p/${slug}`;
}

export function publicUrl(slug: string, origin?: string): string {
  const host = process.env.NEXT_PUBLIC_PUBLIC_HOST;
  if (host) return `https://${host}/${slug}`;
  const base = origin || process.env.NEXT_PUBLIC_SITE_URL || '';
  return `${base.replace(/\/$/, '')}/p/${slug}`;
}

/** 화면에 보여줄 짧은 주소 (https:// 생략) */
export function publicUrlLabel(slug: string, origin?: string): string {
  return publicUrl(slug, origin).replace(/^https?:\/\//, '');
}
