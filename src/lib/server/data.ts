import 'server-only';
import type { Block } from '@/types';
import { one, q } from './db';
import { isUuid } from '@/lib/utils';

/** 날짜를 글자로 바꿔 화면(클라이언트)에 넘길 수 있게 */
export function plain<T extends Record<string, any>>(row: T): T {
  const out: any = {};
  for (const [k, v] of Object.entries(row)) out[k] = v instanceof Date ? v.toISOString() : v;
  return out;
}

/** 이 회원이 고칠 수 있는 페이지인지 (주인 또는 함께 편집하는 사람). p = bl_pages 별칭, $n = 회원 번호 */
export const canEditSql = (n: number) =>
  `(p.user_id = $${n} OR EXISTS (SELECT 1 FROM bl_page_members m WHERE m.page_id = p.id AND m.user_id = $${n}))`;

export interface PageRow {
  id: string;
  user_id: number;
  /** 내가 주인인지 (아니면 초대받아 함께 편집) */
  is_owner?: boolean;
  slug: string;
  title: string;
  theme: any;
  is_published: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

/** 내 페이지 하나 (남의 페이지면 null) */
export async function getMyPage(pageId: string, userId: number): Promise<PageRow | null> {
  if (!isUuid(pageId)) return null;
  const row = await one(`SELECT p.*, (p.user_id = $2) AS is_owner FROM bl_pages p WHERE p.id = $1 AND ${canEditSql(2)}`, [
    pageId,
    userId,
  ]);
  return row ? (plain(row) as PageRow) : null;
}

export async function getMyPages(userId: number): Promise<PageRow[]> {
  const rows = await q(`SELECT p.*, (p.user_id = $1) AS is_owner FROM bl_pages p WHERE ${canEditSql(1)} ORDER BY p.created_at`, [userId]);
  return rows.map((r) => plain(r) as PageRow);
}

export async function getBlocks(pageId: string, onlyActive = false): Promise<Block[]> {
  const rows = await q(
    `SELECT * FROM bl_blocks WHERE page_id = $1 ${onlyActive ? 'AND is_active' : ''} ORDER BY position, created_at`,
    [pageId]
  );
  return rows.map((r) => plain(r) as Block);
}

/** 공개 페이지 (공개 설정된 것만) */
export async function getPublicPage(slug: string): Promise<PageRow | null> {
  const s = decodeURIComponent(slug || '').toLowerCase();
  if (!/^[a-z0-9_.-]{3,30}$/.test(s)) return null;
  const row = await one(
    `SELECT p.* FROM bl_pages p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN bl_accounts a ON a.user_id = p.user_id
      WHERE p.slug = $1 AND p.is_published
        AND u.status <> 'suspended'
        AND COALESCE(a.status, 'active') = 'active'
        AND (a.expires_at IS NULL OR a.expires_at > now() OR u.role = 'admin')`,
    [s]
  );
  return row ? (plain(row) as PageRow) : null;
}
