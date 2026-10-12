import {
  Link2,
  Link,
  Share2,
  PlayCircle,
  Type,
  Images,
  MoveVertical,
  ShoppingBag,
  MessageSquareText,
  CalendarDays,
  Mail,
  UserRound,
} from 'lucide-react';
import type { BlockType } from '@/types';

export interface BlockTypeMeta {
  type: BlockType;
  label: string;
  desc: string;
  Icon: React.ComponentType<{ className?: string }>;
  /** show = 페이지에 보여줄 것, receive = 방문자에게 받을 것 */
  category: 'show' | 'receive' | 'none';
  /** 마이그레이션 001 이 있어야 저장되는 타입 */
  needs001?: boolean;
  /** 강조 지원 */
  canHighlight?: boolean;
}

/** By링크 블록 이름 — 보는 사람이 바로 알아듣는 말로 */
export const BLOCK_TYPES: BlockTypeMeta[] = [
  { type: 'profile', label: '프로필', desc: '이름, 사진, 한 줄 소개', Icon: UserRound, category: 'none' },
  { type: 'link', label: '버튼', desc: '누르면 원하는 곳으로 이동', Icon: Link2, category: 'show', canHighlight: true },
  { type: 'link_collection', label: '버튼 묶음', desc: '버튼 여러 개를 목록·격자·슬라이드로', Icon: Link, category: 'show', needs001: true, canHighlight: true },
  { type: 'image_banner', label: '사진', desc: '사진 한 장부터 여러 장까지', Icon: Images, category: 'show', needs001: true },
  { type: 'video', label: '영상', desc: '유튜브 영상을 페이지에서 바로 재생', Icon: PlayCircle, category: 'show', needs001: true },
  { type: 'text', label: '글', desc: '제목, 안내 문구, 구분선', Icon: Type, category: 'show' },
  { type: 'sns', label: 'SNS 아이콘', desc: '인스타·유튜브·블로그 아이콘 한 줄', Icon: Share2, category: 'show' },
  { type: 'product_grid', label: '상품', desc: '사진과 가격으로 상품 소개', Icon: ShoppingBag, category: 'show' },
  { type: 'calendar', label: '일정', desc: '날짜와 D-day 알림', Icon: CalendarDays, category: 'show' },
  { type: 'spacer', label: '간격', desc: '블록 사이를 띄워요', Icon: MoveVertical, category: 'show', needs001: true },
  { type: 'inquiry', label: '문의 받기', desc: '방문자가 항목을 골라 문의를 남겨요', Icon: MessageSquareText, category: 'receive' },
  { type: 'email', label: '연락처 받기', desc: '소식 받을 이메일을 모아요', Icon: Mail, category: 'receive' },
];

/**
 * 블록 모양 미리보기 (작은 와이어프레임).
 * 색 아이콘 대신 "페이지에 어떻게 보이는지"를 먹색 선으로 보여준다.
 */
