import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      pageId,
      secret,
      products,
    } = body;

    if (
      secret !== process.env.REMIX_PUSH_SECRET
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "invalid secret",
        },
        { status: 401 }
      );
    }

    if (!pageId || !Array.isArray(products)) {
      return NextResponse.json(
        {
          success: false,
          error: "invalid payload",
        },
        { status: 400 }
      );
    }

    const supabase = createClient();

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
      const oldProducts =
        existingBlock.data?.products || [];

      const mergedProducts = [
        ...products,
        ...oldProducts,
      ];

      const { error } = await supabase
        .from("blocks")
        .update({
          data: {
            ...existingBlock.data,
            products: mergedProducts,
          },
        })
        .eq("id", existingBlock.id);

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        updated: true,
      });
    }

    // 마지막 position 찾기
    const { data: lastBlock } = await supabase
      .from("blocks")
      .select("position")
      .eq("page_id", pageId)
      .order("position", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    const nextPosition =
      lastBlock?.position + 1 || 0;

    const { error } = await supabase
      .from("blocks")
      .insert({
        page_id: pageId,
        type: "product_grid",
        position: nextPosition,
        data: {
          title: "쇼츠 추천 상품",
          products,
        },
      });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      created: true,
    });
  } catch (err: any) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error: err.message || "server error",
      },
      { status: 500 }
    );
  }
}