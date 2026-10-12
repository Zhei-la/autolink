import 'server-only';
import type { AccountStatus } from '@/types';
import { getSessionUser, type SessionUser } from '@/lib/server/auth';
import { one, q } from '@/lib/server/db';

/** By링크 이용 정보 (라운지 회원마다 하나, 처음 들어올 때 자동으로 만들어짐) */
export interface BylinkAccount {
  user_id: number;
  page_limit: number;
  status: AccountStatus;
  expires_at: string | null;
  admin_memo: string | null;
  is_admin: boolean;
}

/** 처음 들어온 회원이면 이용 정보를 만들고, 최근 접속 시각을 남김 */
export async function ensureAccount(userId: number): Promise<void> {
  await q(
    `INSERT INTO bl_accounts (user_id, last_seen_at) VALUES ($1, now())
     ON CONFLICT (user_id) DO UPDATE SET last_seen_at = now()`,
    [userId]
  );
}

/**
 * 로그인한 회원 + By링크 이용 정보 + 실효 상태(effectiveStatus).
 * expires_at 이 지났으면 status 가 active 여도 'expired' 로 취급.
 */
export async function getMyAccount(): Promise<{
  user: (SessionUser & { email?: string | null }) | null;
  profile: BylinkAccount | null;
  effectiveStatus: AccountStatus;
}> {
  const user = await getSessionUser();
  if (!user) return { user: null, profile: null, effectiveStatus: 'expired' };

  let row = await one(`SELECT * FROM bl_accounts WHERE user_id = $1`, [user.id]);
  if (!row) {
    await ensureAccount(user.id);
    row = await one(`SELECT * FROM bl_accounts WHERE user_id = $1`, [user.id]);
  }
  const profile: BylinkAccount = {
    user_id: user.id,
    page_limit: row?.page_limit ?? 3,
    status: (row?.status as AccountStatus) || 'active',
    expires_at: row?.expires_at ? new Date(row.expires_at).toISOString() : null,
    admin_memo: row?.admin_memo ?? null,
    is_admin: user.isAdmin,
  };
  return { user, profile, effectiveStatus: computeEffectiveStatus(profile) };
}

export function computeEffectiveStatus(profile: Pick<BylinkAccount, 'status' | 'expires_at' | 'is_admin'> | null): AccountStatus {
  if (!profile) return 'active';
  if (profile.is_admin) return 'active';
  if (profile.status === 'suspended') return 'suspended';
  if (profile.status === 'expired') return 'expired';
  if (profile.expires_at && new Date(profile.expires_at).getTime() < Date.now()) return 'expired';
  return 'active';
}

export const STATUS_LABEL: Record<AccountStatus, string> = {
  active: '정상',
  suspended: '정지됨',
  expired: '만료됨',
};

export const STATUS_MESSAGE: Record<AccountStatus, string> = {
  active: '',
  suspended: '계정이 정지되어 편집할 수 없어요. 운영자에게 문의해주세요.',
  expired: '이용 기간이 만료되어 편집할 수 없어요. 운영자에게 연장을 요청해주세요.',
};

/**
 * 편집 가능한 상태인지 검사. 아니면 throw.
 * Server Action(blocks.ts / pages.ts) 에서 호출.
 */
export async function assertCanEdit() {
  const { user, profile, effectiveStatus } = await getMyAccount();
  if (!user) throw new Error('로그인이 필요합니다. 바이란미디어에서 다시 들어와 주세요.');
  if (effectiveStatus !== 'active') throw new Error(STATUS_MESSAGE[effectiveStatus]);
  return { user, profile };
}
