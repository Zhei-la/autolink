/** 분석 탭 기간 */
export type RangeKey = 'today' | '7d' | '30d' | '90d' | '180d' | 'all' | 'custom';

export const RANGE_LABEL: Record<RangeKey, string> = {
  today: '오늘',
  '7d': '일주일',
  '30d': '1개월',
  '90d': '3개월',
  '180d': '6개월',
  all: '전체기간',
  custom: '직접 입력',
};

const KST = 9 * 60 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

/** 한국 날짜 'YYYY-MM-DD' */
export function kstDay(ts: number | string | Date): string {
  const t = typeof ts === 'number' ? ts : new Date(ts).getTime();
  return new Date(t + KST).toISOString().slice(0, 10);
}

/** 한국 날짜 'YYYY-MM-DD' 의 0시(한국)를 UTC ms 로 */
export function kstStartOf(day: string): number {
  return Date.parse(`${day}T00:00:00+09:00`);
}

export function resolveRange(
  key: string | undefined,
  from?: string,
  to?: string,
  firstSeen?: string
): { key: RangeKey; startMs: number; endMs: number; days: string[] } {
  const now = Date.now();
  const today = kstDay(now);
  const k = (Object.keys(RANGE_LABEL) as RangeKey[]).includes(key as RangeKey) ? (key as RangeKey) : '7d';

  let startDay = today;
  let endDay = today;
  if (k === 'today') startDay = today;
  else if (k === 'all') startDay = firstSeen ? kstDay(firstSeen) : kstDay(now - 29 * DAY);
  else if (k === 'custom') {
    const valid = (v?: string) => /^\d{4}-\d{2}-\d{2}$/.test(v || '') && Number.isFinite(kstStartOf(v as string));
    const okF = valid(from);
    const okT = valid(to);
    startDay = okF ? (from as string) : kstDay(now - 6 * DAY);
    endDay = okT ? (to as string) : today;
    if (startDay > endDay) [startDay, endDay] = [endDay, startDay];
  } else {
    const n = { '7d': 8, '30d': 30, '90d': 90, '180d': 180 }[k as '7d' | '30d' | '90d' | '180d'];
    startDay = kstDay(now - (n - 1) * DAY); // 일주일 = 지난 7일 + 오늘 (리틀리와 같게)
  }

  // 최대 400일 — 합계와 그래프 기간이 같도록 시작일을 당김
  const MAX_DAYS = 400;
  if ((kstStartOf(endDay) - kstStartOf(startDay)) / DAY >= MAX_DAYS) {
    startDay = kstDay(kstStartOf(endDay) - (MAX_DAYS - 1) * DAY);
  }
  const days: string[] = [];
  let cur = kstStartOf(startDay);
  const last = kstStartOf(endDay);
  while (cur <= last && days.length < MAX_DAYS) {
    days.push(kstDay(cur));
    cur += DAY;
  }
  return { key: k, startMs: kstStartOf(startDay), endMs: kstStartOf(endDay) + DAY - 1, days };
}


export function hostOf(referrer?: string | null): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

export const SOURCE_LABEL: Record<string, string> = {
  instagram: '인스타그램',
  threads: '스레드',
  youtube: '유튜브',
  naver: '네이버',
  kakao: '카카오',
  facebook: '페이스북',
  tiktok: '틱톡',
  google: '구글',
  direct: '직접 유입',
  other: '기타',
};

export const INAPP_LABEL: Record<string, string> = {
  instagram: '인스타 앱',
  threads: '스레드 앱',
  kakao: '카카오톡',
  naver: '네이버 앱',
  facebook: '페이스북 앱',
  line: '라인',
  tiktok: '틱톡 앱',
};

export function classifyHost(host: string | null): string {
  if (!host) return 'direct';
  if (host.includes('instagram')) return 'instagram';
  if (host.includes('threads')) return 'threads';
  if (host.includes('youtube') || host.includes('youtu.be')) return 'youtube';
  if (host.includes('naver')) return 'naver';
  if (host.includes('kakao')) return 'kakao';
  if (host.includes('facebook') || host === 'fb.com') return 'facebook';
  if (host.includes('tiktok')) return 'tiktok';
  if (host.includes('google')) return 'google';
  return 'other';
}

export function deviceFromUA(ua?: string | null): 'mobile' | 'pc' {
  return /Mobile|Android|iPhone|iPad|iPod/i.test(ua || '') ? 'mobile' : 'pc';
}
