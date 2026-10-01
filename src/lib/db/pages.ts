'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isValidSlug, RESERVED_SLUGS } from '@/lib/utils';
import { DEFAULT_THEME } from '@/types';
import { assertCanEdit } from './account';

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * 새 페이지 생성.
 * - 계정 상태가 active 가 아니면 거부
 * - 페이지 상한(profiles.page_limit) 초과 시 거부
 * - 슬러그 중복/형식 오류는 500 대신 { ok:false, error } 로 돌려줌 (클라이언트 폼에서 표시)
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
  const supabase = createClient();

  const rawSlug = ((formData.get('slug') as string) || '').trim().toLowerCase();
  const title = ((formData.get('title') as string) || '').trim() || '내 링크 페이지';

  // 페이지 상한 검사
  const limit = profile?.page_limit ?? 3;
  const { count } = await supabase
    .from('pages')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  if ((count ?? 0) >= limit) {
    return { ok: false, error: `페이지는 최대 ${limit}개까지 만들 수 있어요. 더 필요하면 운영자에게 요청해주세요.` };
  }

  // 슬러그 자동 생성 또는 검증
  let slug = rawSlug;
  if (!slug) {
    slug = `user-${user.id.slice(0, 8)}`;
    // 자동 슬러그도 중복될 수 있음 (두 번째 페이지) → 접미사
    const { data: dup } = await supabase.from('pages').select('id').eq('slug', slug).maybeSingle();
    if (dup) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  } else if (!isValidSlug(slug) || RESERVED_SLUGS.has(slug)) {
    return { ok: false, error: '주소는 영문 소문자·숫자·하이픈(-)·밑줄(_)·마침표(.)로 3~30자예요' };
  }

  const { data: existing } = await supabase.from('pages').select('id').eq('slug', slug).maybeSingle();
  if (existing) {
    return { ok: false, error: '이미 사용 중인 URL이에요. 다른 주소를 시도해주세요.' };
  }

  const { data: newPage, error } = await supabase
    .from('pages')
    .insert({
      user_id: user.id,
      slug,
      title,
      theme: DEFAULT_THEME,
      is_published: true,
    })
    .select()
    .single();

  if (error) {
    // 동시 생성 등으로 unique 제약에 걸린 경우
    if (error.code === '23505') return { ok: false, error: '이미 사용 중인 주소예요.' };
    if (error.code === '23514') return { ok: false, error: '밑줄(_)·마침표(.)가 들어간 주소는 DB 업데이트(마이그레이션 002) 후에 쓸 수 있어요.' };
    return { ok: false, error: `페이지 생성 실패: ${error.message}` };
  }

  await supabase.from('blocks').insert({
    page_id: newPage.id,
    type: 'profile',
    position: 0,
    data: {
      name: title,
      bio: '',
      initial: title.charAt(0).toUpperCase(),
      layout: 'circle',
      titleSize: 'm',
    },
  });

  revalidatePath('/dashboard');
  redirect(`/edit/${newPage.id}`);
}

/**
 * 페이지 정보 업데이트 (제목, 슬러그, 테마, 공개여부)
 */
export async function updatePage(
  pageId: string,
  updates: { title?: string; slug?: string; theme?: any; is_published?: boolean }
) {
  const { user } = await assertCanEdit();
  const supabase = createClient();

  if (updates.slug !== undefined) {
    const slug = updates.slug.trim().toLowerCase();
    if (!isValidSlug(slug) || RESERVED_SLUGS.has(slug)) {
      throw new Error('주소는 영문 소문자·숫자·하이픈(-)·밑줄(_)·마침표(.)로 3~30자예요');
    }
    const { data: existing } = await supabase
      .from('pages')
      .select('id')
      .eq('slug', slug)
      .neq('id', pageId)
      .maybeSingle();
    if (existing) throw new Error('이미 사용 중인 URL이에요');
    updates.slug = slug;
  }

  const { error } = await supabase
    .from('pages')
    .update(updates)
    .eq('id', pageId)
    .eq('user_id', user.id);

  if (error) {
    if (error.code === '23505') throw new Error('이미 사용 중인 주소예요');
    if (error.code === '23514') throw new Error('밑줄(_)·마침표(.)가 들어간 주소는 DB 업데이트(마이그레이션 002) 후에 쓸 수 있어요.');
    throw new Error(error.message);
  }

  revalidatePath('/dashboard');
  revalidatePath(`/edit/${pageId}`, 'layout');
}

/**
 * 페이지 삭제
 */
export async function deletePage(pageId: string) {
  const { user } = await assertCanEdit();
  const supabase = createClient();

  const { error } = await supabase
    .from('pages')
    .delete()
    .eq('id', pageId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard');
  redirect('/dashboard');
}
