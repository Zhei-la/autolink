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
  color: string; // 아이콘 배경
  Icon: React.ComponentType<{ className?: string }>;
  category: 'content' | 'communication' | 'none';
  /** 마이그레이션 001 이 있어야 저장되는 타입 */
  needs001?: boolean;
  /** 강조(별) 지원 */
  canHighlight?: boolean;
}

export const BLOCK_TYPES: BlockTypeMeta[] = [
  { type: 'profile', label: '프로필', desc: '대표 사진·문구', color: '#06b6d4', Icon: UserRound, category: 'none' },
  { type: 'link', label: '단일 링크', desc: '하나의 URL 강조', color: '#22c55e', Icon: Link2, category: 'content', canHighlight: true },
  { type: 'link_collection', label: '그룹 링크', desc: '여러 개의 URL 폴더화', color: '#16a34a', Icon: Link, category: 'content', needs001: true, canHighlight: true },
  { type: 'sns', label: 'SNS 연결', desc: '소셜 채널 연결', color: '#ec4899', Icon: Share2, category: 'content' },
  { type: 'video', label: '동영상', desc: '유튜브 영상', color: '#ef4444', Icon: PlayCircle, category: 'content', needs001: true },
  { type: 'text', label: '텍스트', desc: '제목·글 작성', color: '#71717a', Icon: Type, category: 'content' },
  { type: 'image_banner', label: '갤러리', desc: '이미지 배치', color: '#3b82f6', Icon: Images, category: 'content', needs001: true },
  { type: 'spacer', label: '여백', desc: '블록 간격 조절', color: '#a1a1aa', Icon: MoveVertical, category: 'content', needs001: true },
  { type: 'product_grid', label: '상품 그리드', desc: '상품 여러 개', color: '#f59e0b', Icon: ShoppingBag, category: 'content' },
  { type: 'inquiry', label: '문의', desc: '고객 문의 접수', color: '#84cc16', Icon: MessageSquareText, category: 'communication' },
  { type: 'calendar', label: '일정', desc: '일정·D-day', color: '#0ea5e9', Icon: CalendarDays, category: 'communication' },
  { type: 'email', label: '고객정보', desc: '이메일 수집', color: '#9333ea', Icon: Mail, category: 'communication' },
];

export function blockMeta(type: string): BlockTypeMeta {
  return (
    BLOCK_TYPES.find((b) => b.type === type) || {
      type: type as BlockType,
      label: type,
      desc: '',
      color: '#a1a1aa',
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
