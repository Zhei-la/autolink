import { notFound } from 'next/navigation';
import { getBlocks, getMyPage } from '@/lib/server/data';
import { getMyAccount, STATUS_MESSAGE } from '@/lib/db/account';
import { PageEditor } from '@/components/editor/PageEditor';
import { resolveTheme } from '@/lib/theme';
import type { Block } from '@/types';

export const dynamic = 'force-dynamic';

export default async function EditPage({ params }: { params: { pageId: string } }) {
  const { user, effectiveStatus } = await getMyAccount();
  if (!user) notFound();
  const readOnly = effectiveStatus !== 'active';

  const page = await getMyPage(params.pageId, user.id);
  if (!page) notFound();

  const blocks = await getBlocks(page.id);

  return (
    <main className="mx-auto max-w-[1080px] px-4 pt-5">
      <PageEditor
        page={{ id: page.id, slug: page.slug, title: page.title, theme: resolveTheme(page.theme) as any }}
        blocks={(blocks || []) as Block[]}
        readOnly={readOnly}
        readOnlyMessage={readOnly ? STATUS_MESSAGE[effectiveStatus] : undefined}
      />
    </main>
  );
}
