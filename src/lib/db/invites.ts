'use server';

import { randomInt } from 'crypto';
import { revalidatePath } from 'next/cache';
import { assertCanEdit, getMyAccount } from './account';
import { one, q, tx } from '@/lib/server/db';
import { isUuid } from '@/lib/utils';

/**
 * 업체에 페이지 편집 권한 주기
 * - 페이지 주인이 초대 코드(예: K7Q-9MX)를 만든다 → 7일 안에 한 번만 쓸 수 있음
 * - 업체 사장님이 바이란미디어에 가입하고 By링크에서 코드를 넣으면 그 페이지를 같이 보고 고칠 수 있다
 */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 헷갈리는 0/O/1/I 뺌
const DAYS = 7;

function makeCode() {
  let s = '';
  for (let i = 0; i < 6; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return `${s.slice(0, 3)}-${s.slice(3)}`;
}
const clean = (code: string) => String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const pretty = (c: string) => (c.length === 6 ? `${c.slice(0, 3)}-${c.slice(3)}` : c);

async function assertOwner(pageId: string) {
  const { user } = await assertCanEdit();
  if (!isUuid(pageId)) throw new Error('페이지를 찾을 수 없어요');
  const page = await one(`SELECT id FROM bl_pages WHERE id = $1 AND user_id = $2`, [pageId, user.id]);
  if (!page) throw new Error('페이지 주인만 할 수 있어요');
  return user;
}

export interface ShareInfo {
  invite: { code: string; expires_at: string } | null;
  members: { user_id: number; name: string; created_at: string }[];
}

/** 지금 살아 있는 초대 코드 + 함께 편집하는 사람 목록 (주인만) */
export async function getShareInfo(pageId: string): Promise<ShareInfo> {
  await assertOwner(pageId);
  const inv = await one(
    `SELECT code, expires_at FROM bl_invites WHERE page_id = $1 AND used_at IS NULL AND expires_at > now() ORDER BY created_at DESC LIMIT 1`,
    [pageId]
  );
  const members = await q(
    `SELECT m.user_id, COALESCE(u.nickname, u.name, '회원') AS name, m.created_at
       FROM bl_page_members m JOIN users u ON u.id = m.user_id
      WHERE m.page_id = $1 ORDER BY m.created_at`,
    [pageId]
  );
  return {
    invite: inv ? { code: pretty(inv.code), expires_at: new Date(inv.expires_at).toISOString() } : null,
    members: members.map((m: any) => ({ user_id: m.user_id, name: m.name, created_at: new Date(m.created_at).toISOString() })),
  };
}

/** 새 초대 코드 만들기 (이전에 안 쓴 코드는 없어짐) */
export async function createInvite(pageId: string): Promise<{ code: string; expires_at: string }> {
  const user = await assertOwner(pageId);
  return tx(async (run) => {
    await run(`DELETE FROM bl_invites WHERE page_id = $1 AND used_at IS NULL`, [pageId]);
    for (let i = 0; i < 5; i++) {
      const code = clean(makeCode());
      const rows = await run(
        `INSERT INTO bl_invites (code, page_id, created_by, expires_at) VALUES ($1, $2, $3, now() + interval '${DAYS} days')
         ON CONFLICT (code) DO NOTHING RETURNING code, expires_at`,
        [code, pageId, user.id]
      );
      if (rows.length) return { code: pretty(rows[0].code), expires_at: new Date(rows[0].expires_at).toISOString() };
    }
    throw new Error('코드를 만들지 못했어요. 다시 눌러주세요');
  });
}

/** 초대 코드 없애기 */
export async function cancelInvite(pageId: string) {
  await assertOwner(pageId);
  await q(`DELETE FROM bl_invites WHERE page_id = $1 AND used_at IS NULL`, [pageId]);
}

/** 함께 편집하던 사람 빼기 (주인만) */
export async function removeMember(pageId: string, memberId: number) {
  await assertOwner(pageId);
  await q(`DELETE FROM bl_page_members WHERE page_id = $1 AND user_id = $2`, [pageId, Number(memberId)]);
  revalidatePath(`/edit/${pageId}`, 'layout');
}

/** 초대받은 페이지에서 나가기 */
export async function leavePage(pageId: string) {
  const { user } = await getMyAccount();
  if (!user) throw new Error('로그인이 필요해요');
  await q(`DELETE FROM bl_page_members WHERE page_id = $1 AND user_id = $2`, [pageId, user.id]);
  revalidatePath('/dashboard');
}

/** 코드 넣고 페이지 받기 → 성공하면 그 페이지 번호를 돌려줌 */
export async function redeemInvite(code: string): Promise<{ ok: true; pageId: string } | { ok: false; error: string }> {
  const { user } = await getMyAccount();
  if (!user) return { ok: false, error: '로그인이 필요해요' };
  const c = clean(code);
  if (c.length !== 6) return { ok: false, error: '코드 6자리를 확인해 주세요 (예: K7Q-9MX)' };
  try {
    return await tx(async (run) => {
      // 동시에 두 사람이 같은 코드를 넣어도 한 명만 되게 잠금
      const [inv] = await run(`SELECT code, page_id, used_at, expires_at FROM bl_invites WHERE code = $1 FOR UPDATE`, [c]);
      if (!inv) return { ok: false as const, error: '없는 코드예요. 다시 확인해 주세요' };
      if (inv.used_at) return { ok: false as const, error: '이미 사용된 코드예요. 새 코드를 받아 주세요' };
      if (new Date(inv.expires_at).getTime() < Date.now()) return { ok: false as const, error: '기간이 지난 코드예요. 새 코드를 받아 주세요' };
      const [page] = await run(`SELECT user_id FROM bl_pages WHERE id = $1`, [inv.page_id]);
      if (!page) return { ok: false as const, error: '페이지가 지워졌어요' };
      if (page.user_id !== user.id) {
        await run(
          `INSERT INTO bl_page_members (page_id, user_id, added_by) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [inv.page_id, user.id, page.user_id]
        );
      }
      await run(`UPDATE bl_invites SET used_by = $1, used_at = now() WHERE code = $2`, [user.id, c]);
      return { ok: true as const, pageId: inv.page_id as string };
    });
  } finally {
    revalidatePath('/dashboard');
  }
}
