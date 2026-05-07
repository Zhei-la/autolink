'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isValidSlug } from '@/lib/utils';
import { DEFAULT_THEME } from '@/types';

/**
 * 새 페이지 생성. 슬러그가 비어있으면 user-{userId일부}로 자동 생성.
 */
export async function createPage(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다');

  const rawSlug = (formData.get('slug') as string)?.trim().toLowerCase();
  const title = (formData.get('title') as string)?.trim() || '내 링크 페이지';

  // 슬러그 자동 생성 또는 검증
  let slug = rawSlug;
  if (!slug) {
    slug = `user-${user.id.slice(0, 8)}`;
  } else if (!isValidSlug(slug)) {
    throw new Error('URL은 영문 소문자, 숫자, 하이픈만 가능합니다 (3~30자)');
  }

  // 중복 검사
  const { data: existing } = await supabase
    .from('pages')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (existing) {
    throw new Error('이미 사용 중인 URL이에요. 다른 주소를 시도해주세요');
  }

  // 페이지 생성
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

  if (error) throw new Error(`페이지 생성 실패: ${error.message}`);

  // 기본 프로필 블록 자동 추가
  await supabase.from('blocks').insert({
    page_id: newPage.id,
    type: 'profile',
    position: 0,
    data: {
      name: title,
      bio: '한 줄 소개를 입력해주세요',
      initial: title.charAt(0).toUpperCase(),
    },
  });

  revalidatePath('/dashboard');
  redirect(`/edit/${newPage.id}`);
}

/**
 * 페이지 정보 업데이트 (제목, 슬러그, 테마)
 */
export async function updatePage(
  pageId: string,
  updates: { title?: string; slug?: string; theme?: any; is_published?: boolean }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다');

  // 슬러그 변경 시 검증
  if (updates.slug !== undefined) {
    const slug = updates.slug.trim().toLowerCase();
    if (!isValidSlug(slug)) {
      throw new Error('URL은 영문 소문자, 숫자, 하이픈만 가능합니다 (3~30자)');
    }
    const { data: existing } = await supabase
      .from('pages')
      .select('id')
      .eq('slug', slug)
      .neq('id', pageId)
      .maybeSingle();
    if (existing) {
      throw new Error('이미 사용 중인 URL이에요');
    }
    updates.slug = slug;
  }

  const { error } = await supabase
    .from('pages')
    .update(updates)
    .eq('id', pageId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard');
  revalidatePath(`/edit/${pageId}`);
}

/**
 * 페이지 삭제
 */
export async function deletePage(pageId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다');

  const { error } = await supabase
    .from('pages')
    .delete()
    .eq('id', pageId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard');
  redirect('/dashboard');
}
