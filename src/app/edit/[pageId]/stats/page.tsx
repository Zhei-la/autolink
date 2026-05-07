import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Eye, MousePointerClick, Mail, MessageSquare } from 'lucide-react';
import { EmailSubscribersModal } from './EmailSubscribersModal';

export default async function StatsPage({ params }: { params: { pageId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // ?????? ???? + ???? ???? ????
  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('id', params.pageId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!page) notFound();

  // ???? ?????
  const { data: blocks } = await supabase
    .from('blocks')
    .select('id, type, position, click_count, data')
    .eq('page_id', page.id)
    .order('click_count', { ascending: false });

  // ????/????? ????
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
            <ChevronLeft className="w-4 h-4" /> ???????
          </Link>
          <div className="font-bold text-sm">???</div>
          <div className="w-16" />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* ??? ??? 4?? */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard icon={Eye} label="?? ?湮" value={page.view_count || 0} />
          <StatCard icon={MousePointerClick} label="?? ???" value={totalClicks} />
          <StatCard icon={Mail} label="????? ????" value={emailCount || 0} />
          <StatCard icon={MessageSquare} label="????" value={inquiryCount || 0} />
        </div>

        {/* ???? ??? ???? */}
        <h2 className="font-bold mb-3">???? ??? ????</h2>
        {!blocks || blocks.length === 0 ? (
          <div className="text-text-3 text-sm py-8 text-center">???? ??????? ?????</div>
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
                    <span className="text-sm font-bold flex-shrink-0">{clickCount}?</span>
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

                {/* ????? ?????? */}
        <div className='mt-10'>
          <h2 className='font-bold mb-3'>????? ??????</h2>

          {!emailSubscribers || emailSubscribers.length === 0 ? (
            <div className='text-sm text-text-3 border border-border rounded-xl p-4'>
              ???? ?????? ??????? ?????
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

        {/* ???? */}
        <div className="mt-8 p-4 bg-primary-soft border border-primary border-l-4 rounded-xl text-sm">
          <strong>?? ??? ??? ??</strong>
          <ul className="mt-2 space-y-1 list-disc list-inside text-text-2">
            <li>?? ??? ????? ?? ???? ?????? ??????? ?? ?o???</li>
            <li>?湮 ??? ??????? 20~40%?? ?? ?????? ??????????</li>
            <li>?? ??? ????? ???? ????? ???????????</li>
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
    profile: '??????',
    link: '???',
    product_grid: '???',
    inquiry: '????',
    calendar: '???',
    email: '?????',
    text: '????',
    sns: 'SNS',
  };
  const baseLabel = typeLabels[block.type] || block.type;
  const title = block.data?.title || block.data?.name;
  return title ? `${baseLabel} ?? ${title}` : baseLabel;
}



