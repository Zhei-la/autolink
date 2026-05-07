// ===== 블록 타입 =====
export type BlockType =
  | 'profile'    // 프로필
  | 'link'       // 단일 링크
  | 'product_grid' // 상품 그리드
  | 'inquiry'    // 문의 양식
  | 'calendar'   // 달력 / D-day
  | 'email'      // 이메일 수집
  | 'text'       // 텍스트 (제목/본문/구분선)
  | 'sns';       // SNS 링크 모음

// 각 블록 타입별 데이터 구조
export interface ProfileData {
  name: string;
  bio: string;
  avatarUrl?: string;
  initial?: string; // 사진 없을 때 표시할 한 글자
}

export interface LinkData {
  title: string;
  url: string;
  thumbnail?: string;
  memo?: string; // 운영자만 보는 메모
}

export interface Product {
  id: string;
  title: string;
  url: string;
  thumbnail?: string;
  price?: number;
  discount?: number; // 0-99
}

export interface ProductGridData {
  title?: string;
  products: Product[];
}

export interface InquiryData {
  title: string;
  buttonText: string;
  options: string[]; // 카테고리 선택지
}

export interface CalendarEvent {
  id: string;
  date: string; // ISO date
  title: string;
  emoji?: string;
}

export interface CalendarData {
  events: CalendarEvent[];
}

export interface EmailData {
  title: string;
  description: string;
  buttonText: string;
}

export interface TextData {
  variant: 'heading' | 'body' | 'divider';
  text?: string;
}

export interface SnsLink {
  platform: 'instagram' | 'youtube' | 'threads' | 'tiktok' | 'twitter' | 'kakao' | 'blog';
  url: string;
}

export interface SnsData {
  links: SnsLink[];
}

// 블록 데이터 통합 타입
export type BlockData =
  | { type: 'profile'; data: ProfileData }
  | { type: 'link'; data: LinkData }
  | { type: 'product_grid'; data: ProductGridData }
  | { type: 'inquiry'; data: InquiryData }
  | { type: 'calendar'; data: CalendarData }
  | { type: 'email'; data: EmailData }
  | { type: 'text'; data: TextData }
  | { type: 'sns'; data: SnsData };

// ===== DB 모델 =====

export interface Page {
  id: string;
  user_id: string;
  slug: string; // autolink.kr/p/<slug>
  title: string;
  theme: PageTheme;
  is_published: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface PageTheme {
  primaryColor: string; // 포인트 색
  bgColor: string;      // 배경 색
  font: 'pretendard' | 'noto' | 'nanum' | 'serif';
  buttonShape: 'rounded' | 'square' | 'pill';
}

export interface Block {
  id: string;
  page_id: string;
  type: BlockType;
  position: number;
  data: any; // BlockData의 data 필드 (각 타입별)
  click_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InquirySubmission {
  id: string;
  block_id: string;
  selected_option: string;
  created_at: string;
}

export interface EmailSubmission {
  id: string;
  block_id: string;
  email: string;
  consent: boolean;
  created_at: string;
}

// 기본 테마 (페이지 생성 시 적용)
export const DEFAULT_THEME: PageTheme = {
  primaryColor: '#f97316',
  bgColor: '#fafafa',
  font: 'pretendard',
  buttonShape: 'rounded',
};
