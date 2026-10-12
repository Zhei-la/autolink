import { NextResponse } from 'next/server';
import { getMyAccount } from '@/lib/db/account';
import { one, tx } from '@/lib/server/db';
import { isValidSlug, RESERVED_SLUGS, withBase } from '@/lib/utils';
import { DEFAULT_THEME } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * 페이지 한 번에 만들기 (다른 링크 페이지에서 옮겨올 때 사용)
 * body: { title, slug, theme, blocks: [{ type, data, is_active? }] }
 * - 로그인한 회원 본인 계정에 새 페이지로 만든다
 * - 사진 주소가 리틀리·네이버 이미지 서버면 By링크로 복사해 온다 (원본이 지워져도 안 깨지게)
 */
const ALLOWED_TYPES = new Set([
  'profile', 'link', 'product_grid', 'inquiry', 'calendar', 'email', 'text', 'sns',
  'link_collection', 'video', 'image_banner', 'spacer',
]);
const COPY_HOSTS = [/^cdn\.litt\.ly$/, /(^|\.)pstatic\.net$/];
const IMAGE_KEYS = new Set(['avatarUrl', 'thumbnail', 'bgImage', 'footerLogoUrl']);
const MAX_IMAGE = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const { user, effectiveStatus } = await getMyAccount();
  if (!user) return NextResponse.json({ error: '로그인이 필요해요' }, { status: 401 });
  if (effectiveStatus !== 'active') return NextResponse.json({ error: '지금은 편집할 수 없는 계정이에요' }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.blocks)) return NextResponse.json({ error: '내용이 비어 있어요' }, { status: 400 });

  const slug = String(body.slug || '').trim().toLowerCase();
  if (!isValidSlug(slug) || RESERVED_SLUGS.has(slug)) return NextResponse.json({ error: '주소 형식이 맞지 않아요' }, { status: 400 });
  if (await one(`SELECT 1 FROM bl_pages WHERE slug = $1`, [slug])) {
    return NextResponse.json({ error: '이미 사용 중인 주소예요' }, { status: 409 });
  }
  const title = String(body.title || '').slice(0, 50) || '내 링크 페이지';
  const blocks = (body.blocks as any[]).filter((b) => b && ALLOWED_TYPES.has(b.type)).slice(0, 60);

  // 사진 복사 (같은 주소는 한 번만)
  const cache = new Map<string, string>();
  const copy = async (url: string): Promise<string> => {
    if (cache.has(url)) return cache.get(url)!;
    let out = url;
    try {
      const u = new URL(url);
      if (u.protocol === 'https:' && COPY_HOSTS.some((re) => re.test(u.hostname))) {
        const res = await fetch(u.toString(), { signal: AbortSignal.timeout(15000) });
        const mime = (res.headers.get('content-type') || '').split(';')[0].trim();
        if (res.ok && /^image\/(png|jpe?g|webp|gif)$/.test(mime)) {
          const buf = Buffer.from(await res.arrayBuffer());
          if (buf.length > 0 && buf.length <= MAX_IMAGE) {
            const row = await one<{ id: string }>(`INSERT INTO bl_images (user_id, mime, data) VALUES ($1, $2, $3) RETURNING id`, [
              user.id,
              mime === 'image/jpg' ? 'image/jpeg' : mime,
              buf,
            ]);
            out = withBase(`/img/${row!.id}`);
          }
        }
      }
    } catch (e) {
      console.error('[가져오기] 사진 복사 실패', url, (e as Error).message);
    }
    cache.set(url, out);
    return out;
  };
  const walk = async (v: any, key?: string): Promise<any> => {
    if (typeof v === 'string') return key && IMAGE_KEYS.has(key) && /^https:\/\//.test(v) ? copy(v) : v;
    if (Array.isArray(v)) {
      const arr: any[] = [];
      for (const item of v) {
        if (key === 'images' && item && typeof item.url === 'string') arr.push({ ...(await walk(item)), url: await copy(item.url) });
        else arr.push(await walk(item));
      }
      return arr;
    }
    if (v && typeof v === 'object') {
      const o: any = {};
      for (const [k, val] of Object.entries(v)) o[k] = await walk(val, k);
      return o;
    }
    return v;
  };

  const theme = await walk({ ...DEFAULT_THEME, ...(body.theme || {}) });
  const prepared: { type: string; data: any; active: boolean }[] = [];
  for (const b of blocks) prepared.push({ type: b.type, data: await walk(b.data || {}), active: b.is_active !== false });

  const pageId = await tx(async (run) => {
    const [page] = await run(`INSERT INTO bl_pages (user_id, slug, title, theme) VALUES ($1, $2, $3, $4) RETURNING id`, [
      user.id,
      slug,
      title,
      JSON.stringify(theme),
    ]);
    let pos = 0;
    for (const b of prepared) {
      await run(`INSERT INTO bl_blocks (page_id, type, position, data, is_active) VALUES ($1, $2, $3, $4, $5)`, [
        page.id,
        b.type,
        pos++,
        JSON.stringify(b.data),
        b.active,
      ]);
    }
    return page.id as string;
  });

  return NextResponse.json({ ok: true, id: pageId, slug });
}
