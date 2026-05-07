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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border flex items-center justify-between p-4">
          <h2 className="font-bold text-lg">{getBlockTypeLabel(block.type)} ?섏젙</h2>
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
          <Button variant="secondary" onClick={onClose} className="flex-1">痍⑥냼</Button>
          <Button onClick={handleSave} loading={saving} className="flex-1">???/Button>
        </div>
      </div>
    </div>
  );
}

function ProfileEditor({ data, onChange }: any) {
  return (
    <>
      <Input label="?대쫫" value={data.name || ''} onChange={(e) => onChange({ ...data, name: e.target.value })} maxLength={30} />
      <Input label="??以??뚭컻" value={data.bio || ''} onChange={(e) => onChange({ ...data, bio: e.target.value })} maxLength={60} placeholder="?? 留ㅼ씪 ???쇱툩 ?щ━???щ━?먯씠???렗" />
      <Input label="?대땲??(?ъ쭊 ?놁쓣 ???쒖떆)" value={data.initial || ''} onChange={(e) => onChange({ ...data, initial: e.target.value.slice(0, 1) })} maxLength={1} />
      <Input label="?꾨줈???ъ쭊 URL (?좏깮)" value={data.avatarUrl || ''} onChange={(e) => onChange({ ...data, avatarUrl: e.target.value })} placeholder="https://..." />
    </>
  );
}

function LinkEditor({ data, onChange }: any) {
  return (
    <>
      <Input label="?쒕ぉ" value={data.title || ''} onChange={(e) => onChange({ ...data, title: e.target.value })} maxLength={50} />
      <Input label="URL" value={data.url || ''} onChange={(e) => onChange({ ...data, url: e.target.value })} placeholder="https://..." />
      <Input label="?몃꽕??URL (?좏깮)" value={data.thumbnail || ''} onChange={(e) => onChange({ ...data, thumbnail: e.target.value })} placeholder="https://..." />
      <Input label="硫붾え (?댁쁺?먮쭔 遊?" value={data.memo || ''} onChange={(e) => onChange({ ...data, memo: e.target.value })} placeholder="?좎씤 肄붾뱶 ?? />
    </>
  );
}

function ProductGridEditor({ data, onChange }: any) {
  const products = data.products || [];

  function addProduct() {
    onChange({
      ...data,
      products: [...products, { id: nanoid(8), title: '???곹뭹', url: '', price: 0, discount: 0 }],
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
      <Input label="?쒕ぉ (?좏깮)" value={data.title || ''} onChange={(e) => onChange({ ...data, title: e.target.value })} placeholder="?? ?대쾲 二?異붿쿇?? />
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-bold">?곹뭹 紐⑸줉 ({products.length})</label>
          <Button size="sm" variant="secondary" onClick={addProduct}>
            <Plus className="w-3 h-3" /> 異붽?
          </Button>
        </div>
        <div className="space-y-2">
          {products.map((product: any, idx: number) => (
            <div key={product.id} className="border border-border rounded-xl p-3 space-y-2">
              <div className="flex items-start justify-between">
                <span className="text-xs text-text-3 font-bold">?곹뭹 {idx + 1}</span>
                <button onClick={() => removeProduct(idx)} className="text-red-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <Input placeholder="?곹뭹紐? value={product.title} onChange={(e) => updateProduct(idx, { title: e.target.value })} />
              <Input placeholder="URL" value={product.url || ''} onChange={(e) => updateProduct(idx, { url: e.target.value })} />
              <Input placeholder="?몃꽕??URL" value={product.thumbnail || ''} onChange={(e) => updateProduct(idx, { thumbnail: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="媛寃? type="number" value={product.price || 0} onChange={(e) => updateProduct(idx, { price: Number(e.target.value) })} />
                <Input placeholder="?좎씤??(0-99)" type="number" min={0} max={99} value={product.discount || 0} onChange={(e) => updateProduct(idx, { discount: Number(e.target.value) })} />
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
    onChange({ ...data, options: [...options, '??移댄뀒怨좊━'] });
  }
  function removeOption(idx: number) {
    onChange({ ...data, options: options.filter((_: any, i: number) => i !== idx) });
  }

  return (
    <>
      <Input label="?쒕ぉ" value={data.title || ''} onChange={(e) => onChange({ ...data, title: e.target.value })} placeholder="臾몄쓽?섍린" />
      <Input label="踰꾪듉 ?띿뒪?? value={data.buttonText || ''} onChange={(e) => onChange({ ...data, buttonText: e.target.value })} placeholder="蹂대궡湲? />
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-bold">?좏깮吏 ({options.length})</label>
          <Button size="sm" variant="secondary" onClick={addOption}>
            <Plus className="w-3 h-3" /> 異붽?
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
      events: [...events, { id: nanoid(8), title: '???쇱젙', date: new Date().toISOString().split('T')[0], emoji: '?뱟' }],
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
        <label className="text-sm font-bold">?쇱젙 ({events.length})</label>
        <Button size="sm" variant="secondary" onClick={addEvent}>
          <Plus className="w-3 h-3" /> 異붽?
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
              <Input placeholder="?뱟" value={ev.emoji || ''} onChange={(e) => updateEvent(idx, { emoji: e.target.value })} maxLength={2} />
              <Input type="date" value={ev.date || ''} onChange={(e) => updateEvent(idx, { date: e.target.value })} className="col-span-2" />
            </div>
            <Input placeholder="?쒕ぉ" value={ev.title} onChange={(e) => updateEvent(idx, { title: e.target.value })} />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmailEditor({ data, onChange }: any) {
  return (
    <>
      <Input label="?쒕ぉ" value={data.title || ''} onChange={(e) => onChange({ ...data, title: e.target.value })} placeholder="?? ???쇱툩 ?뚮┝ 諛쏄린" />
      <Input label="?ㅻ챸" value={data.description || ''} onChange={(e) => onChange({ ...data, description: e.target.value })} placeholder="?? ?쇱＜?쇱뿉 ??踰??뚮┝?쒕젮?? />
      <Input label="踰꾪듉 ?띿뒪?? value={data.buttonText || ''} onChange={(e) => onChange({ ...data, buttonText: e.target.value })} placeholder="援щ룆?섍린" />
    </>
  );
}

function TextEditor({ data, onChange }: any) {
  return (
    <>
      <div>
        <label className="block text-sm font-bold mb-2">?ㅽ???/label>
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
              {v === 'heading' ? '?쒕ぉ' : v === 'body' ? '蹂몃Ц' : '援щ텇??}
            </button>
          ))}
        </div>
      </div>
      {data.variant !== 'divider' && (
        <div>
          <label className="block text-sm font-bold mb-2">?댁슜</label>
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
  const platforms = ['instagram', 'youtube', 'threads', 'tiktok', 'twitter', 'kakao', 'blog'];

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
        <label className="text-sm font-bold">SNS 留곹겕 ({links.length})</label>
        <Button size="sm" variant="secondary" onClick={addLink}>
          <Plus className="w-3 h-3" /> 異붽?
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
                <option key={p} value={p}>{p}</option>
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
    profile: '?꾨줈??,
    link: '留곹겕',
    product_grid: '?곹뭹 洹몃━??,
    inquiry: '臾몄쓽 ?묒떇',
    calendar: '?щ젰',
    email: '?대찓???섏쭛',
    text: '?띿뒪??,
    sns: 'SNS',
  } as Record<string, string>)[type] || type;
}
