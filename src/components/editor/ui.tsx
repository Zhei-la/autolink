'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { uploadImage, type UploadPreset } from '@/lib/upload';

/** 편집기 공통 UI — By링크 톤: 먹색 글자 + 체리 포인트, 칸은 옅은 회색 바탕 */

export function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-1.5">
      <span className="text-[13px] font-semibold text-[#3f3f44]">{children}</span>
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
          {required && <span className="ml-0.5 text-cherry">*</span>}
        </FieldLabel>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full h-12 px-3.5 rounded-[12px] border border-transparent bg-mist text-[15px] text-ink placeholder:text-[#a9a9ae] outline-none focus:bg-white focus:border-ink focus:shadow-[0_0_0_3px_#ffedf1] transition"
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
        className="w-full px-3.5 py-3 rounded-[12px] border border-transparent bg-mist text-[15px] text-ink placeholder:text-[#a9a9ae] outline-none focus:bg-white focus:border-ink focus:shadow-[0_0_0_3px_#ffedf1] transition resize-none"
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
      <div className="grid gap-1 p-1 rounded-[14px] bg-mist" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={value === o.value}
            className={`h-10 rounded-[10px] text-[14px] font-semibold transition bl-ring ${
              value === o.value ? 'bg-white text-ink shadow-[0_1px_3px_rgba(23,23,23,0.14)]' : 'text-[#8b8b90]'
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
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              aria-pressed={on}
              className="relative flex flex-col items-center gap-1.5 bl-ring rounded-[14px]"
            >
              <span
                className={`w-full aspect-[5/4] rounded-[14px] flex items-center justify-center transition border-2 ${
                  on ? 'border-ink bg-white text-ink' : 'border-transparent bg-mist text-[#b9b9be]'
                }`}
              >
                {o.icon}
              </span>
              {on && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cherry" />}
              <span className={`text-[12px] ${on ? 'text-ink font-bold' : 'text-[#8b8b90]'}`}>{o.label}</span>
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
      style={{ width: w, height: h, backgroundColor: checked ? '#171717' : '#dcdce0' }}
    >
      <span
        className="absolute top-[3px] rounded-full bg-white shadow transition-all"
        style={{ width: k, height: k, left: checked ? w - k - 3 : 3 }}
      />
      <span
        className="absolute inset-0 flex items-center text-[9px] font-bold text-white pointer-events-none"
        style={{ justifyContent: checked ? 'flex-start' : 'flex-end', padding: '0 6px' }}
      >
        {''}
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
          className={`${box} overflow-hidden flex flex-col items-center justify-center gap-1 bg-mist text-[#8b8b90] text-xs hover:bg-[#ededef] transition bl-ring`}
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
            className="absolute right-2 bottom-2 h-8 px-2.5 rounded-full bg-ink/85 text-white text-[12px] font-semibold flex items-center gap-1 backdrop-blur"
          >
            <Trash2 className="w-3.5 h-3.5" /> 빼기
          </button>
        )}
      </div>
      {error && <p className="text-xs text-cherry mt-1.5">{error}</p>}
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
        className="w-full h-full rounded-[12px] overflow-hidden bg-mist flex items-center justify-center text-[#8b8b90] hover:bg-[#ededef] transition bl-ring"
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
          className="absolute -right-1.5 -top-1.5 w-6 h-6 rounded-full bg-ink text-white flex items-center justify-center ring-2 ring-white"
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
          <button type="button" onClick={onCancel} className="h-11 rounded-xl bg-mist text-sm font-semibold">
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`h-11 rounded-xl text-sm font-semibold text-white ${danger ? 'bg-cherry' : 'bg-ink'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
