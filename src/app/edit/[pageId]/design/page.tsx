import { notFound } from 'next/navigation';
import { getBlocks, getMyPage } from '@/lib/server/data';
import { getMyAccount } from '@/lib/db/account';
import { DesignForm } from '@/components/editor/DesignForm';
import type { Block } from '@/types';

export const dynamic = 'force-dynamic';

export default async function DesignPage({ params }: { params: { pageId: string } }) {
  const { user, effectiveStatus } = await getMyAccount();
  if (!user) notFound();

  const page = await getMyPage(params.pageId, user.id);
  if (!page) notFound();

  const blocks = await getBlocks(page.id);

  return (
    <main className="mx-auto max-w-[560px] px-4 pt-1">
      <DesignForm page={page as any} blocks={(blocks || []) as Block[]} readOnly={effectiveStatus !== 'active'} />
    </main>
  );
}
