'use server';

import { revalidatePath } from 'next/cache';
import type { AccountStatus } from '@/types';
import { getSessionUser } from '@/lib/server/auth';
import { q } from '@/lib/server/db';
import { plain } from '@/lib/server/data';

export interface AdminCustomer {
  id: number;
  email: string | null;
  name: string | null;
  status: AccountStatus;
  expires_at: string | null;
  page_limit: number;
  is_admin: boolean;
  created_at: string;
  last_seen_at: string | null;
  admin_memo: string | null;
  page_count: number;
  total_views: number;
}

/** 바이란미디어 운영자(role=admin)만 */
async function assertAdmin() {
  const user = await getSessionUser();
  if (!user) throw new Error('로그인이 필요합니다');
  if (!user.isAdmin) throw new Error('관리자만 접근할 수 있어요');
  return user;
}

/** 관리자 여부만 확인 (페이지 가드용, throw 안 함) */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    await assertAdmin();
    return true;
  } catch {
    return false;
  }
}

/** By링크에 한 번이라도 들어온 회원 목록 */
export async function listCustomers(): Promise<AdminCustomer[]> {
  await assertAdmin();
  const rows = await q(
    `SELECT u.id, u.email, COALESCE(u.nickname, u.name) AS name, a.status, a.expires_at, a.page_limit,
            (u.role = 'admin') AS is_admin, a.created_at, a.last_seen_at, a.admin_memo,
            COUNT(p.id)::int AS page_count, COALESCE(SUM(p.view_count), 0)::int AS total_views
       FROM bl_accounts a
       JOIN users u ON u.id = a.user_id
       LEFT JOIN bl_pages p ON p.user_id = a.user_id
      GROUP BY u.id, a.user_id
      ORDER BY a.last_seen_at DESC NULLS LAST`
  );
  return rows.map((r: any) => {
    const row = plain(r) as any;
    if (row.email && String(row.email).endsWith('.local')) row.email = null;
    return row as AdminCustomer;
  });
}

export async function updateCustomer(
  customerId: number,
  updates: {
    status?: AccountStatus;
    page_limit?: number;
    expires_at?: string | null; // 'YYYY-MM-DD' 또는 null
    admin_memo?: string | null;
  }
) {
  const me = await assertAdmin();
  const id = Number(customerId);
  if (!Number.isInteger(id)) throw new Error('잘못된 회원이에요');

  if (id === me.id && updates.status && updates.status !== 'active') {
    throw new Error('본인 계정은 정지/만료 처리할 수 없어요');
  }

  const sets: string[] = [];
  const vals: any[] = [];
  const add = (col: string, v: any) => {
    vals.push(v);
    sets.push(`${col} = $${vals.length}`);
  };
  if (updates.status && ['active', 'suspended', 'expired'].includes(updates.status)) add('status', updates.status);
  if (typeof updates.page_limit === 'number') add('page_limit', Math.max(0, Math.min(100, Math.floor(updates.page_limit))));
  if (updates.expires_at !== undefined) {
    add(
      'expires_at',
      updates.expires_at && /^\d{4}-\d{2}-\d{2}$/.test(updates.expires_at)
        ? new Date(`${updates.expires_at}T23:59:59+09:00`).toISOString() // KST 그날 자정까지
        : null
    );
  }
  if (updates.admin_memo !== undefined) add('admin_memo', updates.admin_memo ? String(updates.admin_memo).slice(0, 1000) : null);
  if (!sets.length) return;

  vals.push(id);
  await q(`UPDATE bl_accounts SET ${sets.join(', ')} WHERE user_id = $${vals.length}`, vals);
  revalidatePath('/admin');
}

/** 고객의 페이지 목록 (관리자 화면에서 펼쳐보기) */
export async function listCustomerPages(customerId: number) {
  await assertAdmin();
  const rows = await q(
    `SELECT id, slug, title, is_published, view_count, updated_at FROM bl_pages WHERE user_id = $1 ORDER BY updated_at DESC`,
    [Number(customerId)]
  );
  return rows.map((r: any) => plain(r));
}
