/**
 * 사용자가 넣은 링크 주소 정리.
 * - 'naver.com' 처럼 https:// 없이 넣어도 동작하게 https:// 를 붙임
 * - http(s) · tel · mailto 만 허용 (javascript: 같은 건 버림)
 */
export function normalizeUrl(raw?: string | null): string {
  const v = (raw || '').trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  if (/^(tel|mailto):/i.test(v)) return v;
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return ''; // 그 밖의 스킴은 막음
  if (v.startsWith('//')) return `https:${v}`;
  return `https://${v.replace(/^\/+/, '')}`;
}
