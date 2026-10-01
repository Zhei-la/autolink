import { createClient } from '@/lib/supabase/server';
import type { AccountStatus, Profile } from '@/types';

/**
 * 로그인한 사용자의 프로필 + 실효 상태(effectiveStatus).
 * expires_at 이 지났으면 DB status 가 active 여도 'expired' 로 취급.
 */
export async function getMyAccount(): Promise<{
  user: { id: string; email?: string } | null;
  profile: Profile | null;
  effectiveStatus: AccountStatus;
}> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null, effectiveStatus: 'expired' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return {
    user: { id: user.id, email: user.email },
    profile: (profile as Profile) || null,
    effectiveStatus: computeEffectiveStatus(profile as Profile | null),
  };
}

export function computeEffectiveStatus(profile: Profile | null): AccountStatus {
  if (!profile) return 'active'; // 프로필 행이 아직 없으면(트리거 지연) 일단 통과
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
  if (!user) throw new Error('로그인이 필요합니다');
  if (effectiveStatus !== 'active') throw new Error(STATUS_MESSAGE[effectiveStatus]);
  return { user, profile };
}
