'use client';

import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { updateBlockData } from '@/lib/db/blocks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Block } from '@/types';
import { nanoid } from 'nanoid';

interface Props {
  pageId: string;
  block: Block;
  onClose: () => void;
}

export function BlockEditModal({ pageId, block, onClose }: Props) {
  const [data, setData] = useState<any>(block.data);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await updateBlockData(pageId, block.id, data);
      onClose();
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-md rounded-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-border flex items-center justify-between p-4">
          <h2 className="font-bold text-lg">{getBlockTypeLabel(block.type)} 수정</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-primary-soft rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {block.type === 'profile' && <ProfileEditor data={data} onChange={setData} />}
          {block.type === 'link' && <LinkEditor data={data} onChange={setData} />}
          {block.type === 'product_grid' && <ProductGridEditor data={data} onChange={setData} />}
          {block.type === 'inquiry' && <InquiryEditor data={data} onChange={setData} />}
          {block.type === 'calendar' && <CalendarEditor data={data} onChange={setData} />}
          {block.type === 'email' && <EmailEditor data={data} onChange={setData} />}
          {block.type === 'text' && <TextEditor data={data} onChange={setData} />}
          {block.type === 'sns' && <SnsEditor data={data} onChange={setData} />}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-border p-4 flex gap-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">취소</Button>
          <Button onClick={handleSave} loading={saving} className="flex-1">저장</Button>
        </div>
      </div>
    </div>
  );
}

function ProfileEditor({ data, onChange }: any) {
  return (
    <>
      <Input label="이름" value={data.name || ''} onChange={(e) => onChange({ ...data, name: e.target.value })} maxLength={30} />
      <Input label="한 줄 소개" value={data.bio || ''} onChange={(e) => onChange({ ...data, bio: e.target.value })} maxLength={60} placeholder="예: 매일 새 쇼츠 올리는 크리에이터 🎬" />
      <Input label="이니셜 (사진 없을 때 표시)" value={data.initial || ''} onChange={(e) => onChange({ ...data, initial: e.target.value.slice(0, 1) })} maxLength={1} />
      <Input label="프로필 사진 URL (선택)" value={data.avatarUrl || ''} onChange={(e) => onChange({ ...data, avatarUrl: e.target.value })} placeholder="https://..." />
    </>
  );
}

function LinkEditor({ data, onChange }: any) {
  return (
    <>
      <Input label="제목" value={data.title || ''} onChange={(e) => onChange({ ...data, title: e.target.value })} maxLength={50} />
      <Input label="URL" value={data.url || ''} onChange={(e) => onChange({ ...data, url: e.target.value })} placeholder="https://..." />
      <Input label="썸네일 URL (선택)" value={data.thumbnail || ''} onChange={(e) => onChange({ ...data, thumbnail: e.target.value })} placeholder="https://..." />
      <Input label="메모 (운영자만 봄)" value={data.memo || ''} onChange={(e) => onChange({ ...data, memo: e.target.value })} placeholder="할인 코드 등" />
    </>
  );
}

