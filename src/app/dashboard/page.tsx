import { getMyPages } from '@/lib/server/data';
import { loungeUrl } from '@/lib/server/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, ExternalLink, Edit3, ShieldCheck, BarChart3 } from 'lucide-react';
import { getMyAccount, STATUS_MESSAGE } from '@/lib/db/account';
import { Logo } from '@/components/brand/Logo';
import { publicUrlLabel, publicPath } from '@/lib/theme';
import { withBase } from '@/lib/utils';
import { RedeemForm } from '@/components/share/RedeemForm';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const { user, profile, effectiveStatus } = await getMyAccount();
  if (!user) redirect('/login?next=/dashboard');

  const pages = (await getMyPages(user.id)).sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));

  const pageCount = pages.filter((p) => p.is_owner).length; // 내가 주인인 페이지만 개수에 셈
  const pageLimit = profile?.page_limit ?? 3;
  const canCreate = effectiveStatus === 'active' && (user.isAdmin || pageCount < pageLimit);

  return (
    <main className="min-h-screen bg-white">

      <header className="bg-white border-b border-line">
        <div className="mx-auto max-w-3xl px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size="sm" />
          </Link>

          <div className="flex items-center gap-4">
            {profile?.is_admin && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 text-sm font-bold text-ink hover:text-cherry"
              >
                <ShieldCheck className="w-4 h-4" /> 운영자
              </Link>
            )}
            <a href={loungeUrl()} className="text-sm text-text-2 hover:text-text hidden sm:inline">바이란미디어</a>
            <span className="text-sm text-text font-bold hidden sm:inline">{user.name}님</span>
            <form action={withBase('/auth/signout')} method="post">
              <button className="text-sm text-text-2 hover:text-text">로그아웃</button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-10">
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
            이용 기간: <strong>{new Date(profile.expires_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}</strong> 까지
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[28px] font-extrabold tracking-tight text-ink mb-1">내 페이지</h1>
            <p className="text-[#8b8b90] text-sm">
              {user.isAdmin ? `${pageCount}개 · 운영자는 개수 제한 없음` : `${pageLimit}개 중 ${pageCount}개 사용`}
            </p>
          </div>
          {canCreate ? (
            <Link
              href="/dashboard/new"
              className="inline-flex items-center gap-1.5 h-11 px-5 bg-cherry text-white font-bold rounded-full hover:bg-cherry-dark transition"
            >
              <Plus className="w-4 h-4" /> 새 페이지
            </Link>
          ) : (
            <span
              title={effectiveStatus !== 'active' ? STATUS_MESSAGE[effectiveStatus] : '페이지 상한에 도달했어요'}
              className="inline-flex items-center gap-1.5 h-11 px-5 bg-mist text-[#b4b4b8] font-bold rounded-full cursor-not-allowed"
            >
              <Plus className="w-4 h-4" /> 새 페이지
            </span>
          )}
        </div>

        <RedeemForm />

        {!pages || pages.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-line rounded-[20px]">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cherry-soft flex items-center justify-center">
              <Plus className="w-8 h-8 text-cherry" />
            </div>
            <p className="text-[#6b6b70] mb-6">첫 링크 페이지를 만들어 보세요. 1분이면 돼요.</p>
            {canCreate && (
              <Link
                href="/dashboard/new"
                className="inline-flex items-center gap-2 h-11 px-6 bg-ink text-white font-bold rounded-full transition"
              >
                첫 페이지 만들기
              </Link>
            )}
          </div>
        ) : (
          <div className="rounded-[20px] border border-line divide-y divide-line">
            {pages.map((page) => (
              <div key={page.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-extrabold text-[17px] text-ink truncate">{page.title}</h3>
                      {!page.is_owner && (
                        <span className="text-[11px] font-bold bg-cherry-soft text-cherry px-1.5 py-0.5 rounded-md">공유받음</span>
                      )}
                      {!page.is_published && (
                        <span className="text-[11px] font-bold bg-mist text-[#8b8b90] px-1.5 py-0.5 rounded-md">비공개</span>
                      )}
                    </div>
                    <a
                      href={publicPath(page.slug)}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex items-center gap-1 text-sm text-[#3f3f44] hover:text-cherry underline underline-offset-2 decoration-line"
                    >
                      {publicUrlLabel(page.slug)}{' '}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <div className="flex items-center gap-3 mt-2 text-xs text-[#8b8b90]">
                      <span>
                        방문 <strong className="text-ink tabular-nums">{page.view_count.toLocaleString()}</strong>회
                      </span>
                      <span>{new Date(page.updated_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}에 고침</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                    <Link
                      href={`/edit/${page.id}/stats`}
                      className="inline-flex items-center justify-center gap-1 h-10 px-3.5 bg-mist rounded-full text-sm font-bold text-ink hover:bg-[#ededef] transition"
                    >
                      <BarChart3 className="w-3.5 h-3.5" /> 통계
                    </Link>
                    <Link
                      href={`/edit/${page.id}`}
                      className="inline-flex items-center justify-center gap-1 h-10 px-4 bg-ink text-white rounded-full text-sm font-bold transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> 고치기
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
