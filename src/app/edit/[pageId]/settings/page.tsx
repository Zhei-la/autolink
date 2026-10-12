import { notFound } from 'next/navigation';
import { getMyPage } from '@/lib/server/data';
import { getMyAccount } from '@/lib/db/account';
import { PageSettingsForm } from '@/components/editor/PageSettingsForm';

export const dynamic = 'force-dynamic';

export default async function SettingsPage({ params }: { params: { pageId: string } }) {
  const { user } = await getMyAccount();
  if (!user) notFound();

  const page = await getMyPage(params.pageId, user.id);
  if (!page) notFound();

  return (
    <main className="mx-auto max-w-[640px] px-4 pt-5">
      <PageSettingsForm page={page as any} />
    </main>
  );
}
