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

export interface PageRow {
  id: string;
  user_id: number;
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
  const row = await one(`SELECT * FROM bl_pages WHERE id = $1 AND user_id = $2`, [pageId, userId]);
  return row ? (plain(row) as PageRow) : null;
}

export async function getMyPages(userId: number): Promise<PageRow[]> {
  const rows = await q(`SELECT * FROM bl_pages WHERE user_id = $1 ORDER BY created_at`, [userId]);
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
