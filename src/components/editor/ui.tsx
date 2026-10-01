'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { uploadImage, type UploadPreset } from '@/lib/upload';

/** 편집기 공통 UI — 리틀리처럼 흑백 톤, 라벨은 회색 작은 글씨 */

export function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-1.5">
      <span className="text-[13px] font-medium text-[#6b6b70]">{children}</span>
      {hint && <span className="text-[11px] text-[#a1a1a6]">{hint}</span>}
    </div>
  );
}

export function TextField({
  label,
  hint,
  value,
  onChange,
  placeholder,
  maxLength,
  type = 'text',
  required,
}: {
  label?: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      {label && (
        <FieldLabel hint={hint}>
          {label}
          {required && <span className="text-[#ef4444]">*</span>}
        </FieldLabel>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full h-12 px-3.5 rounded-xl border border-[#e4e4e7] bg-white text-[15px] text-[#111] placeholder:text-[#b4b4b8] outline-none focus:border-[#111] transition"
      />
    </label>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  maxLength,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}) {
  return (
    <label className="block">
      {label && <FieldLabel>{label}</FieldLabel>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className="w-full px-3.5 py-3 rounded-xl border border-[#e4e4e7] bg-white text-[15px] text-[#111] placeholder:text-[#b4b4b8] outline-none focus:border-[#111] transition resize-none"
      />
    </label>
  );
}

/** 소·중·대 같은 짧은 선택지 */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`h-11 rounded-xl text-sm font-semibold transition ${
              value === o.value ? 'bg-[#111] text-white' : 'bg-white border border-[#e4e4e7] text-[#9a9aa0]'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** 그림 아이콘 + 이름으로 고르는 레이아웃 선택 */
export function LayoutPicker<T extends string>({
  label,
  value,
  options,
  onChange,
  columns = 3,
}: {
  label?: string;
  value: T;
  options: { value: T; label: string; icon: React.ReactNode }[];
  onChange: (v: T) => void;
  columns?: number;
}) {
  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {options.map((o) => {
          const on = value === o.value;
          return (
            <button key={o.value} type="button" onClick={() => onChange(o.value)} className="flex flex-col items-center gap-1.5">
              <span
                className={`w-full aspect-square rounded-xl flex items-center justify-center transition ${
                  on ? 'bg-[#111] text-white' : 'bg-white border border-[#e4e4e7] text-[#c4c4c8]'
                }`}
              >
                {o.icon}
              </span>
              <span className={`text-[12px] ${on ? 'text-[#111] font-semibold' : 'text-[#9a9aa0]'}`}>{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  size = 'md',
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  size?: 'sm' | 'md';
}) {
  const w = size === 'sm' ? 38 : 46;
  const h = size === 'sm' ? 22 : 26;
  const k = h - 6;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className="relative flex-shrink-0 rounded-full transition-colors"
      style={{ width: w, height: h, backgroundColor: checked ? '#22c55e' : '#d4d4d8' }}
    >
      <span
        className="absolute top-[3px] rounded-full bg-white shadow transition-all"
        style={{ width: k, height: k, left: checked ? w - k - 3 : 3 }}
      />
      <span
        className="absolute inset-0 flex items-center text-[9px] font-bold text-white pointer-events-none"
        style={{ justifyContent: checked ? 'flex-start' : 'flex-end', padding: '0 6px' }}
      >
        {size === 'md' ? (checked ? 'ON' : '') : ''}
      </span>
    </button>
  );
}

/** 이미지 1장 업로드 칸 (미리보기 + 빨간 삭제 버튼) */
export function ImageField({
  label,
  hint,
  value,
  onChange,
  preset = 'gallery',
  shape = 'square',
}: {
  label?: string;
  hint?: string;
  value?: string;
  onChange: (url: string) => void;
  preset?: UploadPreset;
  shape?: 'square' | 'wide' | 'circle';
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(file?: File) {
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const url = await uploadImage(file, preset);
      onChange(url);
    } catch (e: any) {
      setError(e?.message || '업로드에 실패했어요');
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const box =
    shape === 'wide'
      ? 'w-full aspect-[16/9] rounded-2xl'
      : shape === 'circle'
        ? 'w-28 h-28 rounded-full'
        : 'w-28 h-28 rounded-2xl';

  return (
    <div>
      {label && <FieldLabel hint={hint}>{label}</FieldLabel>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handle(e.target.files?.[0])}
      />
      <div className={`relative ${shape === 'wide' ? '' : 'inline-block'}`}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className={`${box} overflow-hidden flex flex-col items-center justify-center gap-1 border border-dashed border-[#d4d4d8] bg-[#fafafa] text-[#9a9aa0] text-xs`}
        >
          {value ? (
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <ImagePlus className="w-5 h-5" />
              사진 올리기
            </>
          )}
          {value && loading && (
            <span className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-[#111]" />
            </span>
          )}
        </button>
        {value && !loading && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="사진 삭제"
            className="absolute -right-2 -bottom-2 w-9 h-9 rounded-full bg-[#ef4444] text-white flex items-center justify-center shadow-md"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      {error && <p className="text-xs text-[#ef4444] mt-1.5">{error}</p>}
    </div>
  );
}

/** 작은 썸네일 업로드 (링크 카드 옆에 붙는 정사각) */
export function ThumbButton({
  value,
  onChange,
  size = 48,
}: {
  value?: string;
  onChange: (url: string) => void;
  size?: number;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);

  async function handle(file?: File) {
    if (!file) return;
    setLoading(true);
    try {
      onChange(await uploadImage(file, 'thumb'));
    } catch (e: any) {
      alert(e?.message || '업로드에 실패했어요');
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => handle(e.target.files?.[0])} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full h-full rounded-xl overflow-hidden border border-dashed border-[#d4d4d8] bg-[#fafafa] flex items-center justify-center text-[#a1a1a6]"
        aria-label="썸네일 올리기"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : value ? (
          <img src={value} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImagePlus className="w-4 h-4" />
        )}
      </button>
      {value && !loading && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="썸네일 삭제"
          className="absolute -right-1.5 -bottom-1.5 w-6 h-6 rounded-full bg-[#ef4444] text-white flex items-center justify-center shadow"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

/** 확인 창 — 브라우저 confirm() 대신 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = '확인',
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] bg-black/40 flex items-center justify-center p-6" onClick={onCancel}>
      <div className="w-full max-w-[320px] bg-white rounded-2xl p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        {title && <div className="font-bold text-[16px] mb-1.5">{title}</div>}
        <p className="text-[14px] text-[#444] whitespace-pre-line leading-relaxed">{message}</p>
        <div className="grid grid-cols-2 gap-2 mt-5">
          <button type="button" onClick={onCancel} className="h-11 rounded-xl border border-[#e4e4e7] text-sm font-semibold">
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`h-11 rounded-xl text-sm font-semibold text-white ${danger ? 'bg-[#ef4444]' : 'bg-[#3b82f6]'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
