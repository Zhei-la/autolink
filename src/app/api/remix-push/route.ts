import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

    const supabase = createAdminClient();

    // 페이지 존재 확인
    const { data: page } = await supabase.from("pages").select("id").eq("id", pageId).maybeSingle();
    if (!page) {
      return NextResponse.json({ success: false, error: "page not found" }, { status: 404 });
    }

    // 마지막 product_grid 찾기
    const { data: existingBlock } = await supabase
      .from("blocks")
      .select("*")
      .eq("page_id", pageId)
      .eq("type", "product_grid")
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingBlock) {
      const oldProducts = existingBlock.data?.products || [];
      const mergedProducts = [...products, ...oldProducts];

      const { error } = await supabase
        .from("blocks")
        .update({ data: { ...existingBlock.data, products: mergedProducts } })
        .eq("id", existingBlock.id);

      if (error) throw error;

      return NextResponse.json({ success: true, updated: true, blockId: existingBlock.id, total: mergedProducts.length });
    }

    const { data: lastBlock } = await supabase
      .from("blocks")
      .select("position")
      .eq("page_id", pageId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextPosition = lastBlock ? lastBlock.position + 1 : 0;

    const { data: created, error } = await supabase
      .from("blocks")
      .insert({
        page_id: pageId,
        type: "product_grid",
        position: nextPosition,
        data: { title: "쇼츠 추천 상품", products },
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, created: true, blockId: created.id, total: products.length });
  } catch (err: any) {
    console.error("[remix-push]", err);
    return NextResponse.json({ success: false, error: err.message || "server error" }, { status: 500 });
  }
}
