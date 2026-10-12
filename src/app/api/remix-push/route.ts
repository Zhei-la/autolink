import { NextResponse } from "next/server";
import { one, q } from "@/lib/server/db";
import { isUuid } from "@/lib/utils";

/**
 * 쇼츠 리믹서 등 외부 자동화 프로그램이 상품을 밀어넣는 엔드포인트.
 *
 * 수정 이력 (2026-09):
 * - 이전에는 익명(anon) 클라이언트로 blocks 를 UPDATE 했는데, RLS 때문에 0행이 수정되면서도
 *   에러가 없어 success:true 를 돌려주던 버그 → 서비스 롤 클라이언트로 교체
 * - REMIX_PUSH_SECRET 환경변수가 비어 있으면 인증이 통째로 우회되던 문제 → 미설정 시 무조건 거부
 */
export async function POST(req: Request) {
  try {
    const expected = process.env.REMIX_PUSH_SECRET;
    if (!expected) {
      return NextResponse.json(
        { success: false, error: "REMIX_PUSH_SECRET is not configured" },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, error: "invalid json" }, { status: 400 });
    }

    const { pageId, secret, products } = body;

    if (typeof secret !== "string" || secret !== expected) {
      return NextResponse.json({ success: false, error: "invalid secret" }, { status: 401 });
    }

    if (!pageId || !Array.isArray(products)) {
      return NextResponse.json({ success: false, error: "invalid payload" }, { status: 400 });
    }

    if (!isUuid(String(pageId))) {
      return NextResponse.json({ success: false, error: "page not found" }, { status: 404 });
    }
    const page = await one(`SELECT id FROM bl_pages WHERE id = $1`, [pageId]);
    if (!page) {
      return NextResponse.json({ success: false, error: "page not found" }, { status: 404 });
    }

    // 마지막 product_grid 찾기
    const existingBlock = await one(
      `SELECT * FROM bl_blocks WHERE page_id = $1 AND type = 'product_grid' ORDER BY position DESC LIMIT 1`,
      [pageId]
    );

    if (existingBlock) {
      const oldProducts = existingBlock.data?.products || [];
      const mergedProducts = [...products, ...oldProducts];
      await q(`UPDATE bl_blocks SET data = $1, updated_at = now() WHERE id = $2`, [
        JSON.stringify({ ...existingBlock.data, products: mergedProducts }),
        existingBlock.id,
      ]);
      return NextResponse.json({ success: true, updated: true, blockId: existingBlock.id, total: mergedProducts.length });
    }

    const last = await one<{ position: number }>(
      `SELECT position FROM bl_blocks WHERE page_id = $1 ORDER BY position DESC LIMIT 1`,
      [pageId]
    );
    const nextPosition = last ? last.position + 1 : 0;
    const created = await one<{ id: string }>(
      `INSERT INTO bl_blocks (page_id, type, position, data) VALUES ($1, 'product_grid', $2, $3) RETURNING id`,
      [pageId, nextPosition, JSON.stringify({ title: "쇼츠 추천 상품", products })]
    );

    return NextResponse.json({ success: true, created: true, blockId: created!.id, total: products.length });
  } catch (err: any) {
    console.error("[remix-push]", err);
    return NextResponse.json({ success: false, error: err.message || "server error" }, { status: 500 });
  }
}
