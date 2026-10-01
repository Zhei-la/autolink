'use client';

import { useState } from 'react';
import { Download, Mail, MessageSquareText } from 'lucide-react';

export interface ManageData {
  slug: string;
  inquiries: { id: string; option: string; block: string; at: string }[];
  emails: { id: string; email: string; consent: boolean; block: string; at: string }[];
  hasInquiryBlock: boolean;
  hasEmailBlock: boolean;
}

function fmt(at: string) {
  const d = new Date(at);
  return d.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function csv(name: string, header: string[], rows: (string | number | boolean)[][]) {
  const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const body = [header.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n');
  const blob = new Blob(['﻿' + body], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/** 관리 탭: 방문자가 남긴 문의 · 고객정보(이메일) 모아보기 */
export function ManageView({ data }: { data: ManageData }) {
  const [tab, setTab] = useState<'inquiry' | 'email'>(data.inquiries.length || !data.emails.length ? 'inquiry' : 'email');

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl p-1.5 grid grid-cols-2 gap-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <TabBtn on={tab === 'inquiry'} onClick={() => setTab('inquiry')} Icon={MessageSquareText} label="문의" count={data.inquiries.length} />
        <TabBtn on={tab === 'email'} onClick={() => setTab('email')} Icon={Mail} label="고객정보" count={data.emails.length} />
      </div>

      {tab === 'inquiry' ? (
        <section className="bg-white rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <Head
            title="문의 접수"
            onDownload={
              data.inquiries.length
                ? () =>
                    csv(
                      `bylink-${data.slug}-문의.csv`,
                      ['접수 시각', '선택 항목', '블록'],
                      data.inquiries.map((r) => [new Date(r.at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }), r.option, r.block])
                    )
                : undefined
            }
          />
          {data.inquiries.length === 0 ? (
            <Empty>{data.hasInquiryBlock ? '아직 들어온 문의가 없어요' : '페이지에 문의 블록을 추가하면 여기에 모여요'}</Empty>
          ) : (
            <ul className="divide-y divide-[#f2f2f4]">
              {data.inquiries.map((r) => (
                <li key={r.id} className="py-3 flex items-center gap-3">
                  <span className="flex-1 min-w-0">
                    <span className="block text-[14px] font-semibold truncate">{r.option}</span>
                    <span className="block text-[12px] text-[#a1a1a6] truncate">{r.block}</span>
                  </span>
                  <span className="text-[12px] text-[#71717a] tabular-nums flex-shrink-0">{fmt(r.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <section className="bg-white rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <Head
            title="고객정보 (이메일)"
            onDownload={
              data.emails.length
                ? () =>
                    csv(
                      `bylink-${data.slug}-고객정보.csv`,
                      ['등록 시각', '이메일', '수신 동의', '블록'],
                      data.emails.map((r) => [new Date(r.at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }), r.email, r.consent ? '동의' : '-', r.block])
                    )
                : undefined
            }
          />
          {data.emails.length === 0 ? (
            <Empty>{data.hasEmailBlock ? '아직 등록된 이메일이 없어요' : '페이지에 고객정보 블록을 추가하면 여기에 모여요'}</Empty>
          ) : (
            <ul className="divide-y divide-[#f2f2f4]">
              {data.emails.map((r) => (
                <li key={r.id} className="py-3 flex items-center gap-3">
                  <span className="flex-1 min-w-0 text-[14px] truncate">{r.email}</span>
                  <span className="text-[12px] text-[#71717a] tabular-nums flex-shrink-0">{fmt(r.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function TabBtn({ on, onClick, Icon, label, count }: { on: boolean; onClick: () => void; Icon: any; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={`h-11 rounded-xl text-[14px] font-semibold inline-flex items-center justify-center gap-1.5 ${on ? 'bg-[#111] text-white' : 'text-[#71717a]'}`}
    >
      <Icon className="w-4 h-4" /> {label} <span className={on ? 'text-white/70' : 'text-[#a1a1a6]'}>{count}건</span>
    </button>
  );
}

function Head({ title, onDownload }: { title: string; onDownload?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-[15px] font-bold">{title}</h2>
      {onDownload && (
        <button onClick={onDownload} className="h-9 px-3 rounded-lg border border-[#3b6cf6] text-[#3b6cf6] text-[13px] font-semibold inline-flex items-center gap-1">
          <Download className="w-3.5 h-3.5" /> CSV
        </button>
      )}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="py-10 text-center text-[13px] text-[#a1a1a6]">{children}</div>;
}