function ProductGridEditor({ data, onChange }: any) {
  const products = data.products || [];

  function addProduct() {
    onChange({
      ...data,
      products: [...products, { id: nanoid(8), title: '새 상품', url: '', price: 0, discount: 0 }],
    });
  }
  function updateProduct(idx: number, updates: any) {
    onChange({
      ...data,
      products: products.map((p: any, i: number) => i === idx ? { ...p, ...updates } : p),
    });
  }
  function removeProduct(idx: number) {
    onChange({ ...data, products: products.filter((_: any, i: number) => i !== idx) });
  }

  return (
    <>
      <Input label="제목 (선택)" value={data.title || ''} onChange={(e) => onChange({ ...data, title: e.target.value })} placeholder="예: 이번 주 추천템" />
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-bold">상품 목록 ({products.length})</label>
          <Button size="sm" variant="secondary" onClick={addProduct}>
            <Plus className="w-3 h-3" /> 추가
          </Button>
        </div>
        <div className="space-y-2">
          {products.map((product: any, idx: number) => (
            <div key={product.id} className="border border-border rounded-xl p-3 space-y-2">
              <div className="flex items-start justify-between">
                <span className="text-xs text-text-3 font-bold">상품 {idx + 1}</span>
                <button onClick={() => removeProduct(idx)} className="text-red-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <Input placeholder="상품명" value={product.title} onChange={(e) => updateProduct(idx, { title: e.target.value })} />
              <Input placeholder="URL" value={product.url || ''} onChange={(e) => updateProduct(idx, { url: e.target.value })} />
              <Input placeholder="썸네일 URL" value={product.thumbnail || ''} onChange={(e) => updateProduct(idx, { thumbnail: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="가격" type="number" value={product.price || 0} onChange={(e) => updateProduct(idx, { price: Number(e.target.value) })} />
                <Input placeholder="할인율 (0-99)" type="number" min={0} max={99} value={product.discount || 0} onChange={(e) => updateProduct(idx, { discount: Number(e.target.value) })} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function InquiryEditor({ data, onChange }: any) {
  const options = data.options || [];

  function updateOption(idx: number, val: string) {
    onChange({ ...data, options: options.map((o: string, i: number) => i === idx ? val : o) });
  }
  function addOption() {
    onChange({ ...data, options: [...options, '새 카테고리'] });
  }
  function removeOption(idx: number) {
    onChange({ ...data, options: options.filter((_: any, i: number) => i !== idx) });
  }

  return (
    <>
      <Input label="제목" value={data.title || ''} onChange={(e) => onChange({ ...data, title: e.target.value })} placeholder="문의하기" />
      <Input label="버튼 텍스트" value={data.buttonText || ''} onChange={(e) => onChange({ ...data, buttonText: e.target.value })} placeholder="보내기" />
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-bold">선택지 ({options.length})</label>
          <Button size="sm" variant="secondary" onClick={addOption}>
            <Plus className="w-3 h-3" /> 추가
          </Button>
        </div>
        <div className="space-y-2">
          {options.map((opt: string, idx: number) => (
            <div key={idx} className="flex gap-2">
              <Input value={opt} onChange={(e) => updateOption(idx, e.target.value)} className="flex-1" />
              <button onClick={() => removeOption(idx)} className="px-3 text-red-400 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function CalendarEditor({ data, onChange }: any) {
  const events = data.events || [];

  function addEvent() {
    onChange({
      ...data,
      events: [...events, { id: nanoid(8), title: '새 일정', date: new Date().toISOString().split('T')[0], emoji: '📅' }],
    });
  }
  function updateEvent(idx: number, updates: any) {
    onChange({ ...data, events: events.map((e: any, i: number) => i === idx ? { ...e, ...updates } : e) });
  }
  function removeEvent(idx: number) {
    onChange({ ...data, events: events.filter((_: any, i: number) => i !== idx) });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-bold">일정 ({events.length})</label>
        <Button size="sm" variant="secondary" onClick={addEvent}>
          <Plus className="w-3 h-3" /> 추가
        </Button>
      </div>
      <div className="space-y-2">
        {events.map((ev: any, idx: number) => (
          <div key={ev.id} className="border border-border rounded-xl p-3 space-y-2">
            <div className="flex justify-end">
              <button onClick={() => removeEvent(idx)} className="text-red-400 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="📅" value={ev.emoji || ''} onChange={(e) => updateEvent(idx, { emoji: e.target.value })} maxLength={2} />
              <Input type="date" value={ev.date || ''} onChange={(e) => updateEvent(idx, { date: e.target.value })} className="col-span-2" />
            </div>
            <Input placeholder="제목" value={ev.title} onChange={(e) => updateEvent(idx, { title: e.target.value })} />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmailEditor({ data, onChange }: any) {
  return (
    <>
      <Input label="제목" value={data.title || ''} onChange={(e) => onChange({ ...data, title: e.target.value })} placeholder="예: 새 쇼츠 알림 받기" />
      <Input label="설명" value={data.description || ''} onChange={(e) => onChange({ ...data, description: e.target.value })} placeholder="예: 일주일에 한 번 알림드려요" />
      <Input label="버튼 텍스트" value={data.buttonText || ''} onChange={(e) => onChange({ ...data, buttonText: e.target.value })} placeholder="구독하기" />
    </>
  );
}

function TextEditor({ data, onChange }: any) {
  return (
    <>
      <div>
        <label className="block text-sm font-bold mb-2">스타일</label>
        <div className="grid grid-cols-3 gap-2">
          {(['heading', 'body', 'divider'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange({ ...data, variant: v })}
              className={`h-10 rounded-xl border text-sm font-bold ${
                data.variant === v ? 'border-primary bg-primary-soft text-primary' : 'border-border'
              }`}
            >
              {v === 'heading' ? '제목' : v === 'body' ? '본문' : '구분선'}
            </button>
          ))}
        </div>
      </div>
      {data.variant !== 'divider' && (
        <div>
          <label className="block text-sm font-bold mb-2">내용</label>
          <textarea
            value={data.text || ''}
            onChange={(e) => onChange({ ...data, text: e.target.value })}
            rows={data.variant === 'body' ? 5 : 2}
            className="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none"
          />
        </div>
      )}
    </>
  );
}

function SnsEditor({ data, onChange }: any) {
  const links = data.links || [];
  const platforms = [
    { value: 'instagram', label: '📷 Instagram' },
    { value: 'youtube', label: '📺 YouTube' },
    { value: 'threads', label: '🧵 Threads' },
    { value: 'tiktok', label: '🎵 TikTok' },
    { value: 'twitter', label: '🐦 X (Twitter)' },
    { value: 'kakao', label: '💬 KakaoTalk' },
    { value: 'blog', label: '📝 블로그' },
  ];

  function addLink() {
    onChange({ ...data, links: [...links, { platform: 'instagram', url: '' }] });
  }
  function updateLink(idx: number, updates: any) {
    onChange({ ...data, links: links.map((l: any, i: number) => i === idx ? { ...l, ...updates } : l) });
  }
  function removeLink(idx: number) {
    onChange({ ...data, links: links.filter((_: any, i: number) => i !== idx) });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-bold">SNS 링크 ({links.length})</label>
        <Button size="sm" variant="secondary" onClick={addLink}>
          <Plus className="w-3 h-3" /> 추가
        </Button>
      </div>
      <div className="space-y-2">
        {links.map((link: any, idx: number) => (
          <div key={idx} className="border border-border rounded-xl p-3 space-y-2">
            <div className="flex justify-end">
              <button onClick={() => removeLink(idx)} className="text-red-400 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <select
              value={link.platform}
              onChange={(e) => updateLink(idx, { platform: e.target.value })}
              className="w-full h-12 px-4 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            >
              {platforms.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <Input placeholder="https://..." value={link.url || ''} onChange={(e) => updateLink(idx, { url: e.target.value })} />
          </div>
        ))}
      </div>
    </div>
  );
}

function getBlockTypeLabel(type: string): string {
  return ({
    profile: '프로필',
    link: '링크',
    product_grid: '상품 그리드',
    inquiry: '문의 양식',
    calendar: '달력',
    email: '이메일 수집',
    text: '텍스트',
    sns: 'SNS',
  } as Record<string, string>)[type] || type;
}
