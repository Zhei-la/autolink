import { redirect, notFound } from 'next/navigation';
import { getMyPages } from '@/lib/server/data';
import { q } from '@/lib/server/db';
import { getMyAccount } from '@/lib/db/account';
import { EditorNav } from '@/components/editor/EditorNav';
import { EditorTopBar } from '@/components/editor/EditorTopBar';

export const dynamic = 'force-dynamic';

/**
 * 편집기 공통 틀: 위쪽 주소 줄 + 아래쪽 검은 메뉴(페이지·디자인·분석·관리·페이지 전환)
 */
export default async function EditLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { pageId: string };
}) {
  const { user, profile, effectiveStatus } = await getMyAccount();
  if (!user) redirect(`/login?next=/edit/${params.pageId}`);

  const pages = (await getMyPages(user.id)).map((p) => ({ id: p.id, slug: p.slug, title: p.title }));

  const current = pages.find((p) => p.id === params.pageId);
  if (!current) notFound();

  // 페이지 전환 메뉴에 보여줄 대표 사진 (각 페이지의 프로필 블록)
  const ids = pages.map((p) => p.id);
  const profiles = ids.length
    ? await q(`SELECT page_id, data FROM bl_blocks WHERE type = 'profile' AND page_id = ANY($1::uuid[]) ORDER BY position`, [ids])
    : [];
  const avatarOf = new Map<string, string | null>();
  profiles.forEach((b: any) => {
    if (!avatarOf.has(b.page_id)) avatarOf.set(b.page_id, b.data?.avatarUrl || null);
  });

  const limit = profile?.page_limit ?? 3;
  const canCreate = effectiveStatus === 'active' && (user.isAdmin || pages.length < limit);

  return (
    <div className="min-h-screen bg-[#f2f2f4] pb-40">
      <EditorTopBar pageId={current.id} slug={current.slug} title={current.title} />
      {children}
      <EditorNav
        pageId={current.id}
        pages={pages.map((p) => ({ ...p, avatar: avatarOf.get(p.id) || null }))}
        isAdmin={!!profile?.is_admin}
        email={user.name + '님'}
        canCreate={canCreate}
      />
    </div>
  );
}
