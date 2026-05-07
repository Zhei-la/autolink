'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { BlockType } from '@/types';

/**
 * 페이지에 블록 소유권 검증.
 * 본인 소유가 아니면 throw.
 */
async function assertPageOwner(pageId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다');

  const { data: page } = await supabase
    .from('pages')
    .select('id, user_id')
    .eq('id', pageId)
    .maybeSingle();

  if (!page || page.user_id !== user.id) {
    throw new Error('이 페이지에 접근 권한이 없어요');
  }

  return { supabase, user };
}

/**
 * 블록 추가. position은 가장 마지막으로 자동 설정.
 */
export async function addBlock(pageId: string, type: BlockType) {
  const { supabase } = await assertPageOwner(pageId);

  // 마지막 position 확인
  const { data: lastBlock } = await supabase
    .from('blocks')
    .select('position')
    .eq('page_id', pageId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPosition = lastBlock ? lastBlock.position + 1 : 0;

  // 타입별 기본 데이터
  const defaultData = getDefaultBlockData(type);

  const { data: newBlock, error } = await supabase
    .from('blocks')
    .insert({
      page_id: pageId,
      type,
      position: nextPosition,
      data: defaultData,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/edit/${pageId}`);
  return newBlock;
}

/**
 * 블록 데이터 업데이트
 */
export async function updateBlockData(
  pageId: string,
  blockId: string,
  data: any
) {
  const { supabase } = await assertPageOwner(pageId);

  const { error } = await supabase
    .from('blocks')
    .update({ data })
    .eq('id', blockId)
    .eq('page_id', pageId);

  if (error) throw new Error(error.message);

  revalidatePath(`/edit/${pageId}`);
}

/**
 * 블록 삭제
 */
export async function deleteBlock(pageId: string, blockId: string) {
  const { supabase } = await assertPageOwner(pageId);

  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('id', blockId)
    .eq('page_id', pageId);

  if (error) throw new Error(error.message);

  revalidatePath(`/edit/${pageId}`);
}

/**
 * 블록 위/아래 이동 (인접 블록과 position 교환)
 */
export async function moveBlock(
  pageId: string,
  blockId: string,
  direction: 'up' | 'down'
) {
  const { supabase } = await assertPageOwner(pageId);

  // 현재 블록
  const { data: current } = await supabase
    .from('blocks')
    .select('id, position')
    .eq('id', blockId)
    .eq('page_id', pageId)
    .maybeSingle();
  if (!current) throw new Error('블록을 찾을 수 없어요');

  // 인접 블록 찾기
  const { data: neighbor } = await supabase
    .from('blocks')
    .select('id, position')
    .eq('page_id', pageId)
    .order('position', { ascending: direction === 'up' ? false : true })
    .lt('position', direction === 'up' ? current.position : 99999)
    .gt('position', direction === 'down' ? current.position : -1)
    .limit(1)
    .maybeSingle();

  if (!neighbor) {
    // 이미 끝이라 이동 불가 — 조용히 무시
    return;
  }

  // position 교환 (임시 음수값 사용해 유니크 제약 회피 - 우리 스키마엔 없지만 안전 위해)
  const tempPos = -1 - Math.floor(Math.random() * 1000);
  await supabase.from('blocks').update({ position: tempPos }).eq('id', current.id);
  await supabase.from('blocks').update({ position: current.position }).eq('id', neighbor.id);
  await supabase.from('blocks').update({ position: neighbor.position }).eq('id', current.id);

  revalidatePath(`/edit/${pageId}`);
}

/**
 * 블록 복제
 */
export async function duplicateBlock(pageId: string, blockId: string) {
  const { supabase } = await assertPageOwner(pageId);

  const { data: source } = await supabase
    .from('blocks')
    .select('*')
    .eq('id', blockId)
    .maybeSingle();
  if (!source) throw new Error('블록을 찾을 수 없어요');

  // 모든 블록의 position을 source 다음부터 +1 밀기
  const { data: laterBlocks } = await supabase
    .from('blocks')
    .select('id, position')
    .eq('page_id', pageId)
    .gt('position', source.position)
    .order('position', { ascending: false });

  if (laterBlocks) {
    for (const b of laterBlocks) {
      await supabase
        .from('blocks')
        .update({ position: b.position + 1 })
        .eq('id', b.id);
    }
  }

  // 새 블록 추가 (source.position + 1 위치)
  await supabase.from('blocks').insert({
    page_id: pageId,
    type: source.type,
    position: source.position + 1,
    data: source.data,
  });

  revalidatePath(`/edit/${pageId}`);
}

/**
 * 블록 활성화/비활성화 토글
 */
export async function toggleBlockActive(pageId: string, blockId: string) {
  const { supabase } = await assertPageOwner(pageId);

  const { data: block } = await supabase
    .from('blocks')
    .select('is_active')
    .eq('id', blockId)
    .maybeSingle();
  if (!block) return;

  await supabase
    .from('blocks')
    .update({ is_active: !block.is_active })
    .eq('id', blockId);

  revalidatePath(`/edit/${pageId}`);
}

// ===== 블록 타입별 기본 데이터 =====
function getDefaultBlockData(type: BlockType): any {
  switch (type) {
    case 'profile':
      return { name: '내 이름', bio: '한 줄 소개', initial: '?' };
    case 'link':
      return { title: '새 링크', url: '' };
    case 'product_grid':
      return { title: '추천 상품', products: [] };
    case 'inquiry':
      return {
        title: '문의하기',
        buttonText: '보내기',
        options: ['일반 문의', '협찬 문의', '기타'],
      };
    case 'calendar':
      return { events: [] };
    case 'email':
      return {
        title: '구독하기',
        description: '새 소식이 올라오면 알려드릴게요',
        buttonText: '구독',
      };
    case 'text':
      return { variant: 'heading', text: '제목을 입력하세요' };
    case 'sns':
      return { links: [] };
    default:
      return {};
  }
}
