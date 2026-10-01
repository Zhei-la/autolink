import { createHash } from 'crypto';

/**
 * 방문/클릭 추적용 공통 유틸 (서버 전용 — Route Handler에서 사용)
 *
 * - visitor_hash : IP + User-Agent + 날짜(KST) 를 SHA-256 한 값. 쿠키 없이 "그날의 순 방문자"를 셈.
 *                  개인정보(IP)는 저장하지 않고 해시만 저장.
 * - referrer_source : referrer 도메인을 인스타/스레드/유튜브/네이버/카카오/직접유입/기타 로 분류
 * - device_type / inapp : User-Agent 판별
 */

export type ReferrerSource =
  | 'instagram' | 'threads' | 'youtube' | 'naver' | 'kakao'
  | 'facebook' | 'tiktok' | 'google' | 'direct' | 'other';

export interface VisitMeta {
  visitorHash: string;
  referrer: string | null;
  referrerSource: ReferrerSource;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  deviceType: 'mobile' | 'pc';
  isInapp: boolean;
  inappApp: string | null;
  userAgent: string;
}

const SALT = process.env.TRACKING_SALT || 'autolink-default-salt';

function kstDateKey(): string {
  // KST(UTC+9) 기준 날짜 — 자정 넘어가면 같은 사람이라도 다른 방문자로 셈
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

export function getClientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return headers.get('x-real-ip') || '0.0.0.0';
}

export function makeVisitorHash(ip: string, ua: string): string {
  return createHash('sha256')
    .update(`${SALT}|${ip}|${ua}|${kstDateKey()}`)
    .digest('hex')
    .slice(0, 32);
}

export function classifyReferrer(referrer: string | null, utmSource: string | null): ReferrerSource {
  const key = (utmSource || '').toLowerCase();
  if (key) {
    if (key.includes('insta')) return 'instagram';
    if (key.includes('thread')) return 'threads';
    if (key.includes('youtube') || key === 'yt') return 'youtube';
    if (key.includes('naver') || key.includes('blog')) return 'naver';
    if (key.includes('kakao')) return 'kakao';
    if (key.includes('facebook') || key === 'fb') return 'facebook';
    if (key.includes('tiktok')) return 'tiktok';
  }

  if (!referrer) return 'direct';

  let host = '';
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return 'other';
  }

  if (host.includes('instagram.com')) return 'instagram';
  if (host.includes('threads.net') || host.includes('threads.com')) return 'threads';
  if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube';
  if (host.includes('naver.com') || host.includes('naver.me')) return 'naver';
  if (host.includes('kakao.com') || host.includes('kakao.io')) return 'kakao';
  if (host.includes('facebook.com') || host.includes('fb.com')) return 'facebook';
  if (host.includes('tiktok.com')) return 'tiktok';
  if (host.includes('google.')) return 'google';
  if (host.includes('l.instagram.com')) return 'instagram';
  return 'other';
}

export function parseUserAgent(ua: string): {
  deviceType: 'mobile' | 'pc';
  isInapp: boolean;
  inappApp: string | null;
} {
  const s = ua || '';
  const deviceType: 'mobile' | 'pc' =
    /Mobile|Android|iPhone|iPad|iPod/i.test(s) ? 'mobile' : 'pc';

  let inappApp: string | null = null;
  if (/Instagram/i.test(s)) inappApp = 'instagram';
  else if (/Barcelona/i.test(s)) inappApp = 'threads'; // Threads 앱 UA 식별자
  else if (/KAKAOTALK/i.test(s)) inappApp = 'kakao';
  else if (/NAVER\(inapp/i.test(s)) inappApp = 'naver';
  else if (/FBAN|FBAV|FB_IAB/i.test(s)) inappApp = 'facebook';
  else if (/Line\//i.test(s)) inappApp = 'line';
  else if (/TikTok|musical_ly|Bytedance/i.test(s)) inappApp = 'tiktok';

  return { deviceType, isInapp: inappApp !== null, inappApp };
}

/**
 * Route Handler 안에서 요청 헤더 + 클라이언트가 보낸 값으로 VisitMeta 조립.
 * referrer/utm 은 클라이언트(document.referrer, location.search)에서 넘겨받는 값을 우선 사용.
 */
export function buildVisitMeta(
  headers: Headers,
  client: { referrer?: string | null; utm_source?: string | null; utm_medium?: string | null; utm_campaign?: string | null }
): VisitMeta {
  const ua = headers.get('user-agent') || '';
  const ip = getClientIp(headers);
  const referrer = (client.referrer || headers.get('referer') || '').slice(0, 500) || null;
  const utmSource = client.utm_source?.slice(0, 100) || null;
  const utmMedium = client.utm_medium?.slice(0, 100) || null;
  const utmCampaign = client.utm_campaign?.slice(0, 100) || null;
  const { deviceType, isInapp, inappApp } = parseUserAgent(ua);

  return {
    visitorHash: makeVisitorHash(ip, ua),
    referrer,
    referrerSource: classifyReferrer(referrer, utmSource),
    utmSource,
    utmMedium,
    utmCampaign,
    deviceType,
    isInapp,
    inappApp,
    userAgent: ua,
  };
}

/** 검색엔진 봇·미리보기 크롤러는 방문으로 안 셈 */
export function isBot(ua: string): boolean {
  return /bot|crawler|spider|crawling|facebookexternalhit|Twitterbot|Slackbot|Discordbot|kakaotalk-scrap|WhatsApp|TelegramBot|preview|HeadlessChrome|Lighthouse/i.test(ua || '');
}

/** 외부 링크에 ?ref=bylink&block=... 붙이기 (도착 페이지에서 전환 추적할 수 있게) */
export function appendRefParams(url: string, blockId: string): string {
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return url;
    if (!u.searchParams.has('ref')) u.searchParams.set('ref', 'bylink');
    if (!u.searchParams.has('block')) u.searchParams.set('block', blockId);
    return u.toString();
  } catch {
    return url;
  }
}
