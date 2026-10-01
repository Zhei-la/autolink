'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Download, Eye, MousePointerClick, Percent, Search, Users } from 'lucide-react';
import { RANGE_LABEL, type RangeKey } from '@/lib/analytics';

// 차트 색: 기본 팔레트 1·2번 슬롯 (색약 검증된 순서)
const C_VIEWS = '#2a78d6';
const C_CLICKS = '#eb6834';

export interface DailyRow {
  day: string; // YYYY-MM-DD (KST)
  views: number;
  clicks: number;
}
export interface BlockRow {
  id: string;
  label: string;
  type: string;
  clicks: number;
}
export interface ChannelRow {
  key: string;
  label: string;
  host: string | null;
  views: number;
  visitors: number;
  clicks: number;
}

export interface StatsData {
  range: RangeKey;
  from: string;
  to: string;
  views: number;
  visitors: number;
  clicks: number;
  daily: DailyRow[];
  blocks: BlockRow[];
  channels: ChannelRow[];
  devices: { mobile: number; pc: number };
  inapp: { key: string; label: string; count: number }[];
  viewsAvailable: boolean;
  slug: string;
}

export function StatsView({ data }: { data: StatsData }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [customFrom, setCustomFrom] = useState(data.from);
  const [customTo, setCustomTo] = useState(data.to);
  const [q, setQ] = useState('');
  const [sortByClicks, setSortByClicks] = useState(true);

  const ctr = data.views > 0 ? (data.clicks / data.views) * 100 : 0;

  function go(range: string, from?: string, to?: string) {
    const params = new URLSearchParams(sp?.toString() || '');
    params.set('range', range);
    if (range === 'custom' && from && to) {
      params.set('from', from);
      params.set('to', to);
    } else {
      params.delete('from');
      params.delete('to');
    }
    router.push(`?${params.toString()}`);
  }

  const blocks = useMemo(() => {
    const list = data.blocks.filter((b) => !q || b.label.toLowerCase().includes(q.toLowerCase()));
    return sortByClicks ? [...list].sort((a, b) => b.clicks - a.clicks) : list;
  }, [data.blocks, q, sortByClicks]);
  const maxBlock = Math.max(1, ...data.blocks.map((b) => b.clicks));

  function downloadCsv() {
    const lines: string[] = [];
    lines.push(`By링크 분석,${data.slug},${data.from}~${data.to}`);
    lines.push('');
    lines.push('날짜,페이지뷰,클릭수');
    data.daily.forEach((d) => lines.push(`${d.day},${d.views},${d.clicks}`));
    lines.push('');
    lines.push('블록,클릭수');
    data.blocks.forEach((b) => lines.push(`"${b.label.replace(/"/g, '""')}",${b.clicks}`));
    lines.push('');
    lines.push('유입 채널,방문,순방문,클릭');
    data.channels.forEach((c) => lines.push(`"${c.label}${c.host ? ` (${c.host})` : ''}",${c.views},${c.visitors},${c.clicks}`));
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bylink-${data.slug}-${data.from}_${data.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      {/* 기간 + 다운로드 */}
      <div className="flex items-center gap-2">
        <select
          value={data.range}
          onChange={(e) => (e.target.value === 'custom' ? go('custom', customFrom, customTo) : go(e.target.value))}
          className="h-10 pl-3 pr-8 rounded-xl border border-[#e4e4e7] bg-white text-[14px] font-semibold"
          aria-label="기간"
        >
          {(Object.keys(RANGE_LABEL) as RangeKey[]).map((k) => (
            <option key={k} value={k}>
              {RANGE_LABEL[k]}
            </option>
          ))}
        </select>
        <button
          onClick={downloadCsv}
          className="h-10 px-3.5 rounded-xl border border-[#3b6cf6] text-[#3b6cf6] bg-white text-[14px] font-semibold inline-flex items-center gap-1.5"
        >
          <Download className="w-4 h-4" /> 다운로드
        </button>
        <span className="ml-auto text-[12px] text-[#a1a1a6]">
          {data.from === data.to ? data.from : `${data.from} ~ ${data.to}`}
        </span>
      </div>

      {data.range === 'custom' && (
        <div className="flex items-center gap-2 bg-white rounded-2xl p-3">
          <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="flex-1 h-10 px-2 rounded-lg border border-[#e4e4e7] text-[13px]" />
          <span className="text-[#a1a1a6]">~</span>
          <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="flex-1 h-10 px-2 rounded-lg border border-[#e4e4e7] text-[13px]" />
          <button onClick={() => go('custom', customFrom, customTo)} className="h-10 px-3.5 rounded-lg bg-[#111] text-white text-[13px] font-semibold">
            적용
          </button>
        </div>
      )}

      {!data.viewsAvailable && (
        <div className="p-3.5 rounded-2xl bg-[#fff7ed] border border-[#fed7aa] text-[13px] text-[#9a3412] leading-relaxed">
          방문 상세 기록(유입 채널·기기)이 아직 쌓이지 않고 있어요. DB 업데이트(마이그레이션 001)를 적용하면 그때부터 기록돼요.
        </div>
      )}

      {/* 요약 */}
      <div className="rounded-2xl bg-[#111] text-white grid grid-cols-4 divide-x divide-white/15 py-3.5">
        <Kpi Icon={Eye} label="페이지뷰" value={`${data.views.toLocaleString()}회`} />
        <Kpi Icon={Users} label="순방문자" value={`${data.visitors.toLocaleString()}명`} />
        <Kpi Icon={MousePointerClick} label="클릭수" value={`${data.clicks.toLocaleString()}회`} />
        <Kpi Icon={Percent} label="클릭률" value={`${ctr.toFixed(ctr >= 10 ? 0 : 1)}%`} />
      </div>

      {/* 일별 그래프 */}
      <Card title="일별 추이">
        <LineChart rows={data.daily} />
      </Card>

      {/* 블록 클릭 순위 */}
      <Card title="BEST 클릭 순위">
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1a6]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="검색"
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-[#e4e4e7] text-[14px] outline-none focus:border-[#111]"
            />
          </div>
          <button
            onClick={() => setSortByClicks((v) => !v)}
            className={`h-10 px-3.5 rounded-xl text-[13px] font-semibold ${sortByClicks ? 'bg-[#111] text-white' : 'border border-[#e4e4e7] bg-white'}`}
          >
            {sortByClicks ? '클릭순 정렬' : '페이지 순서'}
          </button>
        </div>
        {blocks.length === 0 ? (
          <Empty>클릭할 수 있는 블록이 없어요</Empty>
        ) : (
          <ol className="space-y-1.5">
            {blocks.map((b, i) => (
              <li key={b.id} className="relative rounded-xl border border-[#f0f0f2] px-3 py-2.5 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-l-xl"
                  style={{ width: `${(b.clicks / maxBlock) * 100}%`, backgroundColor: 'rgba(235,104,52,0.10)' }}
                  aria-hidden
                />
                <div className="relative flex items-center gap-2.5">
                  <span className="w-5 text-[12px] font-bold text-[#a1a1a6] text-center">{sortByClicks ? i + 1 : '·'}</span>
                  <span className="flex-1 min-w-0 text-[14px] truncate">{b.label}</span>
                  <span className="text-[14px] font-bold tabular-nums">{b.clicks.toLocaleString()}회</span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>

      {/* 유입 채널 */}
      <Card title="유입 채널">
        {data.channels.length === 0 ? (
          <Empty>아직 방문 기록이 없어요</Empty>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[#a1a1a6] text-[12px]">
                <th className="text-left font-medium pb-2">채널</th>
                <th className="text-right font-medium pb-2 w-14">방문</th>
                <th className="text-right font-medium pb-2 w-14">순방문</th>
                <th className="text-right font-medium pb-2 w-14">클릭</th>
              </tr>
            </thead>
            <tbody>
              {data.channels.map((c) => {
                const share = data.views ? c.views / data.views : 0;
                return (
                  <tr key={c.key} className="border-t border-[#f2f2f4]">
                    <td className="py-2.5 pr-2">
                      <div className="font-semibold">{c.label}</div>
                      {c.host && <div className="text-[11px] text-[#a1a1a6] truncate max-w-[180px]">{c.host}</div>}
                      <div className="mt-1.5 h-1.5 rounded-full bg-[#f2f2f4] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${share * 100}%`, backgroundColor: C_VIEWS }} />
                      </div>
                    </td>
                    <td className="text-right tabular-nums align-top py-2.5">{c.views}</td>
                    <td className="text-right tabular-nums align-top py-2.5">{c.visitors}</td>
                    <td className="text-right tabular-nums align-top py-2.5">{c.clicks}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* 유입 기기 */}
      <Card title="유입 기기">
        <DeviceBar mobile={data.devices.mobile} pc={data.devices.pc} />
        {data.inapp.length > 0 && (
          <div className="mt-4">
            <div className="text-[12px] text-[#a1a1a6] mb-1.5">앱 안에서 열어본 방문</div>
            <div className="flex flex-wrap gap-1.5">
              {data.inapp.map((a) => (
                <span key={a.key} className="px-2.5 h-7 inline-flex items-center rounded-full bg-[#f4f4f5] text-[12px]">
                  {a.label} <strong className="ml-1">{a.count}</strong>
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function Kpi({ Icon, label, value }: { Icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="px-2 text-center">
      <div className="flex items-center justify-center gap-1 text-[11px] text-white/70">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className="mt-1 text-[16px] font-bold tabular-nums">{value}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <h2 className="text-[15px] font-bold mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="py-6 text-center text-[13px] text-[#a1a1a6]">{children}</div>;
}

// ---------------------------------------------------------------------------
// 선 그래프: 페이지뷰 · 클릭수 (같은 단위 → 축 하나)
// ---------------------------------------------------------------------------

function niceMax(v: number) {
  if (v <= 4) return 4;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * p;
}

function LineChart({ rows }: { rows: DailyRow[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const W = 520;
  const H = 210;
  const padL = 34;
  const padR = 12;
  const padT = 12;
  const padB = 26;
  const iw = W - padL - padR;
  const ih = H - padT - padB;
  const max = niceMax(Math.max(1, ...rows.map((r) => Math.max(r.views, r.clicks))));
  const n = rows.length;
  const x = (i: number) => padL + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v: number) => padT + ih - (v / max) * ih;
  const ticks = [0, max / 4, max / 2, (max * 3) / 4, max];

  const path = (key: 'views' | 'clicks') => rows.map((r, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(r[key]).toFixed(1)}`).join(' ');

  // x축 글자: 처음·끝 + 중간 몇 개
  const labelIdx = new Set<number>();
  if (n > 0) {
    const step = Math.max(1, Math.ceil(n / 5));
    for (let i = 0; i < n; i += step) labelIdx.add(i);
    labelIdx.add(n - 1);
  }

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg || n === 0) return;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = n <= 1 ? 0 : Math.round(((px - padL) / iw) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  }

  const h = hover !== null ? rows[hover] : null;
  const fmt = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;

  return (
    <div>
      <div className="flex items-center gap-4 mb-2 text-[12px] text-[#52514e]">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-[3px] rounded-full" style={{ backgroundColor: C_VIEWS }} /> 페이지뷰
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-[3px] rounded-full" style={{ backgroundColor: C_CLICKS }} /> 클릭수
        </span>
      </div>
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto touch-pan-y"
          onPointerMove={onMove}
          onPointerDown={onMove}
          onPointerLeave={() => setHover(null)}
          role="img"
          aria-label="일별 페이지뷰와 클릭수"
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="#ececef" strokeWidth={1} />
              <text x={padL - 6} y={y(t) + 3.5} textAnchor="end" fontSize="10" fill="#8a8985">
                {Number.isInteger(t) ? t : t.toFixed(1)}
              </text>
            </g>
          ))}
          {rows.map((r, i) =>
            labelIdx.has(i) ? (
              <text key={r.day} x={x(i)} y={H - 8} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} fontSize="10" fill="#8a8985">
                {fmt(r.day)}
              </text>
            ) : null
          )}
          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + ih} stroke="#b9b8b3" strokeWidth={1} />}
          <path d={path('views')} fill="none" stroke={C_VIEWS} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          <path d={path('clicks')} fill="none" stroke={C_CLICKS} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {n === 1 &&
            (['views', 'clicks'] as const).map((k) => (
              <circle key={k} cx={x(0)} cy={y(rows[0][k])} r={4} fill={k === 'views' ? C_VIEWS : C_CLICKS} stroke="#fff" strokeWidth={2} />
            ))}
          {h && hover !== null && (
            <>
              <circle cx={x(hover)} cy={y(h.views)} r={4.5} fill={C_VIEWS} stroke="#fff" strokeWidth={2} />
              <circle cx={x(hover)} cy={y(h.clicks)} r={4.5} fill={C_CLICKS} stroke="#fff" strokeWidth={2} />
            </>
          )}
        </svg>
        {h && hover !== null && (
          <div
            className="absolute top-1 pointer-events-none bg-white border border-[#ececef] rounded-lg shadow-md px-2.5 py-1.5 text-[12px] whitespace-nowrap"
            style={{
              left: `${(x(hover) / W) * 100}%`,
              transform: hover > n / 2 ? 'translateX(calc(-100% - 8px))' : 'translateX(8px)',
            }}
          >
            <div className="font-semibold text-[#0b0b0b] mb-0.5">{h.day}</div>
            <div className="text-[#52514e]">
              <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: C_VIEWS }} />
              페이지뷰 <strong className="text-[#0b0b0b]">{h.views}</strong>
            </div>
            <div className="text-[#52514e]">
              <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: C_CLICKS }} />
              클릭수 <strong className="text-[#0b0b0b]">{h.clicks}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const C_MOBILE = '#1baf7a';
const C_PC = '#4a3aa7';

function DeviceBar({ mobile, pc }: { mobile: number; pc: number }) {
  const total = mobile + pc;
  if (!total) return <Empty>아직 방문 기록이 없어요</Empty>;
  const m = (mobile / total) * 100;
  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden gap-[2px] bg-white">
        {mobile > 0 && <div className="h-full" style={{ width: `${m}%`, backgroundColor: C_MOBILE }} />}
        {pc > 0 && <div className="h-full" style={{ width: `${100 - m}%`, backgroundColor: C_PC }} />}
      </div>
      <div className="mt-2.5 flex items-center gap-5 text-[13px] text-[#52514e]">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: C_MOBILE }} /> 모바일
          <strong className="text-[#0b0b0b] tabular-nums">{Math.round(m)}%</strong>
          <span className="text-[#a1a1a6]">({mobile})</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: C_PC }} /> PC
          <strong className="text-[#0b0b0b] tabular-nums">{Math.round(100 - m)}%</strong>
          <span className="text-[#a1a1a6]">({pc})</span>
        </span>
      </div>
    </div>
  );
}