export function BlockGlyph({ type, size = 36, dim = false }: { type: string; size?: number; dim?: boolean }) {
  const ink = dim ? '#c9c9cd' : '#171717';
  const soft = dim ? '#ededef' : '#d9d9dc';
  const accent = dim ? '#f3c6d0' : '#fc1c49';
  const common = { width: size, height: size, viewBox: '0 0 36 36', fill: 'none', 'aria-hidden': true } as const;
  switch (type) {
    case 'profile':
      return (
        <svg {...common}>
          <circle cx="18" cy="13" r="6" fill={ink} />
          <rect x="10" y="23" width="16" height="3" rx="1.5" fill={ink} />
          <rect x="13" y="28" width="10" height="2" rx="1" fill={soft} />
        </svg>
      );
    case 'link':
      return (
        <svg {...common}>
          <rect x="5" y="13" width="26" height="10" rx="5" fill={ink} />
          <rect x="11" y="17" width="14" height="2" rx="1" fill="#fff" />
        </svg>
      );
    case 'link_collection':
      return (
        <svg {...common}>
          <rect x="5" y="6" width="26" height="7" rx="3.5" fill={ink} />
          <rect x="5" y="15" width="26" height="7" rx="3.5" fill={soft} />
          <rect x="5" y="24" width="26" height="7" rx="3.5" fill={soft} />
        </svg>
      );
    case 'image_banner':
      return (
        <svg {...common}>
          <rect x="5" y="7" width="26" height="22" rx="4" fill={soft} />
          <circle cx="13" cy="14" r="2.5" fill={ink} />
          <path d="M5 25l8-7 6 5 4-3 8 6v1a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" fill={ink} />
        </svg>
      );
    case 'video':
      return (
        <svg {...common}>
          <rect x="4" y="9" width="28" height="18" rx="4" fill={ink} />
          <path d="M16 14v8l6-4z" fill={accent} />
        </svg>
      );
    case 'text':
      return (
        <svg {...common}>
          <rect x="6" y="9" width="18" height="4" rx="2" fill={ink} />
          <rect x="6" y="17" width="24" height="2" rx="1" fill={soft} />
          <rect x="6" y="22" width="20" height="2" rx="1" fill={soft} />
          <rect x="6" y="27" width="14" height="2" rx="1" fill={soft} />
        </svg>
      );
    case 'sns':
      return (
        <svg {...common}>
          <circle cx="9" cy="18" r="4" fill={ink} />
          <circle cx="18" cy="18" r="4" fill={ink} />
          <circle cx="27" cy="18" r="4" fill={soft} />
        </svg>
      );
    case 'product_grid':
      return (
        <svg {...common}>
          <rect x="5" y="6" width="12" height="12" rx="3" fill={soft} />
          <rect x="19" y="6" width="12" height="12" rx="3" fill={soft} />
          <rect x="5" y="21" width="9" height="2" rx="1" fill={ink} />
          <rect x="19" y="21" width="9" height="2" rx="1" fill={ink} />
          <rect x="5" y="26" width="6" height="2" rx="1" fill={accent} />
          <rect x="19" y="26" width="6" height="2" rx="1" fill={accent} />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="6" y="8" width="24" height="22" rx="4" fill={soft} />
          <rect x="6" y="8" width="24" height="7" rx="3" fill={ink} />
          <circle cx="13" cy="22" r="2.5" fill={accent} />
          <rect x="18" y="21" width="8" height="2" rx="1" fill={ink} />
        </svg>
      );
    case 'spacer':
      return (
        <svg {...common}>
          <rect x="6" y="6" width="24" height="5" rx="2.5" fill={soft} />
          <path d="M18 14v8M15 16l3-3 3 3M15 20l3 3 3-3" stroke={ink} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="6" y="25" width="24" height="5" rx="2.5" fill={soft} />
        </svg>
      );
    case 'inquiry':
      return (
        <svg {...common}>
          <rect x="5" y="7" width="26" height="6" rx="3" fill={soft} />
          <rect x="5" y="15" width="26" height="6" rx="3" fill={ink} />
          <rect x="5" y="23" width="26" height="6" rx="3" fill={soft} />
          <circle cx="27" cy="18" r="1.6" fill={accent} />
        </svg>
      );
    case 'email':
      return (
        <svg {...common}>
          <rect x="5" y="10" width="18" height="8" rx="3" fill={soft} />
          <rect x="24" y="10" width="7" height="8" rx="3" fill={ink} />
          <rect x="5" y="22" width="3" height="3" rx="1" fill={accent} />
          <rect x="10" y="22.5" width="14" height="2" rx="1" fill={soft} />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <rect x="6" y="6" width="24" height="24" rx="5" fill={soft} />
        </svg>
      );
  }
}

export function blockMeta(type: string): BlockTypeMeta {
  return (
    BLOCK_TYPES.find((b) => b.type === type) || {
      type: type as BlockType,
      label: type,
      desc: '',
      Icon: Type,
      category: 'none',
    }
  );
}

/** 블록 목록 줄에 회색으로 보여줄 요약 */
export function blockSummary(block: { type: string; data: any }): string {
  const d = block.data || {};
  switch (block.type) {
    case 'profile':
      return d.name || '';
    case 'link':
      return d.title || d.url || '';
    case 'link_collection':
      return d.title || `${(d.links || []).length}개 링크`;
    case 'sns':
      return `${(d.links || []).length}개 채널`;
    case 'video':
      return d.title || d.url || '';
    case 'text':
      return d.variant === 'divider' ? '구분선' : (d.text || '').split('\n')[0];
    case 'image_banner':
      return d.title || `${(d.images || []).length}장`;
    case 'spacer':
      return d.size === 's' ? '작게' : d.size === 'l' ? '크게' : '보통';
    case 'product_grid':
      return d.title || `${(d.products || []).length}개 상품`;
    case 'inquiry':
    case 'email':
      return d.title || '';
    case 'calendar':
      return `${(d.events || []).length}개 일정`;
    default:
      return '';
  }
}
