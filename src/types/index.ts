// ===== 블록 타입 =====
export type BlockType =
  | 'profile'    // 프로필
  | 'link'       // 단일 링크
  | 'product_grid' // 상품 그리드
  | 'inquiry'    // 문의 양식
  | 'calendar'   // 달력 / D-day
  | 'email'      // 이메일 수집
  | 'text'       // 텍스트 (제목/본문/구분선)
  | 'sns'        // SNS 링크 모음
  | 'link_collection' // 그룹 링크 (마이그레이션 001 필요)
  | 'video'      // 동영상 (001)
  | 'image_banner' // 갤러리 (001)
  | 'spacer';    // 여백 (001)

/** 모든 블록 data 에 들어갈 수 있는 공통 필드 (DB 컬럼 대신 JSONB 에 저장 → 마이그레이션 없이 동작) */
export interface BlockCommon {
  highlight?: boolean;      // 강조(별)
  visibleFrom?: string | null;  // 예약 공개 시작 (ISO)
  visibleUntil?: string | null; // 예약 공개 종료 (ISO)
}

export type ProfileLayout = 'cover' | 'circle' | 'small' | 'background';
export type TextSize = 's' | 'm' | 'l';
export type CardSize = 's' | 'm' | 'l';
export type CollectionLayout = 'list' | 'grid2' | 'grid3' | 'carousel1' | 'carousel2';

// 각 블록 타입별 데이터 구조
export interface ProfileData {
  name: string;          // 대표 문구
  bio: string;           // 상세 문구
  avatarUrl?: string;    // 프로필/커버 이미지
  initial?: string;      // 사진 없을 때 표시할 한 글자
  layout?: ProfileLayout; // 기본 circle
  titleSize?: TextSize;   // 기본 m
}

export interface LinkData extends BlockCommon {
  title: string;
  url: string;
  thumbnail?: string;
  memo?: string; // 운영자만 보는 메모
  cardSize?: CardSize; // 기본 s (왼쪽 정사각 썸네일)
}

export interface CollectionItem {
  id: string;
  title: string;
  url: string;
  thumbnail?: string;
}

export interface LinkCollectionData extends BlockCommon {
  title?: string;
  links: CollectionItem[];
  layout?: CollectionLayout;
  collapse?: boolean; // 접기 (처음 3개만)
}

export interface VideoData extends BlockCommon {
  url: string;
  title?: string;
}

export interface GalleryImage {
  id: string;
  url: string;
  link?: string;
}

export interface GalleryData extends BlockCommon {
  title?: string;
  images: GalleryImage[];
  layout?: 'single' | 'slide' | 'grid2';
  ratio?: 'square' | 'wide' | 'tall';
}

export interface SpacerData extends BlockCommon {
  size?: 's' | 'm' | 'l';
  line?: boolean;
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

export interface TextData extends BlockCommon {
  variant: 'heading' | 'body' | 'divider';
  text?: string;
  align?: 'left' | 'center';
}

export type SnsPlatform =
  | 'instagram' | 'youtube' | 'threads' | 'tiktok' | 'twitter' | 'kakao' | 'blog'
  | 'facebook' | 'phone' | 'email' | 'website';

export interface SnsLink {
  platform: SnsPlatform;
  url: string; // URL, 아이디, 전화번호, 이메일 중 하나 (플랫폼별로 해석)
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
  slug: string; // link.byranmedia.com/<slug>
  title: string;
  theme: PageTheme;
  is_published: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export type FontKey =
  | 'pretendard' | 'noto' | 'nanum' | 'serif'
  | 'gowun-dodum' | 'gowun-batang' | 'ibm' | 'do-hyeon' | 'jua';

export interface PageTheme {
  primaryColor: string; // 버튼(강조) 색
  bgColor: string;      // 배경 색
  font: FontKey;
  buttonShape: 'rounded' | 'square' | 'pill';
  // ---- By링크 디자인 탭 (모두 선택값, 없으면 기본) ----
  bgImage?: string;                        // 배경 사진
  buttonScope?: 'highlight' | 'all';       // 버튼색 부분 적용(강조만) / 전체 적용
  buttonStyle?: 'fill' | 'outline' | 'shadow';
  footerLogo?: 'bylink' | 'custom' | 'none';
  footerLogoUrl?: string;
  showSearch?: boolean;                    // 상품 검색창 (상품 그리드가 있을 때)
}

export interface Block {
  id: string;
  page_id: string;
  type: BlockType;
  position: number;
  data: any; // BlockData의 data 필드 (각 타입별)
  click_count: number;
  is_active: boolean;
  visible_from?: string | null;
  visible_until?: string | null;
  badge_text?: string | null;
  created_at: string;
  updated_at: string;
}

export type AccountStatus = 'active' | 'suspended' | 'expired';

export interface Profile {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  plan: 'free' | 'pro' | 'business';
  status: AccountStatus;
  expires_at: string | null;
  page_limit: number;
  is_admin: boolean;
  last_seen_at: string | null;
  admin_memo: string | null;
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
  primaryColor: '#171717',
  bgColor: '#ffffff',
  font: 'pretendard',
  buttonShape: 'rounded',
  buttonScope: 'highlight',
  buttonStyle: 'fill',
  footerLogo: 'bylink',
};
