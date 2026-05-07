"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { BlockPreview } from "@/components/blocks/BlockPreview";
import type { Block } from "@/types";

function getBlockSearchText(block: any) {
  const data = block.data || {};

  if (block.type === "product_grid") {
    const products = data.products || [];

    return products
      .map((product: any) =>
        [
          product.title,
          product.name,
          product.code,
          product.number,
          product.id,
          product.price,
          product.url,
          product.description,
        ]
          .filter(Boolean)
          .join(" ")
      )
      .join(" ");
  }

  if (block.type === "link") {
    return [data.title, data.url, data.description, data.code, data.number]
      .filter(Boolean)
      .join(" ");
  }

  return [
    data.title,
    data.name,
    data.bio,
    data.text,
    data.description,
    data.buttonText,
  ]
    .filter(Boolean)
    .join(" ");
}

export function PublicPageClient({
  blocks,
  primaryColor,
}: {
  blocks: Block[];
  primaryColor: string;
}) {
  const [query, setQuery] = useState("");

  const filteredBlocks = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return blocks;

    return blocks.filter((block: any) => {
      const text = getBlockSearchText(block).toLowerCase();
      return text.includes(q);
    });
  }, [query, blocks]);

  return (
    <div className="space-y-3">
      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="상품명이나 번호를 검색하세요"
          className="w-full h-12 pl-9 pr-4 rounded-2xl border border-border bg-white text-sm outline-none focus:border-primary shadow-sm"
        />
      </div>

      {filteredBlocks.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-6 text-center text-sm text-text-3">
          검색 결과가 없어요
        </div>
      ) : (
        filteredBlocks.map((block) => (
          <BlockPreview
            key={block.id}
            block={block as Block}
            primaryColor={primaryColor}
            isPublic={true}
          />
        ))
      )}
    </div>
  );
}