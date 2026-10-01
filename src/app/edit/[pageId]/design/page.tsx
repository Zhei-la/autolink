import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getMyAccount } from '@/lib/db/account';
import { DesignForm } from '@/components/editor/DesignForm';
import type { Block } from '@/types';

export const dynamic = 'force-dynamic';

export default async function DesignPage({ params }: { params: { pageId: string } }) {
  const supabase = createClient();
  const { user, effectiveStatus } = await getMyAccount();
  if (!user) notFound();

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
      <DesignForm page={page} blocks={(blocks || []) as Block[]} readOnly={effectiveStatus !== 'active'} />
    </main>
  );
}
