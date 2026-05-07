import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, ExternalLink, Edit3 } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: pages } = await supabase
    .from('pages')
    .select('id, slug, title, view_count, is_published, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  return (
    <main className="min-h-screen bg-white">
      <div className="h-2 bg-primary" />

      <header className="border-b border-border">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-black text-sm">A</span>
            </div>
            <div className="font-black">
              <span className="text-text">auto</span>
              <span className="text-primary">link</span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-sm text-text-2 hidden sm:inline">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button className="text-sm text-text-2 hover:text-text">로그아웃</button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black mb-1">내 페이지</h1>
            <p className="text-text-2 text-sm">총 {pages?.length || 0}개</p>
          </div>
          <Link
            href="/dashboard/new"
            className="inline-flex items-center gap-2 h-11 px-5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition"
          >
            <Plus className="w-4 h-4" /> 새 페이지
          </Link>
        </div>

        {!pages || pages.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-soft flex items-center justify-center">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <p className="text-text-2 mb-6">아직 페이지가 없어요</p>
            <Link
              href="/dashboard/new"
              className="inline-flex items-center gap-2 h-11 px-5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition"
            >
              첫 페이지 만들기
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {pages.map((page) => (
              <div
                key={page.id}
                className="border border-border rounded-2xl p-5 hover:border-primary transition"
              >
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
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      autolink.kr/p/{page.slug} <ExternalLink className="w-3 h-3" />
                    </a>
                    <div className="flex items-center gap-3 mt-2 text-xs text-text-3">
                      <span>방문 {page.view_count}회</span>
                      <span>·</span>
                      <span>{new Date(page.updated_at).toLocaleDateString('ko-KR')} 수정</span>
                    </div>
                  </div>

                  <Link
                    href={`/edit/${page.id}`}
                    className="inline-flex items-center gap-1 h-10 px-4 border border-border rounded-xl text-sm font-bold hover:bg-primary-soft hover:border-primary transition flex-shrink-0"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> 편집
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
