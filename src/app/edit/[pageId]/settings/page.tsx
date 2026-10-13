import { notFound } from 'next/navigation';
import { getMyPage } from '@/lib/server/data';
import { getMyAccount } from '@/lib/db/account';
import { PageSettingsForm } from '@/components/editor/PageSettingsForm';
import { SharePanel, SharedNotice } from '@/components/share/SharePanel';
import { getShareInfo } from '@/lib/db/invites';
import { one } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

export default async function SettingsPage({ params }: { params: { pageId: string } }) {
  const { user } = await getMyAccount();
  if (!user) notFound();

  const page = await getMyPage(params.pageId, user.id);
  if (!page) notFound();

  return (
    <main className="mx-auto max-w-[640px] px-4 pt-5">
      <PageSettingsForm page={page as any}>
        {page.is_owner ? (
          <SharePanel pageId={page.id} pageTitle={page.title} info={await getShareInfo(page.id)} />
        ) : (
          <SharedNotice pageId={page.id} ownerName={(await ownerName(page.user_id)) || '페이지 주인'} />
        )}
      </PageSettingsForm>
    </main>
  );
}

async function ownerName(uid: number) {
  const u = await one(`SELECT COALESCE(nickname, name) AS name FROM users WHERE id = $1`, [uid]);
  return u?.name as string | undefined;
}
