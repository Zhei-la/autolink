'use server';

import { revalidatePath } from 'next/cache';
import type { BlockType } from '@/types';
import { assertCanEdit } from './account';
import { one, q, tx } from '@/lib/server/db';
import { canEditSql } from '@/lib/server/data';
import { isUuid } from '@/lib/utils';

const ALLOWED_TYPES: BlockType[] = [
  'profile', 'link', 'product_grid', 'inquiry', 'calendar', 'email', 'text', 'sns',
  'link_collection', 'video', 'image_banner', 'spacer',
];

/** 내 페이지인지 + 편집 가능한 계정인지 확인. 아니면 throw. */
async function assertPageOwner(pageId: string) {
  const { user } = await assertCanEdit();
  if (!isUuid(pageId)) throw new Error('이 페이지에 접근 권한이 없어요');
  const page = await one(`SELECT p.id FROM bl_pages p WHERE p.id = $1 AND ${canEditSql(2)}`, [pageId, user.id]);
  if (!page) throw new Error('이 페이지에 접근 권한이 없어요');
  return { user };
}

function touch(pageId: string) {
  return q(`UPDATE bl_pages SET updated_at = now() WHERE id = $1`, [pageId]);
}

/** 블록 추가. 프로필은 맨 앞, 나머지는 맨 뒤 */
export async function addBlock(pageId: string, type: BlockType) {
  await assertPageOwner(pageId);
  if (!ALLOWED_TYPES.includes(type)) throw new Error('지원하지 않는 블록이에요');

  const edge = await one<{ min: number | null; max: number | null }>(
    `SELECT min(position) AS min, max(position) AS max FROM bl_blocks WHERE page_id = $1`,
    [pageId]
  );
  const position =
    type === 'profile' ? (edge?.min ?? 1) - 1 : edge?.max === null || edge?.max === undefined ? 0 : edge.max + 1;

  const block = await one(
    `INSERT INTO bl_blocks (page_id, type, position, data) VALUES ($1, $2, $3, $4) RETURNING *`,
    [pageId, type, position, JSON.stringify(getDefaultBlockData(type))]
  );
  await touch(pageId);
  revalidatePath(`/edit/${pageId}`);
  return serialize(block);
}

/** 블록 데이터 저장 (자동 저장) */
export async function updateBlockData(pageId: string, blockId: string, data: any) {
  await assertPageOwner(pageId);
  if (!isUuid(blockId)) throw new Error('블록을 찾을 수 없어요');
  await q(`UPDATE bl_blocks SET data = $1, updated_at = now() WHERE id = $2 AND page_id = $3`, [
    JSON.stringify(data ?? {}),
    blockId,
    pageId,
  ]);
  await touch(pageId);
  revalidatePath(`/edit/${pageId}`);
}

/** 블록 삭제 */
export async function deleteBlock(pageId: string, blockId: string) {
  await assertPageOwner(pageId);
  if (!isUuid(blockId)) return;
  await q(`DELETE FROM bl_blocks WHERE id = $1 AND page_id = $2`, [blockId, pageId]);
  await touch(pageId);
  revalidatePath(`/edit/${pageId}`);
}

/** 위/아래 한 칸 이동 (예전 메뉴용) */
export async function moveBlock(pageId: string, blockId: string, direction: 'up' | 'down') {
  await assertPageOwner(pageId);
  const rows = await q(`SELECT id FROM bl_blocks WHERE page_id = $1 ORDER BY position, created_at`, [pageId]);
  const ids = rows.map((r) => r.id as string);
  const i = ids.indexOf(blockId);
  const j = direction === 'up' ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await reorderBlocks(pageId, ids);
}

/** 끌어서 바꾼 순서를 그대로 저장 */
export async function reorderBlocks(pageId: string, orderedIds: string[]) {
  await assertPageOwner(pageId);
  const rows = await q(`SELECT id FROM bl_blocks WHERE page_id = $1`, [pageId]);
  const valid = new Set(rows.map((r) => r.id as string));
  const ids = orderedIds.filter((id) => valid.has(id));
  if (ids.length !== valid.size) throw new Error('블록 목록이 최신이 아니에요. 새로고침 후 다시 시도해주세요.');

  await tx(async (run) => {
    for (let i = 0; i < ids.length; i++) {
      await run(`UPDATE bl_blocks SET position = $1 WHERE id = $2 AND page_id = $3`, [i, ids[i], pageId]);
    }
  });
  await touch(pageId);
  revalidatePath(`/edit/${pageId}`);
}

/** 블록 복사 (바로 아래에) */
export async function duplicateBlock(pageId: string, blockId: string) {
  await assertPageOwner(pageId);
  const copy = await tx(async (run) => {
    const [src] = await run(`SELECT * FROM bl_blocks WHERE id = $1 AND page_id = $2`, [blockId, pageId]);
    if (!src) throw new Error('블록을 찾을 수 없어요');
    await run(`UPDATE bl_blocks SET position = position + 1 WHERE page_id = $1 AND position > $2`, [pageId, src.position]);
    const [row] = await run(
      `INSERT INTO bl_blocks (page_id, type, position, data, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [pageId, src.type, src.position + 1, JSON.stringify(src.data || {}), src.is_active]
    );
    return row;
  });
  await touch(pageId);
  revalidatePath(`/edit/${pageId}`);
  return serialize(copy);
}

/** 켜기/끄기 (값 그대로 저장) */
export async function setBlockActive(pageId: string, blockId: string, active: boolean) {
  await assertPageOwner(pageId);
  await q(`UPDATE bl_blocks SET is_active = $1, updated_at = now() WHERE id = $2 AND page_id = $3`, [
    !!active,
    blockId,
    pageId,
  ]);
  await touch(pageId);
  revalidatePath(`/edit/${pageId}`);
}

/** 켜기/끄기 뒤집기 (예전 메뉴용) */
export async function toggleBlockActive(pageId: string, blockId: string) {
  await assertPageOwner(pageId);
  await q(`UPDATE bl_blocks SET is_active = NOT is_active WHERE id = $1 AND page_id = $2`, [blockId, pageId]);
  revalidatePath(`/edit/${pageId}`);
}

/** DB 행 → 화면에 넘길 수 있는 평범한 객체 (날짜를 글자로) */
function serialize(row: any) {
  if (!row) return row;
  return {
    ...row,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

// ===== 블록 타입별 기본 데이터 =====
function getDefaultBlockData(type: BlockType): any {
  switch (type) {
    case 'profile':
      return { name: '내 이름', bio: '한 줄 소개', initial: '?', layout: 'circle', titleSize: 'm' };
    case 'link':
      return { title: '', url: '', cardSize: 's' };
    case 'link_collection':
      return { title: '', links: [], layout: 'list', collapse: false };
    case 'video':
      return { url: '', title: '' };
    case 'image_banner':
      return { title: '', images: [], layout: 'single', ratio: 'square' };
    case 'spacer':
      return { size: 'm', line: false };
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
      return { variant: 'heading', text: '제목을 입력하세요', align: 'center' };
    case 'sns':
      return { links: [] };
    default:
      return {};
  }
}
