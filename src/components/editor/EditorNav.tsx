'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { BarChart3, Check, ClipboardList, FileText, LayoutGrid, LogOut, Palette, Plus, Settings, ShieldCheck, X } from 'lucide-react';
import { useModalHistory } from '@/hooks/useModalHistory';
import { withBase } from '@/lib/utils';

interface NavPage {
  id: string;
  title: string;
  slug: string;
  avatar?: string | null;
}

/** 편집기 하단 검은 메뉴 (리틀리식): 페이지 · 디자인 · 분석 · 관리 · 내 페이지 전환 */
export function EditorNav({
  pageId,
  pages,
  isAdmin,
  email,
  canCreate,
}: {
  pageId: string;
  pages: NavPage[];
  isAdmin: boolean;
  email?: string;
  canCreate: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useModalHistory(open, () => setOpen(false));

  const base = `/edit/${pageId}`;
  const tabs = [
    { href: base, label: '페이지', Icon: FileText, active: pathname === base },
    { href: `${base}/design`, label: '디자인', Icon: Palette, active: pathname.startsWith(`${base}/design`) },
    { href: `${base}/stats`, label: '분석', Icon: BarChart3, active: pathname.startsWith(`${base}/stats`) },
    { href: `${base}/manage`, label: '관리', Icon: ClipboardList, active: pathname.startsWith(`${base}/manage`) },
  ];
  const current = pages.find((p) => p.id === pageId);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)] pointer-events-none">
        <div className="mx-auto max-w-[560px] px-3 pb-3">
          <div className="pointer-events-auto h-[64px] rounded-[22px] bg-[#111] text-white flex items-center px-2 shadow-xl">
            {tabs.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className={`flex-1 h-full flex flex-col items-center justify-center gap-1 text-[11px] ${
                  t.active ? 'text-white' : 'text-white/45'
                }`}
              >
                <t.Icon className="w-[21px] h-[21px]" />
                {t.label}
              </Link>
            ))}
            <button
              onClick={() => setOpen(true)}
              aria-label="내 페이지 전환"
              className="flex-1 h-full flex items-center justify-center"
            >
              <span className="w-10 h-10 rounded-full overflow-hidden bg-white/15 flex items-center justify-center text-sm font-bold ring-2 ring-white/20">
                {current?.avatar ? (
                  <img src={current.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  (current?.title || '?').slice(0, 1)
                )}
              </span>
            </button>
          </div>
        </div>
      </nav>

      {open && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-end justify-center" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-[560px] rounded-t-3xl pb-[calc(env(safe-area-inset-bottom)+16px)]"
          >
            <div className="flex items-center justify-between px-5 h-14">
              <div className="min-w-0">
                <div className="font-bold text-[16px]">내 페이지</div>
                {email && <div className="text-[11px] text-[#a1a1a6] truncate">{email}</div>}
              </div>
              <button onClick={() => setOpen(false)} aria-label="닫기" className="w-9 h-9 flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-3 space-y-1">
              {pages.map((p) => (
                <Link
                  key={p.id}
                  href={`/edit/${p.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl hover:bg-[#f4f4f5]"
                >
                  <span className="w-10 h-10 rounded-full overflow-hidden bg-[#f4f4f5] flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {p.avatar ? <img src={p.avatar} alt="" className="w-full h-full object-cover" /> : p.title.slice(0, 1)}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className={`block text-[15px] truncate ${p.id === pageId ? 'font-bold text-[#3b6cf6]' : 'font-semibold'}`}>
                      {p.slug}
                    </span>
                    <span className="block text-[12px] text-[#a1a1a6] truncate">{p.title}</span>
                  </span>
                  {p.id === pageId && <Check className="w-4 h-4 text-[#3b6cf6]" />}
                </Link>
              ))}
              {canCreate && (
                <Link
                  href="/dashboard/new"
                  className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl hover:bg-[#f4f4f5] text-[#71717a]"
                >
                  <span className="w-10 h-10 rounded-full border border-dashed border-[#d4d4d8] flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </span>
                  <span className="text-[15px] font-semibold">새 페이지 만들기</span>
                </Link>
              )}
            </div>

            <div className="mt-2 mx-5 border-t border-[#f2f2f4] pt-2">
              <MenuRow href="/dashboard" Icon={LayoutGrid} label="멀티 페이지 관리" />
              <MenuRow href={`/edit/${pageId}/settings`} Icon={Settings} label="페이지 설정 (주소·공개·삭제)" />
              {isAdmin && <MenuRow href="/admin" Icon={ShieldCheck} label="운영자 관리" />}
              <form action={withBase('/auth/signout')} method="post">
                <button className="w-full flex items-center gap-3 h-12 text-[15px] text-[#111]">
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

function MenuRow({ href, Icon, label }: { href: string; Icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 h-12 text-[15px] text-[#111]">
      <Icon className="w-[18px] h-[18px]" /> {label}
    </Link>
  );
}
