import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Eye, MousePointerClick, Mail, MessageSquare } from 'lucide-react';

export default async function StatsPage({ params }: { params: { pageId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 페이지 정보 + 본인 소유 검증
  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('id', params.pageId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!page) notFound();

  // 블록별 클릭수
  const { data: blocks } = await supabase
    .from('blocks')
    .select('id, type, position, click_count, data')
    .eq('page_id', page.id)
    .order('click_count', { ascending: false });

  // 문의/이메일 카운트
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

  const totalClicks = (blocks || []).reduce((s, b) => s + (b.click_count || 0), 0);
  const maxClicks = Math.max(1, ...(blocks || []).map(b => b.click_count || 0));

  return (
    <main className="min-h-screen bg-white pb-20">
      <div className="h-2 bg-primary" />

      <header className="border-b border-border">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
          <Link href={`/edit/${page.id}`} className="inline-flex items-center gap-1 text-sm text-text-2 hover:text-text">
            <ChevronLeft className="w-4 h-4" /> 편집기로
          </Link>
          <div className="font-bold text-sm">통계</div>
          <div className="w-16" />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* 핵심 지표 4개 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard icon={Eye} label="총 방문" value={page.view_count || 0} />
          <StatCard icon={MousePointerClick} label="총 클릭" value={totalClicks} />
          <StatCard icon={Mail} label="이메일 수집" value={emailCount || 0} />
          <StatCard icon={MessageSquare} label="문의" value={inquiryCount || 0} />
        </div>

        {/* 블록별 클릭 순위 */}
        <h2 className="font-bold mb-3">블록별 클릭 순위</h2>
        {!blocks || blocks.length === 0 ? (
          <div className="text-text-3 text-sm py-8 text-center">아직 데이터가 없어요</div>
        ) : (
          <div className="space-y-2">
            {blocks.map((b: any, idx: number) => {
              const label = getBlockLabel(b);
              const clickCount = b.click_count || 0;
              const percent = (clickCount / maxClicks) * 100;
              return (
                <div key={b.id} className="border border-border rounded-xl p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-text-3 font-bold">#{idx + 1}</span>
                      <span className="text-sm font-bold truncate">{label}</span>
                    </div>
                    <span className="text-sm font-bold flex-shrink-0">{clickCount}회</span>
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

                {/* 이메일 구독자 */}
        <div className='mt-10'>
          <h2 className='font-bold mb-3'>이메일 구독자</h2>

          {!emailSubscribers || emailSubscribers.length === 0 ? (
            <div className='text-sm text-text-3 border border-border rounded-xl p-4'>
              아직 수집된 이메일이 없어요
            </div>
          ) : (
            <div className='border border-border rounded-2xl overflow-hidden'>
              {emailSubscribers.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className='flex items-center justify-between px-4 py-3 border-b border-border last:border-b-0'
                >
                  <div className='font-medium text-sm'>{item.email}</div>

                  <div className='text-xs text-text-3'>
                    {new Date(item.created_at).toLocaleDateString('ko-KR')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 도움말 */}
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
      <div className="text-2xl font-black">{value.toLocaleString()}</div>
      <div className="text-xs text-text-3">{label}</div>
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

