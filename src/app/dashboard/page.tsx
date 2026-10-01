import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, ExternalLink, Edit3, ShieldCheck, BarChart3 } from 'lucide-react';
import { getMyAccount, STATUS_MESSAGE } from '@/lib/db/account';
import { Logo } from '@/components/brand/Logo';
import { publicUrlLabel } from '@/lib/theme';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const { user, profile, effectiveStatus } = await getMyAccount();
  if (!user) redirect('/login');

  const supabase = createClient();

  // 최근 접속 시각 갱신 (관리자 화면의 "최근 접속" 컬럼용)
  await supabase.rpc('touch_last_seen').then(() => {}, () => {});

  const { data: pages } = await supabase
    .from('pages')
    .select('id, slug, title, view_count, is_published, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  const pageCount = pages?.length || 0;
  const pageLimit = profile?.page_limit ?? 3;
  const canCreate = effectiveStatus === 'active' && pageCount < pageLimit;

  return (
    <main className="min-h-screen bg-[#f2f2f4]">

      <header className="bg-white border-b border-border">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size="sm" />
          </Link>

          <div className="flex items-center gap-4">
            {profile?.is_admin && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
              >
                <ShieldCheck className="w-4 h-4" /> 운영자
              </Link>
            )}
            <span className="text-sm text-text-2 hidden sm:inline">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button className="text-sm text-text-2 hover:text-text">로그아웃</button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        {searchParams?.error === 'admin_only' && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            관리자만 접근할 수 있는 화면이에요.
          </div>
        )}

        {effectiveStatus !== 'active' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            <strong>{effectiveStatus === 'suspended' ? '계정 정지' : '이용 기간 만료'}</strong>
            <p className="mt-1">{STATUS_MESSAGE[effectiveStatus]}</p>
          </div>
        )}

        {effectiveStatus === 'active' && profile?.expires_at && (
          <div className="mb-6 p-3 bg-primary-soft border border-primary rounded-lg text-sm text-text">
            이용 기간: <strong>{new Date(profile.expires_at).toLocaleDateString('ko-KR')}</strong> 까지
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black mb-1">멀티 페이지 관리</h1>
            <p className="text-text-2 text-sm">
              {pageCount} / {pageLimit}개
            </p>
          </div>
          {canCreate ? (
            <Link
              href="/dashboard/new"
              className="inline-flex items-center gap-2 h-11 px-5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition"
            >
              <Plus className="w-4 h-4" /> 새 페이지
            </Link>
          ) : (
            <span
              title={effectiveStatus !== 'active' ? STATUS_MESSAGE[effectiveStatus] : '페이지 상한에 도달했어요'}
              className="inline-flex items-center gap-2 h-11 px-5 bg-text-3/30 text-white font-bold rounded-xl cursor-not-allowed"
            >
              <Plus className="w-4 h-4" /> 새 페이지
            </span>
          )}
        </div>

        {!pages || pages.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-soft flex items-center justify-center">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <p className="text-text-2 mb-6">아직 페이지가 없어요</p>
            {canCreate && (
              <Link
                href="/dashboard/new"
                className="inline-flex items-center gap-2 h-11 px-5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition"
              >
                첫 페이지 만들기
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {pages.map((page) => (
              <div key={page.id} className="bg-white rounded-2xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg truncate">{page.title}</h3>
                      {!page.is_published && (
                        <span className="text-xs bg-text-3/20 text-text-2 px-2 py-0.5 rounded">비공개</span>
                      )}
                    </div>
                    <a
                      href={`/p/${page.slug}`}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex items-center gap-1 text-sm text-[#3b6cf6] hover:underline"
                    >
                      {process.env.NEXT_PUBLIC_PUBLIC_HOST ? publicUrlLabel(page.slug) : `/p/${page.slug}`}{' '}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <div className="flex items-center gap-3 mt-2 text-xs text-text-3">
                      <span>방문 {page.view_count}회</span>
                      <span>·</span>
                      <span>{new Date(page.updated_at).toLocaleDateString('ko-KR')} 수정</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                    <Link
                      href={`/edit/${page.id}/stats`}
                      className="inline-flex items-center justify-center gap-1 h-10 px-3 border border-border rounded-xl text-sm font-bold hover:bg-primary-soft hover:border-primary transition"
                    >
                      <BarChart3 className="w-3.5 h-3.5" /> 통계
                    </Link>
                    <Link
                      href={`/edit/${page.id}`}
                      className="inline-flex items-center justify-center gap-1 h-10 px-4 border border-border rounded-xl text-sm font-bold hover:bg-primary-soft hover:border-primary transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> 편집
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
