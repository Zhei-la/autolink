import {
  Instagram,
  Youtube,
  Twitter,
  Facebook,
  Phone,
  Mail,
  Globe,
  MessageCircle,
  Music2,
  AtSign,
  BookOpen,
} from 'lucide-react';
import type { SnsPlatform } from '@/types';

export const SNS_PLATFORMS: {
  value: SnsPlatform;
  label: string;
  placeholder: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}[] = [
  { value: 'instagram', label: '인스타그램', placeholder: '아이디 또는 URL', Icon: Instagram },
  { value: 'threads', label: '스레드', placeholder: '아이디 또는 URL', Icon: AtSign },
  { value: 'youtube', label: '유튜브', placeholder: '채널 URL', Icon: Youtube },
  { value: 'blog', label: '블로그', placeholder: '블로그 URL', Icon: BookOpen },
  { value: 'kakao', label: '카카오톡', placeholder: '오픈채팅·채널 URL', Icon: MessageCircle },
  { value: 'tiktok', label: '틱톡', placeholder: '아이디 또는 URL', Icon: Music2 },
  { value: 'facebook', label: '페이스북', placeholder: 'URL', Icon: Facebook },
  { value: 'twitter', label: 'X(트위터)', placeholder: '아이디 또는 URL', Icon: Twitter },
  { value: 'phone', label: '전화', placeholder: '010-0000-0000', Icon: Phone },
  { value: 'email', label: '이메일', placeholder: 'name@example.com', Icon: Mail },
  { value: 'website', label: '웹사이트', placeholder: 'https://', Icon: Globe },
];

export function snsMeta(platform: string) {
  return SNS_PLATFORMS.find((p) => p.value === platform) || SNS_PLATFORMS[SNS_PLATFORMS.length - 1];
}

/** 아이디만 넣어도 동작하도록 플랫폼별 주소로 바꿈 */
export function snsHref(platform: string, raw: string): string {
  const v = (raw || '').trim();
  if (!v) return '#';
  if (platform === 'phone') return `tel:${v.replace(/[^0-9+]/g, '')}`;
  if (platform === 'email') return `mailto:${v}`;
  if (/^https?:\/\//i.test(v)) return v;
  const id = v.replace(/^@/, '');
  switch (platform) {
    case 'instagram':
      return `https://instagram.com/${id}`;
    case 'threads':
      return `https://www.threads.net/@${id}`;
    case 'tiktok':
      return `https://www.tiktok.com/@${id}`;
    case 'twitter':
      return `https://x.com/${id}`;
    case 'youtube':
      return `https://www.youtube.com/@${id}`;
    default:
      return `https://${v}`;
  }
}
