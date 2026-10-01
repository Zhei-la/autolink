import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronLeft, ShieldCheck } from 'lucide-react';
import { isCurrentUserAdmin, listCustomers } from '@/lib/db/admin';
import { AdminCustomerTable } from './AdminCustomerTable';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const ok = await isCurrentUserAdmin();
  if (!ok) redirect('/dashboard?error=admin_only');

  const customers = await listCustomers();

  const activeCount = customers.filter((c) => c.status === 'active').length;
  const totalPages = customers.reduce((s, c) => s + c.page_count, 0);
  const totalViews = customers.reduce((s, c) => s + c.total_views, 0);

  return (
    <main className="min-h-screen bg-white pb-20">
      <div className="h-2 bg-primary" />

      <header className="border-b border-border sticky top-0 bg-white z-30">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-text-2 hover:text-text">
            <ChevronLeft className="w-4 h-4" /> 대시보드
          </Link>
          <div className="font-bold text-sm inline-flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-primary" /> 운영자 관리
          </div>
          <div className="w-20" />
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Stat label="전체 고객" value={customers.length} />
          <Stat label="정상 계정" value={activeCount} />
          <Stat label="전체 페이지" value={totalPages} />
          <Stat label="누적 방문" value={totalViews} />
        </div>

        <h1 className="text-xl font-black mb-1">고객 목록</h1>
        <p className="text-sm text-text-3 mb-4">
          상태·페이지 상한·이용 만료일을 바꾸면 즉시 반영돼요. 정지·만료된 고객은 로그인은 되지만 편집이 막히고, 공개 페이지도 노출되지 않아요.
        </p>

        <AdminCustomerTable customers={customers} />
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border rounded-2xl p-4">
      <div className="text-2xl font-black">{value.toLocaleString()}</div>
      <div className="text-xs text-text-3">{label}</div>
    </div>
  );
}
