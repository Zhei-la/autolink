'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, UserMinus } from 'lucide-react';
import { cancelInvite, createInvite, leavePage, removeMember, type ShareInfo } from '@/lib/db/invites';

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Seoul' });

/** 페이지 주인: 업체에 편집 권한 주기 (한 번만 쓰는 코드) */
export function SharePanel({ pageId, pageTitle, info }: { pageId: string; pageTitle: string; info: ShareInfo }) {
  const router = useRouter();
  const [invite, setInvite] = useState(info.invite);
  const [members, setMembers] = useState(info.members);
  const [copied, setCopied] = useState<'code' | 'msg' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const message = invite
    ? `${pageTitle} 링크 페이지를 직접 보고 고치실 수 있게 준비해 뒀어요.\n\n1. byranmedia.com 에서 카카오로 가입해 주세요\n2. byranmedia.com/bylink 에서 'By링크 시작하기'를 눌러 주세요\n3. '코드로 페이지 받기'에 아래 코드를 넣어 주세요\n\n코드: ${invite.code}\n(${fmt(invite.expires_at)}까지, 한 번만 쓸 수 있어요)`
    : '';

  async function copy(text: string, what: 'code' | 'msg') {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(what);
    setTimeout(() => setCopied(null), 1600);
  }

  function run(fn: () => Promise<void>) {
    setError(null);
    start(async () => {
      try {
        await fn();
      } catch (e: any) {
        setError(e?.message || '실패했어요');
      }
    });
  }

  return (
    <section className="bl-panel p-4">
      <h2 className="text-[15px] font-bold">업체와 함께 편집</h2>
      <p className="text-[13px] text-[#6b6b70] mt-1 leading-relaxed">
        코드를 만들어 업체 사장님께 보내 주세요. 사장님이 바이란미디어에 가입하고 코드를 넣으면 이 페이지를 같이 보고 고칠 수 있어요. 코드는 7일 동안 한 번만 쓸 수 있어요.
      </p>

      {invite ? (
        <div className="mt-4 rounded-[14px] bg-mist p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[26px] font-extrabold tracking-[0.12em] text-ink tabular-nums">{invite.code}</div>
              <div className="text-[12px] text-[#8b8b90] mt-0.5">{fmt(invite.expires_at)}까지 · 한 번만 사용</div>
            </div>
            <button
              type="button"
              onClick={() => copy(invite.code, 'code')}
              className={`h-9 px-3 rounded-full text-[13px] font-semibold inline-flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${copied === 'code' ? 'bg-cherry text-white' : 'bg-white text-ink'}`}
            >
              {copied === 'code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied === 'code' ? '복사됨' : '코드 복사'}
            </button>
          </div>
          <button
            type="button"
            onClick={() => copy(message, 'msg')}
            className="mt-3 w-full h-11 rounded-[12px] bg-ink text-white text-[14px] font-semibold"
          >
            {copied === 'msg' ? '안내 문구를 복사했어요' : '사장님께 보낼 안내 문구 복사'}
          </button>
          <div className="mt-2 flex justify-end gap-3 text-[12px]">
            <button type="button" disabled={pending} onClick={() => run(async () => setInvite(await createInvite(pageId)))} className="text-[#6b6b70] underline">
              새 코드로 바꾸기
            </button>
            <button type="button" disabled={pending} onClick={() => run(async () => { await cancelInvite(pageId); setInvite(null); })} className="text-[#6b6b70] underline">
              코드 없애기
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(async () => setInvite(await createInvite(pageId)))}
          className="mt-4 w-full h-12 rounded-[12px] border-2 border-dashed border-line text-ink text-[14px] font-bold hover:border-cherry hover:text-cherry transition disabled:opacity-50"
        >
          {pending ? '만드는 중…' : '초대 코드 만들기'}
        </button>
      )}

      {members.length > 0 && (
        <div className="mt-5">
          <div className="text-[13px] font-semibold text-[#3f3f44] mb-2">함께 편집하는 사람</div>
          <ul className="rounded-[14px] border border-line divide-y divide-line">
            {members.map((m) => (
              <li key={m.user_id} className="flex items-center justify-between px-3.5 h-12">
                <span className="text-[14px] text-ink">{m.name}</span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    run(async () => {
                      await removeMember(pageId, m.user_id);
                      setMembers((list) => list.filter((x) => x.user_id !== m.user_id));
                      router.refresh();
                    })
                  }
                  className="text-[12px] text-[#8b8b90] hover:text-cherry inline-flex items-center gap-1"
                >
                  <UserMinus className="w-3.5 h-3.5" /> 빼기
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {error && <p className="mt-3 text-[13px] text-cherry">{error}</p>}
    </section>
  );
}

/** 초대받은 사람: 공유받은 페이지 안내 + 나가기 */
export function SharedNotice({ pageId, ownerName }: { pageId: string; ownerName: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <section className="bl-panel p-4">
      <h2 className="text-[15px] font-bold">공유받은 페이지</h2>
      <p className="text-[13px] text-[#6b6b70] mt-1">{ownerName}님이 함께 편집하도록 초대한 페이지예요. 내용·디자인·주소를 고칠 수 있어요.</p>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await leavePage(pageId);
            router.push('/dashboard');
          })
        }
        className="mt-3 h-10 px-4 rounded-full bg-mist text-[13px] font-semibold text-[#3f3f44]"
      >
        이 페이지에서 나가기
      </button>
    </section>
  );
}
