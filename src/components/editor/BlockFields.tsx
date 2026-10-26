'use client';

import { nanoid } from 'nanoid';
import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2 } from 'lucide-react';
import {
  FieldLabel,
  ImageField,
  LayoutPicker,
  Segmented,
  TextArea,
  TextField,
  ThumbButton,
  Toggle,
} from './ui';
import { SNS_PLATFORMS } from '@/components/page/icons';
import { CalendarEditor, EmailEditor, InquiryEditor, ProductGridEditor } from './BlockEditModal';

type FieldsProps = { data: any; onChange: (next: any) => void };

/** 블록 타입별 입력 칸. data 를 바꾸면 onChange(새 data) — 저장은 바깥(자동 저장)에서 */
export function BlockFields({ type, data, onChange }: FieldsProps & { type: string }) {
  switch (type) {
    case 'profile':
      return <ProfileFields data={data} onChange={onChange} />;
    case 'link':
      return <LinkFields data={data} onChange={onChange} />;
    case 'link_collection':
      return <CollectionFields data={data} onChange={onChange} />;
    case 'sns':
      return <SnsFields data={data} onChange={onChange} />;
    case 'video':
      return <VideoFields data={data} onChange={onChange} />;
    case 'image_banner':
      return <GalleryFields data={data} onChange={onChange} />;
    case 'spacer':
      return <SpacerFields data={data} onChange={onChange} />;
    case 'text':
      return <TextFields data={data} onChange={onChange} />;
    case 'product_grid':
      return <ProductGridEditor data={data} onChange={onChange} />;
    case 'inquiry':
      return <InquiryEditor data={data} onChange={onChange} />;
    case 'calendar':
      return <CalendarEditor data={data} onChange={onChange} />;
    case 'email':
      return <EmailEditor data={data} onChange={onChange} />;
    default:
      return <p className="text-sm text-[#888]">이 블록은 편집할 항목이 없어요.</p>;
  }
}

// ---------------------------------------------------------------------------
// 레이아웃 아이콘 (작은 그림)
// ---------------------------------------------------------------------------

const ic = 'w-9 h-9';
const LayoutIcons = {
  cover: (
    <svg viewBox="0 0 36 36" className={ic} fill="currentColor">
      <rect x="4" y="4" width="28" height="16" rx="3" />
      <rect x="10" y="24" width="16" height="3" rx="1.5" />
      <rect x="13" y="29" width="10" height="2" rx="1" opacity=".6" />
    </svg>
  ),
  circle: (
    <svg viewBox="0 0 36 36" className={ic} fill="currentColor">
      <circle cx="18" cy="13" r="8" />
      <rect x="10" y="24" width="16" height="3" rx="1.5" />
      <rect x="13" y="29" width="10" height="2" rx="1" opacity=".6" />
    </svg>
  ),
  small: (
    <svg viewBox="0 0 36 36" className={ic} fill="currentColor">
      <circle cx="18" cy="14" r="5" />
      <rect x="10" y="23" width="16" height="3" rx="1.5" />
      <rect x="13" y="28" width="10" height="2" rx="1" opacity=".6" />
    </svg>
  ),
  background: (
    <svg viewBox="0 0 36 36" className={ic} fill="currentColor">
      <path d="M4 7a3 3 0 0 1 3-3h22a3 3 0 0 1 3 3v22a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" opacity=".35" />
      <path d="M8 22l6-7 5 5 3-3 6 5v3H8z" />
      <rect x="10" y="27" width="16" height="2.5" rx="1.25" />
    </svg>
  ),
  cardS: (
    <svg viewBox="0 0 36 36" className={ic} fill="currentColor">
      <rect x="3" y="11" width="30" height="14" rx="3" opacity=".35" />
      <rect x="5.5" y="13.5" width="9" height="9" rx="2" />
      <rect x="17" y="16.5" width="12" height="3" rx="1.5" />
    </svg>
  ),
  cardM: (
    <svg viewBox="0 0 36 36" className={ic} fill="currentColor">
      <rect x="5" y="6" width="26" height="24" rx="3" opacity=".35" />
      <rect x="5" y="6" width="26" height="13" rx="3" />
      <rect x="11" y="23" width="14" height="3" rx="1.5" />
    </svg>
  ),
  cardL: (
    <svg viewBox="0 0 36 36" className={ic} fill="currentColor">
      <rect x="5" y="4" width="26" height="28" rx="3" />
      <rect x="9" y="25" width="14" height="3" rx="1.5" fill="#fff" opacity=".9" />
    </svg>
  ),
  list: (
    <svg viewBox="0 0 36 36" className={ic} fill="currentColor">
      <rect x="5" y="6" width="26" height="6" rx="2" />
      <rect x="5" y="15" width="26" height="6" rx="2" />
      <rect x="5" y="24" width="26" height="6" rx="2" />
    </svg>
  ),
  grid2: (
    <svg viewBox="0 0 36 36" className={ic} fill="currentColor">
      <rect x="5" y="5" width="12" height="12" rx="2" />
      <rect x="19" y="5" width="12" height="12" rx="2" />
      <rect x="5" y="19" width="12" height="12" rx="2" />
      <rect x="19" y="19" width="12" height="12" rx="2" />
    </svg>
  ),
  grid3: (
    <svg viewBox="0 0 36 36" className={ic} fill="currentColor">
      {[5, 14, 23].map((x) =>
        [8, 19].map((y) => <rect key={`${x}-${y}`} x={x} y={y} width="8" height="8" rx="1.5" />)
      )}
    </svg>
  ),
  carousel1: (
    <svg viewBox="0 0 36 36" className={ic} fill="currentColor">
      <rect x="3" y="9" width="24" height="18" rx="2.5" />
      <rect x="29" y="9" width="5" height="18" rx="1.5" opacity=".45" />
    </svg>
  ),
  carousel2: (
    <svg viewBox="0 0 36 36" className={ic} fill="currentColor">
      <rect x="3" y="10" width="13" height="16" rx="2" />
      <rect x="18" y="10" width="13" height="16" rx="2" />
      <rect x="33" y="10" width="3" height="16" rx="1" opacity=".45" />
    </svg>
  ),
};

