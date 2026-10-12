import { notFound } from 'next/navigation';
import { getMyPage, plain } from '@/lib/server/data';
import { q } from '@/lib/server/db';
import { getMyAccount } from '@/lib/db/account';
import { ManageView } from '@/components/manage/ManageView';

export const dynamic = 'force-dynamic';

export default async function ManagePage({ params }: { params: { pageId: string } }) {
  const { user } = await getMyAccount();
  if (!user) notFound();

  const page = await getMyPage(params.pageId, user.id);
  if (!page) notFound();

  const [blocks, inquiries, emails] = await Promise.all([
    q(`SELECT id, type, data FROM bl_blocks WHERE page_id = $1`, [page.id]),
    q(`SELECT id, block_id, selected_option, created_at FROM bl_inquiries WHERE page_id = $1 ORDER BY created_at DESC LIMIT 1000`, [page.id]).then((r) => r.map(plain)),
    q(`SELECT id, block_id, email, consent, created_at FROM bl_emails WHERE page_id = $1 ORDER BY created_at DESC LIMIT 1000`, [page.id]).then((r) => r.map(plain)),
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
