'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isValidSlug, RESERVED_SLUGS } from '@/lib/utils';
import { DEFAULT_THEME } from '@/types';
import { assertCanEdit } from './account';
import { one, q, tx } from '@/lib/server/db';

export type ActionResult = { ok: true } | { ok: false; error: string };

const SLUG_RULE = '주소는 영문 소문자·숫자·하이픈(-)·밑줄(_)·마침표(.)로 3~30자예요';

/**
 * 새 페이지 생성.
 * - 계정 상태가 active 가 아니면 거부
 * - 페이지 상한 초과 시 거부
 * - 슬러그 중복/형식 오류는 { ok:false, error } 로 돌려줌
 * - 성공하면 편집기로 redirect
 */
export async function createPage(formData: FormData): Promise<ActionResult> {
  let account;
  try {
    account = await assertCanEdit();
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
  const { user, profile } = account;

  const rawSlug = ((formData.get('slug') as string) || '').trim().toLowerCase();
  const title = ((formData.get('title') as string) || '').trim().slice(0, 50) || '내 링크 페이지';

  const limit = profile?.page_limit ?? 3;
  const cnt = await one<{ n: number }>(`SELECT count(*)::int AS n FROM bl_pages WHERE user_id = $1`, [user.id]);
  if (!user.isAdmin && (cnt?.n ?? 0) >= limit) {
    return { ok: false, error: `페이지는 최대 ${limit}개까지 만들 수 있어요. 더 필요하면 운영자에게 요청해주세요.` };
  }

  let slug = rawSlug;
  if (!slug) {
    slug = `user${user.id}`;
    const dup = await one(`SELECT 1 FROM bl_pages WHERE slug = $1`, [slug]);
    if (dup) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  } else if (!isValidSlug(slug) || RESERVED_SLUGS.has(slug)) {
    return { ok: false, error: SLUG_RULE };
  }

  const exists = await one(`SELECT 1 FROM bl_pages WHERE slug = $1`, [slug]);
  if (exists) return { ok: false, error: '이미 사용 중인 주소예요. 다른 주소를 시도해주세요.' };

  let pageId: string;
  try {
    pageId = await tx(async (run) => {
      const [page] = await run(
        `INSERT INTO bl_pages (user_id, slug, title, theme) VALUES ($1, $2, $3, $4) RETURNING id`,
        [user.id, slug, title, JSON.stringify(DEFAULT_THEME)]
      );
      await run(`INSERT INTO bl_blocks (page_id, type, position, data) VALUES ($1, 'profile', 0, $2)`, [
        page.id,
        JSON.stringify({ name: title, bio: '', initial: title.charAt(0).toUpperCase(), layout: 'circle', titleSize: 'm' }),
      ]);
      return page.id as string;
    });
  } catch (e: any) {
    if (e?.code === '23505') return { ok: false, error: '이미 사용 중인 주소예요.' };
    if (e?.code === '23514') return { ok: false, error: SLUG_RULE };
    return { ok: false, error: `페이지를 만들지 못했어요: ${e.message}` };
  }

  revalidatePath('/dashboard');
  redirect(`/edit/${pageId}`);
}

/**
 * 페이지 정보 업데이트 (제목, 슬러그, 테마, 공개여부)
 */
export async function updatePage(
  pageId: string,
  updates: { title?: string; slug?: string; theme?: any; is_published?: boolean }
) {
  const { user } = await assertCanEdit();

  const sets: string[] = [];
  const vals: any[] = [];
  const add = (col: string, v: any) => {
    vals.push(v);
    sets.push(`${col} = $${vals.length}`);
  };

  if (updates.slug !== undefined) {
    const slug = updates.slug.trim().toLowerCase();
    if (!isValidSlug(slug) || RESERVED_SLUGS.has(slug)) throw new Error(SLUG_RULE);
    const taken = await one(`SELECT 1 FROM bl_pages WHERE slug = $1 AND id <> $2`, [slug, pageId]);
    if (taken) throw new Error('이미 사용 중인 주소예요');
    add('slug', slug);
  }
  if (updates.title !== undefined) add('title', String(updates.title).slice(0, 50) || '내 링크 페이지');
  if (updates.theme !== undefined) add('theme', JSON.stringify(updates.theme || {}));
  if (updates.is_published !== undefined) add('is_published', !!updates.is_published);
  if (!sets.length) return;

  vals.push(pageId, user.id);
  try {
    await q(
      `UPDATE bl_pages SET ${sets.join(', ')}, updated_at = now() WHERE id = $${vals.length - 1} AND user_id = $${vals.length}`,
      vals
    );
  } catch (e: any) {
    if (e?.code === '23505') throw new Error('이미 사용 중인 주소예요');
    if (e?.code === '23514') throw new Error(SLUG_RULE);
    throw e;
  }

  revalidatePath('/dashboard');
  revalidatePath(`/edit/${pageId}`, 'layout');
}

/**
 * 페이지 삭제
 */
export async function deletePage(pageId: string) {
  const { user } = await assertCanEdit();
  await q(`DELETE FROM bl_pages WHERE id = $1 AND user_id = $2`, [pageId, user.id]);
  revalidatePath('/dashboard');
  redirect('/dashboard');
}