// ---------------------------------------------------------------------------
// 프로필
// ---------------------------------------------------------------------------

function ProfileFields({ data, onChange }: FieldsProps) {
  const layout = data.layout || 'circle';
  return (
    <div className="space-y-5">
      <LayoutPicker
        label="프로필 모양"
        value={layout}
        columns={4}
        onChange={(v) => onChange({ ...data, layout: v })}
        options={[
          { value: 'cover', label: '와이드', icon: LayoutIcons.cover },
          { value: 'circle', label: '동그라미', icon: LayoutIcons.circle },
          { value: 'small', label: '한 줄', icon: LayoutIcons.small },
          { value: 'background', label: '사진 바탕', icon: LayoutIcons.background },
        ]}
      />
      {(layout === 'cover' || layout === 'background') && (
        <Segmented
          label="사진 높이"
          value={data.coverHeight || 'mid'}
          onChange={(v) => onChange({ ...data, coverHeight: v })}
          options={[
            { value: 'low', label: '낮게' },
            { value: 'mid', label: '보통' },
            { value: 'high', label: '높게' },
          ]}
        />
      )}
      <ImageField
        label="프로필 사진"
        hint={layout === 'cover' || layout === 'background' ? '가로 1200px 이상 추천' : '정사각 사진 추천'}
        value={data.avatarUrl}
        onChange={(url) => onChange((d: any) => ({ ...d, avatarUrl: url }))}
        preset="cover"
        shape={layout === 'cover' || layout === 'background' ? 'wide' : 'circle'}
      />
      <TextField
        label="이름"
        value={data.name || ''}
        onChange={(v) => onChange({ ...data, name: v })}
        maxLength={40}
        placeholder="예: 바이란미디어"
      />
      <TextArea
        label="한 줄 소개"
        value={data.bio || ''}
        onChange={(v) => onChange({ ...data, bio: v })}
        maxLength={120}
        rows={2}
        placeholder="어떤 일을 하는지 짧게 적어 주세요"
      />
      <Segmented
        label="이름 크기"
        value={data.titleSize || 'm'}
        onChange={(v) => onChange({ ...data, titleSize: v })}
        options={[
          { value: 's', label: '작게' },
          { value: 'm', label: '보통' },
          { value: 'l', label: '크게' },
        ]}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 단일 링크
// ---------------------------------------------------------------------------

function LinkFields({ data, onChange }: FieldsProps) {
  return (
    <div className="space-y-5">
      <div>
        <FieldLabel hint="사진은 선택 · 엔터로 줄바꿈">버튼 글자</FieldLabel>
        <div className="flex items-center gap-2.5">
          <ThumbButton value={data.thumbnail} onChange={(url) => onChange((d: any) => ({ ...d, thumbnail: url }))} />
          <textarea
            value={data.title || ''}
            onChange={(e) => onChange({ ...data, title: e.target.value })}
            maxLength={80}
            rows={(data.title || '').includes('\n') ? 2 : 1}
            placeholder="예: 상담 신청하기"
            className="flex-1 min-w-0 min-h-[48px] py-3 px-3.5 rounded-[12px] text-[15px] leading-snug resize-none bg-mist border border-transparent outline-none focus:bg-white focus:border-ink focus:shadow-[0_0_0_3px_#ffedf1] transition"
          />
        </div>
      </div>
      <div>
        <FieldLabel>
          누르면 갈 주소<span className="ml-0.5 text-cherry">*</span>
        </FieldLabel>
        <input
          value={data.url || ''}
          onChange={(e) => onChange({ ...data, url: e.target.value })}
          placeholder="byranmedia.com 처럼 입력"
          inputMode="url"
          className="w-full h-12 px-3.5 rounded-[12px] text-[15px] bg-mist border border-transparent outline-none focus:bg-white focus:border-ink focus:shadow-[0_0_0_3px_#ffedf1] transition"
        />
        {data.url && !/^(https?:|tel:|mailto:)/i.test(data.url) && (
          <p className="text-xs text-[#8b8b90] mt-1.5">https:// 는 안 써도 자동으로 붙어요</p>
        )}
      </div>
      <LayoutPicker
        label="버튼 모양"
        value={data.cardSize || 's'}
        onChange={(v) => onChange({ ...data, cardSize: v })}
        options={[
          { value: 's', label: '한 줄', icon: LayoutIcons.cardS },
          { value: 'm', label: '사진 카드', icon: LayoutIcons.cardM },
          { value: 'l', label: '큰 사진', icon: LayoutIcons.cardL },
        ]}
      />
      <TextField
        label="나만 보는 메모"
        value={data.memo || ''}
        onChange={(v) => onChange({ ...data, memo: v })}
        placeholder="예: 10월 할인 코드 BYRAN10"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 그룹 링크
// ---------------------------------------------------------------------------

function CollectionFields({ data, onChange }: FieldsProps) {
  const links: any[] = data.links || [];
  const set = (next: any[]) => onChange({ ...data, links: next });
  const update = (i: number, patch: any) => set(links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= links.length) return;
    const next = links.slice();
    [next[i], next[j]] = [next[j], next[i]];
    set(next);
  };

  return (
    <div className="space-y-5">
      <TextField
        label="묶음 제목"
        value={data.title || ''}
        onChange={(v) => onChange({ ...data, title: v })}
        placeholder="버튼 묶음 위에 보이는 제목 (선택)"
        maxLength={40}
      />

      <div>
        <FieldLabel hint={`${links.length}개`}>
          버튼 목록<span className="text-cherry">*</span>
        </FieldLabel>
        <div className="space-y-2.5">
          {links.map((l, i) => (
            <div key={l.id} className="rounded-[14px] border border-line bg-white p-2.5">
              <div className="flex items-start gap-2.5">
                <ThumbButton
                  value={l.thumbnail}
                  size={56}
                  onChange={(url) =>
                    onChange((d: any) => ({
                      ...d,
                      links: (d.links || []).map((x: any) => (x.id === l.id ? { ...x, thumbnail: url } : x)),
                    }))
                  }
                />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <input
                    value={l.title || ''}
                    onChange={(e) => update(i, { title: e.target.value })}
                    placeholder="제목"
                    className="w-full h-9 px-2.5 rounded-[10px] text-[14px] bg-mist border border-transparent outline-none focus:bg-white focus:border-ink focus:shadow-[0_0_0_3px_#ffedf1] transition"
                  />
                  <input
                    value={l.url || ''}
                    onChange={(e) => update(i, { url: e.target.value })}
                    placeholder="https://"
                    inputMode="url"
                    className="w-full h-9 px-2.5 rounded-[10px] text-[13px] bg-mist border border-transparent outline-none focus:bg-white focus:border-ink focus:shadow-[0_0_0_3px_#ffedf1] transition"
                  />
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-1 text-[#a1a1a6] disabled:opacity-30" aria-label="위로">
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === links.length - 1} className="p-1 text-[#a1a1a6] disabled:opacity-30" aria-label="아래로">
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => set(links.filter((_, idx) => idx !== i))} className="p-1 text-cherry" aria-label="삭제">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => set([...links, { id: nanoid(8), title: '', url: '' }])}
          className="mt-2.5 mx-auto flex items-center justify-center gap-1 h-11 px-8 rounded-full border-2 border-dashed border-line text-ink text-sm font-semibold hover:border-ink transition"
        >
          <Plus className="w-4 h-4" /> 링크 추가
        </button>
      </div>

      <LayoutPicker
        label="보여주는 방식"
        value={data.layout || 'list'}
        onChange={(v) => onChange({ ...data, layout: v })}
        options={[
          { value: 'list', label: '목록', icon: LayoutIcons.list },
          { value: 'grid2', label: '2칸', icon: LayoutIcons.grid2 },
          { value: 'grid3', label: '3칸', icon: LayoutIcons.grid3 },
          { value: 'carousel1', label: '크게 넘기기', icon: LayoutIcons.carousel1 },
          { value: 'carousel2', label: '작게 넘기기', icon: LayoutIcons.carousel2 },
        ]}
      />

      {!(data.layout || 'list').startsWith('carousel') && (
        <Segmented
          label="버튼이 많을 때"
          value={data.collapse ? 'fold' : 'all'}
          onChange={(v) => onChange({ ...data, collapse: v === 'fold' })}
          options={[
            { value: 'all', label: '모두 보이기' },
            { value: 'fold', label: '더보기로 접기' },
          ]}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SNS 연결
// ---------------------------------------------------------------------------

function SnsFields({ data, onChange }: FieldsProps) {
  const links: any[] = data.links || [];
  const set = (next: any[]) => onChange({ ...data, links: next });
  const used = new Set(links.map((l) => l.platform));
  const nextPlatform = SNS_PLATFORMS.find((p) => !used.has(p.value))?.value || 'website';

  return (
    <div className="space-y-2.5">
      {links.map((l, i) => {
        const meta = SNS_PLATFORMS.find((p) => p.value === l.platform) || SNS_PLATFORMS[0];
        const Icon = meta.Icon;
        return (
          <div key={i} className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-[#d4d4d8] flex-shrink-0" />
            <div className="relative flex-shrink-0">
              <select
                value={l.platform}
                onChange={(e) => set(links.map((x, idx) => (idx === i ? { ...x, platform: e.target.value } : x)))}
                className="appearance-none w-12 h-12 rounded-[12px] bg-mist text-transparent cursor-pointer"
                aria-label="채널 종류"
              >
                {SNS_PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value} className="text-[#111]">
                    {p.label}
                  </option>
                ))}
              </select>
              <Icon className="w-5 h-5 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-[#111]" />
            </div>
            <input
              value={l.url || ''}
              onChange={(e) => set(links.map((x, idx) => (idx === i ? { ...x, url: e.target.value } : x)))}
              placeholder={`${meta.label} ${meta.placeholder}`}
              inputMode={l.platform === 'phone' ? 'tel' : l.platform === 'email' ? 'email' : 'url'}
              className="flex-1 min-w-0 h-12 px-3.5 rounded-[12px] text-[15px] bg-mist border border-transparent outline-none focus:bg-white focus:border-ink focus:shadow-[0_0_0_3px_#ffedf1] transition"
            />
            <button type="button" onClick={() => set(links.filter((_, idx) => idx !== i))} className="p-2 text-[#71717a]" aria-label="삭제">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => set([...links, { platform: nextPlatform, url: '' }])}
        className="mt-1 mx-auto flex items-center justify-center gap-1 h-11 px-8 rounded-full border-2 border-dashed border-line text-ink text-sm font-semibold hover:border-ink transition"
      >
        <Plus className="w-4 h-4" /> SNS 연결 추가
      </button>
      <p className="text-[12px] text-[#a1a1a6] text-center">왼쪽 아이콘을 눌러 채널 종류를 바꿀 수 있어요</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 동영상 · 갤러리 · 여백 · 텍스트
// ---------------------------------------------------------------------------

function VideoFields({ data, onChange }: FieldsProps) {
  return (
    <div className="space-y-4">
      <TextField
        label="유튜브 주소"
        required
        value={data.url || ''}
        onChange={(v) => onChange({ ...data, url: v })}
        placeholder="https://youtu.be/..."
      />
      <TextField label="제목 (선택)" value={data.title || ''} onChange={(v) => onChange({ ...data, title: v })} maxLength={40} />
      <p className="text-[12px] text-[#a1a1a6]">유튜브 영상·쇼츠 주소를 넣으면 페이지에서 바로 재생돼요.</p>
    </div>
  );
}

function GalleryFields({ data, onChange }: FieldsProps) {
  const images: any[] = data.images || [];
  const set = (next: any[]) => onChange({ ...data, images: next });
  return (
    <div className="space-y-5">
      <TextField label="제목 (선택)" value={data.title || ''} onChange={(v) => onChange({ ...data, title: v })} maxLength={40} />
      <div>
        <FieldLabel hint={`${images.length}장`}>사진</FieldLabel>
        <div className="space-y-3">
          {images.map((im, i) => (
            <div key={im.id} className="flex items-start gap-3">
              <ImageField
                value={im.url}
                preset="gallery"
                onChange={(url) =>
                  onChange((d: any) => ({
                    ...d,
                    images: url
                      ? (d.images || []).map((x: any) => (x.id === im.id ? { ...x, url } : x))
                      : (d.images || []).filter((x: any) => x.id !== im.id),
                  }))
                }
              />
              <div className="flex-1 min-w-0">
                <FieldLabel>누르면 이동할 주소 (선택)</FieldLabel>
                <input
                  value={im.link || ''}
                  onChange={(e) => set(images.map((x, idx) => (idx === i ? { ...x, link: e.target.value } : x)))}
                  placeholder="https://"
                  className="w-full h-10 px-3 rounded-[10px] text-[14px] bg-mist border border-transparent outline-none focus:bg-white focus:border-ink focus:shadow-[0_0_0_3px_#ffedf1] transition"
                />
              </div>
            </div>
          ))}
          <AddImageButton
            onAdd={(url) => onChange((d: any) => ({ ...d, images: [...(d.images || []), { id: nanoid(8), url }] }))}
          />
        </div>
      </div>
      <Segmented
        label="보여주는 방식"
        value={data.layout || 'single'}
        onChange={(v) => onChange({ ...data, layout: v })}
        options={[
          { value: 'single', label: '세로로' },
          { value: 'slide', label: '옆으로 넘기기' },
          { value: 'grid2', label: '2칸' },
        ]}
      />
      {(data.layout || 'single') !== 'grid2' && (
        <Segmented
          label="사진 비율"
          value={data.ratio || 'square'}
          onChange={(v) => onChange({ ...data, ratio: v })}
          options={[
            { value: 'square', label: '정사각' },
            { value: 'wide', label: '가로' },
            { value: 'tall', label: '세로' },
          ]}
        />
      )}
    </div>
  );
}

function AddImageButton({ onAdd }: { onAdd: (url: string) => void }) {
  return (
    <div className="pt-1">
      <ImageField value="" onChange={(url) => url && onAdd(url)} preset="gallery" />
    </div>
  );
}

function SpacerFields({ data, onChange }: FieldsProps) {
  return (
    <div className="space-y-4">
      <Segmented
        label="간격"
        value={data.size || 'm'}
        onChange={(v) => onChange({ ...data, size: v })}
        options={[
          { value: 's', label: '작게' },
          { value: 'm', label: '보통' },
          { value: 'l', label: '크게' },
        ]}
      />
      <div className="flex items-center justify-between">
        <span className="text-[14px] text-[#444]">가운데 선 넣기</span>
        <Toggle size="sm" checked={!!data.line} onChange={(v) => onChange({ ...data, line: v })} />
      </div>
    </div>
  );
}

function TextFields({ data, onChange }: FieldsProps) {
  return (
    <div className="space-y-4">
      <Segmented
        label="스타일"
        value={data.variant || 'heading'}
        onChange={(v) => onChange({ ...data, variant: v })}
        options={[
          { value: 'heading', label: '제목' },
          { value: 'body', label: '본문' },
          { value: 'divider', label: '구분선' },
        ]}
      />
      {data.variant !== 'divider' && (
        <>
          <TextArea
            label="내용"
            value={data.text || ''}
            onChange={(v) => onChange({ ...data, text: v })}
            rows={data.variant === 'body' ? 5 : 2}
          />
          <Segmented
            label="정렬"
            value={data.align || 'center'}
            onChange={(v) => onChange({ ...data, align: v })}
            options={[
              { value: 'center', label: '가운데' },
              { value: 'left', label: '왼쪽' },
            ]}
          />
        </>
      )}
    </div>
  );
}
