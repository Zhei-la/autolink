'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { AccountStatus } from '@/types';

export interface AdminCustomer {
  id: string;
  email: string | null;
  name: string | null;
  status: AccountStatus;
  expires_at: string | null;
  page_limit: number;
  is_admin: boolean;
  created_at: string;
  last_seen_at: string | null;
  admin_memo: string | null;
  page_count: number;
  total_views: number;
}

async function assertAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다');

  const { data: me } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (!me?.is_admin) throw new Error('관리자만 접근할 수 있어요');
  return { supabase, user };
}

/** 관리자 여부만 확인 (페이지 가드용, throw 안 함) */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    await assertAdmin();
    return true;
  } catch {
    return false;
  }
}

export async function listCustomers(): Promise<AdminCustomer[]> {
  const { supabase } = await assertAdmin();
  const { data, error } = await supabase.rpc('admin_list_customers');
  if (error) throw new Error(error.message);
  return (data || []).map((row: any) => ({
    ...row,
    page_count: Number(row.page_count || 0),
    total_views: Number(row.total_views || 0),
  }));
}

export async function updateCustomer(
  customerId: string,
  updates: {
    status?: AccountStatus;
    page_limit?: number;
    expires_at?: string | null; // 'YYYY-MM-DD' 또는 null
    admin_memo?: string | null;
  }
) {
  const { supabase, user } = await assertAdmin();

  if (customerId === user.id && updates.status && updates.status !== 'active') {
    throw new Error('본인 계정은 정지/만료 처리할 수 없어요');
  }

  const payload: Record<string, any> = {};
  if (updates.status) payload.status = updates.status;
  if (typeof updates.page_limit === 'number') {
    payload.page_limit = Math.max(0, Math.min(100, Math.floor(updates.page_limit)));
  }
  if (updates.expires_at !== undefined) {
    payload.expires_at = updates.expires_at
      ? new Date(`${updates.expires_at}T23:59:59+09:00`).toISOString() // KST 그날 자정까지
      : null;
  }
  if (updates.admin_memo !== undefined) payload.admin_memo = updates.admin_memo;

  const { error } = await supabase.from('profiles').update(payload).eq('id', customerId);
  if (error) throw new Error(error.message);

  revalidatePath('/admin');
}

/** 고객의 페이지 목록 (관리자 화면에서 펼쳐보기) */
export async function listCustomerPages(customerId: string) {
  const { supabase } = await assertAdmin();
  const { data, error } = await supabase
    .from('pages')
    .select('id, slug, title, is_published, view_count, updated_at')
    .eq('user_id', customerId)
    .order('updated_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}
