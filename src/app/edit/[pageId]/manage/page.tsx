import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getMyAccount } from '@/lib/db/account';
import { ManageView } from '@/components/manage/ManageView';

export const dynamic = 'force-dynamic';

export default async function ManagePage({ params }: { params: { pageId: string } }) {
  const supabase = createClient();
  const { user } = await getMyAccount();
  if (!user) notFound();

  const { data: page } = await supabase
    .from('pages')
    .select('id, slug')
    .eq('id', params.pageId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!page) notFound();

  const [{ data: blocks }, { data: inquiries }, { data: emails }] = await Promise.all([
    supabase.from('blocks').select('id, type, data').eq('page_id', page.id),
    supabase
      .from('inquiry_submissions')
      .select('id, block_id, selected_option, created_at')
      .eq('page_id', page.id)
      .order('created_at', { ascending: false })
      .limit(1000),
    supabase
      .from('email_submissions')
      .select('id, block_id, email, consent, created_at')
      .eq('page_id', page.id)
      .order('created_at', { ascending: false })
      .limit(1000),
  ]);

  const nameOf = new Map((blocks || []).map((b: any) => [b.id, b.data?.title || (b.type === 'email' ? '고객정보' : '문의')]));

  return (
    <main className="mx-auto max-w-[560px] px-4 pt-1">
      <ManageView
        data={{
          slug: page.slug,
          inquiries: (inquiries || []).map((r: any) => ({ id: r.id, option: r.selected_option, block: nameOf.get(r.block_id) || '', at: r.created_at })),
          emails: (emails || []).map((r: any) => ({ id: r.id, email: r.email, consent: r.consent, block: nameOf.get(r.block_id) || '', at: r.created_at })),
          hasInquiryBlock: (blocks || []).some((b: any) => b.type === 'inquiry'),
          hasEmailBlock: (blocks || []).some((b: any) => b.type === 'email'),
        }}
      />
    </main>
  );
}
