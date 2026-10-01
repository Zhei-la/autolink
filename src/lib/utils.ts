import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind 클래스를 안전하게 합쳐주는 유틸.
 * 사용 예: cn('px-4 py-2', isActive && 'bg-primary')
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * URL 슬러그를 생성. 한글/특수문자는 영문/숫자/하이픈만 남김.
 */
export function toSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
}

/**
 * 슬러그(페이지 아이디)가 유효한지 검증.
 * 영문 소문자/숫자/하이픈/밑줄/마침표, 3~30자 (리틀리 아이디 daegeon_dnc, byran.mk 그대로 옮길 수 있게).
 * ※ 밑줄·마침표는 DB 마이그레이션 002 적용 후 저장 가능.
 */
export const SLUG_PATTERN = '[a-z0-9_.\\-]{3,30}';
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9_.-]{3,30}$/.test(slug) && !/^[._-]|[._-]$/.test(slug) && !slug.includes('..');
}

/** 공개 주소 첫 칸으로 쓸 수 없는 예약어 */
export const RESERVED_SLUGS = new Set([
  'p', 'api', 'admin', 'login', 'logout', 'dashboard', 'edit', 'auth', 'stats', 'settings',
  'design', 'manage', '_next', 'favicon.ico', 'robots.txt', 'sitemap.xml',
]);

/**
 * 가격 포맷 (1234567 -> "1,234,567원")
 */
export function formatPrice(price: number): string {
  return price.toLocaleString('ko-KR') + '원';
}
