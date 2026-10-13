'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Check, ChevronDown, Copy, ExternalLink, LayoutGrid, LogOut, Plus, Settings, ShieldCheck, X } from 'lucide-react';
import { useModalHistory } from '@/hooks/useModalHistory';
import { publicPath, publicUrl } from '@/lib/theme';
import { withBase } from '@/lib/utils';
import { LogoMark } from '@/components/brand/Logo';

interface NavPage {
  id: string;
  title: string;
  slug: string;
  avatar?: string | null;
}

/**
 * By링크 편집 화면 머리: 로고 · 내 페이지 고르기 · 주소 복사 / 그 아래 탭(블록 · 꾸미기 · 통계 · 받은 문의)
 */
export function EditorHeader({
  pageId,
  pages,
  isAdmin,
  userName,
  canCreate,
}: {
  pageId: string;
  pages: NavPage[];
  isAdmin: boolean;
  userName: string;
  canCreate: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');
  useEffect(() => setOrigin(window.location.origin), []);
  useModalHistory(open, () => setOpen(false));

  const current = pages.find((p) => p.id === pageId) || pages[0];
  const slug = current?.slug || '';
  const url = publicUrl(slug, origin);
  const label = url.replace(/^https?:\/\//, '');

  const base = `/edit/${pageId}`;
  const tabs = [
    { href: base, label: '블록', active: pathname === base },
    { href: `${base}/design`, label: '꾸미기', active: pathname.startsWith(`${base}/design`) },
    { href: `${base}/stats`, label: '통계', active: pathname.startsWith(`${base}/stats`) },
    { href: `${base}/manage`, label: '받은 문의', active: pathname.startsWith(`${base}/manage`) },
  ];

  /**
   * 메뉴 안에서 다른 화면으로 이동: 메뉴를 닫을 때 생기는 '뒤로가기'가 끝난 다음에 이동해야
   * 이동이 취소되지 않음 (전에는 다른 페이지를 눌러도 같은 페이지에 머물렀음)
   */
  function go(href: string) {
    return (e: React.MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // 새 탭 열기는 그대로
      e.preventDefault();
      const hasModalEntry = typeof window !== 'undefined' && !!window.history.state?.alModal;
      if (hasModalEntry) {
        const onPop = () => {
          window.removeEventListener('popstate', onPop);
          setTimeout(() => router.push(href), 0);
        };
        window.addEventListener('popstate', onPop);
        setOpen(false);
      } else {
        setOpen(false);
        router.push(href);
      }
    };
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-line">
        <div className="mx-auto max-w-[1080px] px-4">
          <div className="h-14 flex items-center gap-2">
            <Link href="/dashboard" aria-label="내 페이지 목록" className="flex-shrink-0 bl-ring rounded-lg">
              <LogoMark size={28} />
            </Link>

            <button
              type="button"
              onClick={() => setOpen(true)}
              className="min-w-0 h-10 pl-1.5 pr-2.5 rounded-full hover:bg-mist flex items-center gap-2 bl-ring"
              aria-label="다른 페이지로 바꾸기"
            >
              <Avatar page={current} size={28} />
              <span className="min-w-0 text-left">
                <span className="block text-[14px] font-bold text-ink truncate leading-tight">{current?.title || '내 페이지'}</span>
              </span>
              <ChevronDown className="w-4 h-4 text-[#8b8b90] flex-shrink-0" />
            </button>

            <div className="flex-1" />

            <button
              type="button"
              onClick={copy}
              className="hidden md:flex items-center gap-2 h-9 pl-3 pr-2 rounded-full bg-mist text-[13px] text-[#3f3f44] max-w-[340px] bl-ring"
              title="주소 복사"
            >
              <span className="truncate">{label}</span>
              <span className={`h-6 px-2 rounded-full text-[12px] font-semibold flex items-center gap-1 ${copied ? 'bg-cherry text-white' : 'bg-white text-ink'}`}>
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? '복사됨' : '복사'}
              </span>
            </button>
            <button
              type="button"
              onClick={copy}
              aria-label="주소 복사"
              className={`md:hidden w-9 h-9 rounded-full flex items-center justify-center bl-ring ${copied ? 'bg-cherry text-white' : 'text-ink hover:bg-mist'}`}
            >
              {copied ? <Check className="w-[18px] h-[18px]" /> : <Copy className="w-[18px] h-[18px]" />}
            </button>
            <a
              href={publicPath(slug)}
              target="_blank"
              rel="noopener"
              aria-label="내 페이지 새 창으로 열기"
              className="w-9 h-9 rounded-full flex items-center justify-center text-ink hover:bg-mist bl-ring"
            >
              <ExternalLink className="w-[18px] h-[18px]" />
            </a>
          </div>

          <nav className="flex items-end gap-5 h-11 -mb-px overflow-x-auto [scrollbar-width:none]" aria-label="편집 메뉴">
            {tabs.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                aria-current={t.active ? 'page' : undefined}
                className={`relative h-full flex items-center text-[15px] whitespace-nowrap transition ${
                  t.active ? 'text-ink font-bold' : 'text-[#8b8b90] font-medium hover:text-ink'
                }`}
              >
                {t.label}
                <span className={`absolute left-0 right-0 bottom-0 h-[3px] rounded-full ${t.active ? 'bg-cherry' : 'bg-transparent'}`} />
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {copied && (
        <div className="md:hidden fixed top-[64px] left-1/2 -translate-x-1/2 z-50 h-9 px-4 rounded-full bg-ink text-white text-[13px] font-semibold flex items-center shadow-lg">
          주소를 복사했어요
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[60] bg-ink/40 flex items-end md:items-start md:justify-start justify-center" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full md:w-[360px] md:mt-[60px] md:ml-[max(16px,calc((100vw-1080px)/2+16px))] rounded-t-[24px] md:rounded-[20px] md:border md:border-line md:shadow-xl pb-[calc(env(safe-area-inset-bottom)+12px)] md:pb-3"
          >
            <div className="flex items-center justify-between px-5 h-14">
              <div className="min-w-0">
                <div className="font-extrabold text-[16px] text-ink">내 페이지</div>
                <div className="text-[12px] text-[#8b8b90] truncate">{userName}</div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="닫기" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-mist">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-3">
              {pages.map((p) => {
                const on = p.id === pageId;
                return (
                  <Link
                    key={p.id}
                    href={`/edit/${p.id}`}
                    onClick={go(`/edit/${p.id}`)}
                    className={`flex items-center gap-3 px-2.5 py-2.5 rounded-[14px] ${on ? 'bg-mist' : 'hover:bg-mist'}`}
                  >
                    <Avatar page={p} size={40} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[15px] font-bold text-ink truncate">{p.title}</span>
                      <span className="block text-[12px] text-[#8b8b90] truncate">{publicPath(p.slug)}</span>
                    </span>
                    {on && <span className="w-2 h-2 rounded-full bg-cherry flex-shrink-0" aria-label="지금 편집 중" />}
                  </Link>
                );
              })}
              {canCreate && (
                <Link
                  href="/dashboard/new"
                  onClick={go('/dashboard/new')}
                  className="flex items-center gap-3 px-2.5 py-2.5 rounded-[14px] hover:bg-mist text-[#3f3f44]"
                >
                  <span className="w-10 h-10 rounded-full border-2 border-dashed border-line flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </span>
                  <span className="text-[15px] font-semibold">새 페이지 만들기</span>
                </Link>
              )}
            </div>

            <div className="mt-2 mx-5 border-t border-line pt-1">
              <MenuRow href="/dashboard" Icon={LayoutGrid} label="내 페이지 목록" onClick={go('/dashboard')} />
              <MenuRow href={`/edit/${pageId}/settings`} Icon={Settings} label="주소 · 공개 · 삭제" onClick={go(`/edit/${pageId}/settings`)} />
              {isAdmin && <MenuRow href="/admin" Icon={ShieldCheck} label="운영자 관리" onClick={go('/admin')} />}
              <form action={withBase('/auth/signout')} method="post">
                <button className="w-full flex items-center gap-3 h-12 text-[15px] text-[#8b8b90]">
                  <LogOut className="w-[18px] h-[18px]" /> 로그아웃
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Avatar({ page, size }: { page?: NavPage; size: number }) {
  return (
    <span
      className="rounded-full overflow-hidden bg-ink text-white flex items-center justify-center font-bold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {page?.avatar ? <img src={page.avatar} alt="" className="w-full h-full object-cover" /> : (page?.title || '?').slice(0, 1)}
    </span>
  );
}

function MenuRow({
  href,
  Icon,
  label,
  onClick,
}: {
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-3 h-12 text-[15px] text-ink">
      <Icon className="w-[18px] h-[18px]" /> {label}
    </Link>
  );
}
