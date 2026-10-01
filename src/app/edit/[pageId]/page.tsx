import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getMyAccount, STATUS_MESSAGE } from '@/lib/db/account';
import { PageEditor } from '@/components/editor/PageEditor';
import { resolveTheme } from '@/lib/theme';
import type { Block } from '@/types';

export const dynamic = 'force-dynamic';

export default async function EditPage({ params }: { params: { pageId: string } }) {
  const supabase = createClient();
  const { user, effectiveStatus } = await getMyAccount();
  if (!user) notFound();
  const readOnly = effectiveStatus !== 'active';

  const { data: page } = await supabase
    .from('pages')
    .select('id, slug, title, theme')
    .eq('id', params.pageId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!page) notFound();

  const { data: blocks } = await supabase
    .from('blocks')
    .select('*')
    .eq('page_id', page.id)
    .order('position', { ascending: true });

  return (
    <main className="mx-auto max-w-[560px] px-4 pt-1">
      <PageEditor
        page={{ id: page.id, slug: page.slug, title: page.title, theme: resolveTheme(page.theme) as any }}
        blocks={(blocks || []) as Block[]}
        readOnly={readOnly}
        readOnlyMessage={readOnly ? STATUS_MESSAGE[effectiveStatus] : undefined}
      />
    </main>
  );
}
