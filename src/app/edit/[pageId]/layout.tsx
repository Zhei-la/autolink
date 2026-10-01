import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
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
  if (!user) redirect('/login');

  const supabase = createClient();
  const { data: pages } = await supabase
    .from('pages')
    .select('id, slug, title')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  const current = (pages || []).find((p) => p.id === params.pageId);
  if (!current) notFound();

  // 페이지 전환 메뉴에 보여줄 대표 사진 (각 페이지의 프로필 블록)
  const ids = (pages || []).map((p) => p.id);
  const { data: profiles } = ids.length
    ? await supabase.from('blocks').select('page_id, data').eq('type', 'profile').in('page_id', ids)
    : { data: [] as any[] };
  const avatarOf = new Map<string, string | null>();
  (profiles || []).forEach((b: any) => {
    if (!avatarOf.has(b.page_id)) avatarOf.set(b.page_id, b.data?.avatarUrl || null);
  });

  const limit = profile?.page_limit ?? 3;
  const canCreate = effectiveStatus === 'active' && (pages?.length || 0) < limit;

  return (
    <div className="min-h-screen bg-[#f2f2f4] pb-40">
      <EditorTopBar pageId={current.id} slug={current.slug} title={current.title} />
      {children}
      <EditorNav
        pageId={current.id}
        pages={(pages || []).map((p) => ({ ...p, avatar: avatarOf.get(p.id) || null }))}
        isAdmin={!!profile?.is_admin}
        email={user.email}
        canCreate={canCreate}
      />
    </div>
  );
}
