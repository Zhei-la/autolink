import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Eye, MousePointerClick, MessageSquare } from 'lucide-react';
import { EmailSubscribersModal } from './EmailSubscribersModal';

export default async function StatsPage({ params }: { params: { pageId: string } }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('id', params.pageId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!page) notFound();

  const { data: blocks } = await supabase
    .from('blocks')
    .select('id, type, position, click_count, data')
    .eq('page_id', page.id)
    .order('click_count', { ascending: false });

  const { count: inquiryCount } = await supabase
    .from('inquiry_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('page_id', page.id);

  const { count: emailCount } = await supabase
    .from('email_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('page_id', page.id);

  const { data: emailSubscribers } = await supabase
    .from('email_submissions')
    .select('email, created_at')
    .eq('page_id', page.id)
    .order('created_at', { ascending: false });

  const totalClicks = (blocks || []).reduce((sum, block) => sum + (block.click_count || 0), 0);
  const maxClicks = Math.max(1, ...(blocks || []).map((block) => block.click_count || 0));

  return (
    <main className="min-h-screen bg-white pb-20">
      <div className="h-2 bg-primary" />

      <header className="border-b border-border">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
          <Link
            href={`/edit/${page.id}`}
            className="inline-flex items-center gap-1 text-sm text-text-2 hover:text-text"
          >
            <ChevronLeft className="w-4 h-4" />
            편집기로
          </Link>

          <div className="font-bold text-sm">통계</div>

          <div className="w-16" />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard icon={Eye} label="총 방문" value={page.view_count || 0} />
          <StatCard icon={MousePointerClick} label="총 클릭" value={totalClicks} />
          <EmailSubscribersModal subscribers={emailSubscribers || []} />
          <StatCard icon={MessageSquare} label="문의" value={inquiryCount || 0} />
        </div>

        <h2 className="font-bold mb-3">블록별 클릭 순위</h2>

        {!blocks || blocks.length === 0 ? (
          <div className="text-text-3 text-sm py-8 text-center">
            아직 데이터가 없어요
          </div>
        ) : (
          <div className="space-y-2">
            {blocks.map((block: any, idx: number) => {
              const label = getBlockLabel(block);
              const clickCount = block.click_count || 0;
              const percent = (clickCount / maxClicks) * 100;

              return (
                <div key={block.id} className="border border-border rounded-xl p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-text-3 font-bold">
                        #{idx + 1}
                      </span>

                      <span className="text-sm font-bold truncate">
                        {label}
                      </span>
                    </div>

                    <span className="text-sm font-bold flex-shrink-0">
                      {clickCount}회
                    </span>
                  </div>

                  <div className="h-1.5 bg-text-3/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 p-4 bg-primary-soft border border-primary border-l-4 rounded-xl text-sm">
          <strong>📊 통계 활용 팁</strong>

          <ul className="mt-2 space-y-1 list-disc list-inside text-text-2">
            <li>잘 되는 블록을 더 위로 이동하면 클릭률이 더 올라가요</li>
            <li>방문 대비 클릭률이 20~40%면 잘 작동하는 페이지예요</li>
            <li>안 되는 블록은 카피를 바꾸거나 삭제해보세요</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

function StatCard({ icon: Icon, label, value }: any) {
  return (
    <div className="border border-border rounded-2xl p-4">
      <Icon className="w-5 h-5 text-primary mb-2" />

      <div className="text-2xl font-black">
        {value.toLocaleString()}
      </div>

      <div className="text-xs text-text-3">
        {label}
      </div>
    </div>
  );
}

function getBlockLabel(block: any): string {
  const typeLabels: Record<string, string> = {
    profile: '프로필',
    link: '링크',
    product_grid: '상품',
    inquiry: '문의',
    calendar: '달력',
    email: '이메일',
    text: '텍스트',
    sns: 'SNS',
  };

  const baseLabel = typeLabels[block.type] || block.type;
  const title = block.data?.title || block.data?.name;

  return title ? `${baseLabel} · ${title}` : baseLabel;
}