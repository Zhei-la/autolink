/**
 * By링크 로고 — 바이란 링크.
 * 표기는 반드시 "By링크" (B 대문자 + y 소문자 + 한글 링크).
 */
export function LogoMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-[28%] bg-[#111111] text-white select-none ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontStyle: 'italic',
          fontWeight: 700,
          fontSize: size * 0.48,
          letterSpacing: '-0.04em',
          lineHeight: 1,
        }}
      >
        By
      </span>
    </span>
  );
}

export function Wordmark({ className = '', size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const px = size === 'lg' ? 26 : size === 'sm' ? 15 : 19;
  return (
    <span className={`inline-flex items-baseline ${className}`} style={{ fontSize: px, lineHeight: 1 }}>
      <span
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontStyle: 'italic',
          fontWeight: 700,
          letterSpacing: '-0.03em',
        }}
      >
        By
      </span>
      <span style={{ fontWeight: 800, letterSpacing: '-0.04em' }}>링크</span>
    </span>
  );
}

export function Logo({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const mark = size === 'lg' ? 44 : size === 'sm' ? 26 : 32;
  return (
    <span className={`inline-flex items-center gap-2 text-[#111111] ${className}`}>
      <LogoMark size={mark} />
      <Wordmark size={size} />
    </span>
  );
}
