import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getMyAccount } from '@/lib/db/account';
import { PageSettingsForm } from '@/components/editor/PageSettingsForm';

export const dynamic = 'force-dynamic';

export default async function SettingsPage({ params }: { params: { pageId: string } }) {
  const supabase = createClient();
  const { user } = await getMyAccount();
  if (!user) notFound();

  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('id', params.pageId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!page) notFound();

  return (
    <main className="mx-auto max-w-[560px] px-4 pt-1">
      <PageSettingsForm page={page} />
    </main>
  );
}
