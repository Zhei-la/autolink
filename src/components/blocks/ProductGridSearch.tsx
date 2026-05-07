"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export function ProductGridSearch({
  blockId,
  title,
  products,
  primaryColor,
  isPublic,
}: {
  blockId: string;
  title?: string;
  products: any[];
  primaryColor: string;
  isPublic: boolean;
}) {
  const [query, setQuery] = useState("");

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return products;

    return products.filter((product) => {
      const text = [
        product.title,
        product.name,
        product.price,
        product.discount,
        product.url,
        product.description,
        product.id,
        product.code,
        product.number,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(q);
    });
  }, [query, products]);

  return (
    <div className="space-y-3">
      {title && <h3 className="font-bold">{title}</h3>}

      {isPublic && products.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="상품명이나 번호를 검색하세요"
            className="w-full h-11 pl-9 pr-4 rounded-xl border border-border bg-white text-sm outline-none focus:border-primary"
          />
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-border rounded-xl text-text-3 text-sm">
          상품을 추가해주세요
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-8 border border-border rounded-xl text-text-3 text-sm bg-white">
          검색 결과가 없어요
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map((product: any) => {
            const Wrapper: any = isPublic ? "a" : "div";
            const wrapperProps = isPublic
              ? {
                  href: `/api/click/${blockId}?to=${encodeURIComponent(product.url || "#")}`,
                  target: "_blank",
                  rel: "noopener",
                }
              : {};

            return (
              <Wrapper
                key={product.id}
                {...wrapperProps}
                className="bg-white border border-border rounded-xl overflow-hidden hover:border-primary transition cursor-pointer"
              >
                <div className="aspect-square bg-text-3/10">
                  {product.thumbnail && (
                    <img
                      src={product.thumbnail}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <div className="p-3">
                  <div className="text-sm font-bold line-clamp-2 mb-1">
                    {product.title}
                  </div>

                  {product.discount > 0 && (
                    <span className="text-xs font-bold text-red-500 mr-1">
                      {product.discount}%
                    </span>
                  )}

                  {product.price > 0 && (
                    <span className="text-sm font-bold">
                      {formatPrice(product.price)}
                    </span>
                  )}
                </div>
              </Wrapper>
            );
          })}
        </div>
      )}
    </div>
  );
}