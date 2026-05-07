"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { uploadImage } from "@/lib/upload";

export function ImageUpload({
  value,
  onChange,
  label,
}: {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFile(file?: File) {
    if (!file) return;

    try {
      setLoading(true);

      const url = await uploadImage(file);

      onChange(url);
    } catch (e) {
      alert("이미지 업로드 실패");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {label && (
        <div className="text-sm font-bold">
          {label}
        </div>
      )}

      {value && (
        <div className="w-28 h-28 rounded-2xl overflow-hidden border border-border">
          <img
            src={value}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="h-11 px-4 rounded-xl border border-border hover:border-primary hover:bg-primary-soft transition text-sm font-bold inline-flex items-center gap-2"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ImagePlus className="w-4 h-4" />
        )}

        {loading ? "업로드 중..." : "이미지 선택"}
      </button>
    </div>
  );
}