'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, ExternalLink, Search } from 'lucide-react';
import { updateCustomer, listCustomerPages, type AdminCustomer } from '@/lib/db/admin';
import type { AccountStatus } from '@/types';

const STATUS_STYLE: Record<AccountStatus, string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  suspended: 'bg-red-50 text-red-600 border-red-200',
  expired: 'bg-gray-100 text-gray-600 border-gray-200',
};
const STATUS_LABEL: Record<AccountStatus, string> = {
  active: '정상',
  suspended: '정지',
  expired: '만료',
};

function fmtDate(iso: string | null) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' });
}
function toDateInput(iso: string | null) {
  if (!iso) return '';
  const d = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}
function isExpiredByDate(c: AdminCustomer) {
  return !!c.expires_at && new Date(c.expires_at).getTime() < Date.now();
}

export function AdminCustomerTable({ customers }: { customers: AdminCustomer[] }) {
  const [query, setQuery] = useState('');
  const filtered = customers.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (c.email || '').toLowerCase().includes(q) || (c.name || '').toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="relative mb-3">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이메일 또는 이름 검색"
          className="w-full h-11 pl-9 pr-4 rounded-xl border border-border text-sm outline-none focus:border-primary"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-text-3 text-sm border-2 border-dashed border-border rounded-2xl">
          고객이 없어요
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <CustomerRow key={c.id} customer={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function CustomerRow({ customer: c }: { customer: AdminCustomer }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [pageLimit, setPageLimit] = useState(c.page_limit);
  const [expires, setExpires] = useState(toDateInput(c.expires_at));
  const [memo, setMemo] = useState(c.admin_memo || '');
  const [pages, setPages] = useState<any[] | null>(null);

  const effective: AccountStatus =
    c.status === 'active' && isExpiredByDate(c) ? 'expired' : c.status;

  function run(fn: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch (e: any) {
        setError(e.message || '실패했어요');
      }
    });
  }

  async function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next && pages === null) {
      try {
        setPages(await listCustomerPages(c.id));
      } catch {
        setPages([]);
      }
    }
  }

  return (
    <div className={`border rounded-2xl ${effective === 'active' ? 'border-border' : 'border-red-200'}`}>
      {/* 요약 행 */}
      <button
        type="button"
        onClick={toggleOpen}
        className="w-full text-left p-4 flex items-center gap-3"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm truncate">{c.email || '(이메일 없음)'}</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLE[effective]}`}>
              {STATUS_LABEL[effective]}
            </span>
            {c.is_admin && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary-soft text-primary border border-primary">
                운영자
              </span>
            )}
          </div>
          <div className="text-xs text-text-3 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
            <span>페이지 {c.page_count}/{c.page_limit}</span>
            <span>방문 {c.total_views.toLocaleString()}</span>
            <span>가입 {fmtDate(c.created_at)}</span>
            <span>최근 {fmtDate(c.last_seen_at)}</span>
            <span>만료 {c.expires_at ? fmtDate(c.expires_at) : '무기한'}</span>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-text-3" /> : <ChevronDown className="w-4 h-4 text-text-3" />}
      </button>

      {/* 상세/편집 */}
      {open && (
        <div className="border-t border-border p-4 space-y-4 bg-[#fcfcfc] rounded-b-2xl">
          {/* 상태 */}
          <div>
            <div className="text-xs font-bold text-text-2 mb-2">계정 상태</div>
            <div className="flex gap-2">
              {(['active', 'suspended', 'expired'] as AccountStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={pending || c.status === s}
                  onClick={() => run(() => updateCustomer(c.id, { status: s }))}
                  className={`h-9 px-4 rounded-lg text-sm font-bold border transition disabled:opacity-60 ${
                    c.status === s ? STATUS_STYLE[s] : 'border-border bg-white hover:bg-primary-soft'
                  }`}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          {/* 상한 / 만료일 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-bold text-text-2 mb-2">페이지 상한</div>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={pageLimit}
                  onChange={(e) => setPageLimit(Number(e.target.value))}
                  className="h-10 w-24 px-3 rounded-lg border border-border text-sm"
                />
                <button
                  type="button"
                  disabled={pending || pageLimit === c.page_limit}
                  onClick={() => run(() => updateCustomer(c.id, { page_limit: pageLimit }))}
                  className="h-10 px-4 rounded-lg bg-primary text-white text-sm font-bold disabled:opacity-40"
                >
                  적용
                </button>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-text-2 mb-2">이용 만료일 (비우면 무기한)</div>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={expires}
                  onChange={(e) => setExpires(e.target.value)}
                  className="h-10 flex-1 px-3 rounded-lg border border-border text-sm"
                />
                <button
                  type="button"
                  disabled={pending || expires === toDateInput(c.expires_at)}
                  onClick={() => run(() => updateCustomer(c.id, { expires_at: expires || null }))}
                  className="h-10 px-4 rounded-lg bg-primary text-white text-sm font-bold disabled:opacity-40"
                >
                  적용
                </button>
              </div>
              <div className="flex gap-1 mt-2">
                {[1, 3, 6, 12].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      const base = c.expires_at && !isExpiredByDate(c) ? new Date(c.expires_at) : new Date();
                      base.setMonth(base.getMonth() + m);
                      setExpires(toDateInput(base.toISOString()));
                    }}
                    className="text-xs px-2 py-1 rounded border border-border bg-white hover:bg-primary-soft"
                  >
                    +{m}개월
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 메모 */}
          <div>
            <div className="text-xs font-bold text-text-2 mb-2">운영자 메모 (고객에게 안 보임)</div>
            <div className="flex gap-2">
              <input
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="예: 3기 수강생, 카톡으로 연락"
                className="h-10 flex-1 px-3 rounded-lg border border-border text-sm"
              />
              <button
                type="button"
                disabled={pending || memo === (c.admin_memo || '')}
                onClick={() => run(() => updateCustomer(c.id, { admin_memo: memo || null }))}
                className="h-10 px-4 rounded-lg bg-primary text-white text-sm font-bold disabled:opacity-40"
              >
                저장
              </button>
            </div>
          </div>

          {/* 페이지 목록 */}
          <div>
            <div className="text-xs font-bold text-text-2 mb-2">이 고객의 페이지</div>
            {pages === null ? (
              <div className="text-xs text-text-3">불러오는 중...</div>
            ) : pages.length === 0 ? (
              <div className="text-xs text-text-3">아직 페이지가 없어요</div>
            ) : (
              <div className="space-y-1">
                {pages.map((p) => (
                  <a
                    key={p.id}
                    href={`/p/${p.slug}`}
                    target="_blank"
                    rel="noopener"
                    className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-white border border-border hover:border-primary"
                  >
                    <span className="truncate">
                      {p.title} <span className="text-text-3 text-xs">/p/{p.slug}</span>
                      {!p.is_published && <span className="ml-1 text-[10px] text-text-3">(비공개)</span>}
                    </span>
                    <span className="text-xs text-text-3 inline-flex items-center gap-1 flex-shrink-0">
                      {p.view_count}회 <ExternalLink className="w-3 h-3" />
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
          )}
        </div>
      )}
    </div>
  );
}
