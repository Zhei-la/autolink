import { redirect, notFound } from 'next/navigation';
import { getMyPages } from '@/lib/server/data';
import { q } from '@/lib/server/db';
import { getMyAccount } from '@/lib/db/account';
import { EditorHeader } from '@/components/editor/EditorHeader';

export const dynamic = 'force-dynamic';

/**
 * 편집기 공통 틀: 위쪽 머리(로고 · 페이지 고르기 · 주소) + 탭(블록 · 꾸미기 · 통계 · 받은 문의)
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

  const all = await getMyPages(user.id);
  const pages = all.map((p) => ({ id: p.id, slug: p.slug, title: p.title }));

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
  const canCreate = effectiveStatus === 'active' && (user.isAdmin || all.filter((p) => p.is_owner).length < limit);

  return (
    <div className="min-h-screen bg-white pb-28">
      <EditorHeader
        pageId={current.id}
        pages={pages.map((p) => ({ ...p, avatar: avatarOf.get(p.id) || null }))}
        isAdmin={!!profile?.is_admin}
        userName={`${user.name}님`}
        canCreate={canCreate}
      />
      {children}
    </div>
  );
}
