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
          <h2 className="font-bold text-lg">{getBlockTypeLabel(block.type)} ??륁젟</h2>
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
          <Button variant="secondary" onClick={onClose} className="flex-1">?띯뫁??/Button>
          <Button onClick={handleSave} loading={saving} className="flex-1">????/Button>
        </div>
      </div>
    </div>
  );
}

function ProfileEditor({ data, onChange }: any) {
  return (
    <>
      <Input label="??已? value={data.name || ''} onChange={(e) => onChange({ ...data, name: e.target.value })} maxLength={30} />
      <Input label="??餓????뻣" value={data.bio || ''} onChange={(e) => onChange({ ...data, bio: e.target.value })} maxLength={60} placeholder="?? 筌띲끉??????깊닶 ?????????癒?뵠????? />
      <Input label="?????(??彛???곸뱽 ????뽯뻻)" value={data.initial || ''} onChange={(e) => onChange({ ...data, initial: e.target.value.slice(0, 1) })} maxLength={1} />
      <Input label="?袁⑥쨮????彛?URL (?醫뤾문)" value={data.avatarUrl || ''} onChange={(e) => onChange({ ...data, avatarUrl: e.target.value })} placeholder="https://..." />
    </>
  );
}

function LinkEditor({ data, onChange }: any) {
  return (
    <>
      <Input label="??뺛걠" value={data.title || ''} onChange={(e) => onChange({ ...data, title: e.target.value })} maxLength={50} />
      <Input label="URL" value={data.url || ''} onChange={(e) => onChange({ ...data, url: e.target.value })} placeholder="https://..." />
      <Input label="?紐껉퐬??URL (?醫뤾문)" value={data.thumbnail || ''} onChange={(e) => onChange({ ...data, thumbnail: e.target.value })} placeholder="https://..." />
      <Input label="筌롫뗀??(??곸겫?癒?춸 ??" value={data.memo || ''} onChange={(e) => onChange({ ...data, memo: e.target.value })} placeholder="?醫롮뵥 ?꾨뗀諭??? />
    </>
  );
}

function ProductGridEditor({ data, onChange }: any) {
  const products = data.products || [];

  function addProduct() {
    onChange({
      ...data,
      products: [...products, { id: nanoid(8), title: '???怨밸?', url: '', price: 0, discount: 0 }],
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
      <Input label="??뺛걠 (?醫뤾문)" value={data.title || ''} onChange={(e) => onChange({ ...data, title: e.target.value })} placeholder="?? ??苡?雅??곕뗄荑?? />
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-bold">?怨밸? 筌뤴뫖以?({products.length})</label>
          <Button size="sm" variant="secondary" onClick={addProduct}>
            <Plus className="w-3 h-3" /> ?곕떽?
          </Button>
        </div>
        <div className="space-y-2">
          {products.map((product: any, idx: number) => (
            <div key={product.id} className="border border-border rounded-xl p-3 space-y-2">
              <div className="flex items-start justify-between">
                <span className="text-xs text-text-3 font-bold">?怨밸? {idx + 1}</span>
                <button onClick={() => removeProduct(idx)} className="text-red-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <Input placeholder="?怨밸?筌? value={product.title} onChange={(e) => updateProduct(idx, { title: e.target.value })} />
              <Input placeholder="URL" value={product.url || ''} onChange={(e) => updateProduct(idx, { url: e.target.value })} />
              <Input placeholder="?紐껉퐬??URL" value={product.thumbnail || ''} onChange={(e) => updateProduct(idx, { thumbnail: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="揶쎛野? type="number" value={product.price || 0} onChange={(e) => updateProduct(idx, { price: Number(e.target.value) })} />
                <Input placeholder="?醫롮뵥??(0-99)" type="number" min={0} max={99} value={product.discount || 0} onChange={(e) => updateProduct(idx, { discount: Number(e.target.value) })} />
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
    onChange({ ...data, options: [...options, '??燁삳똾?믤⑥쥓??] });
  }
  function removeOption(idx: number) {
    onChange({ ...data, options: options.filter((_: any, i: number) => i !== idx) });
  }

  return (
    <>
      <Input label="??뺛걠" value={data.title || ''} onChange={(e) => onChange({ ...data, title: e.target.value })} placeholder="?얜챷???띾┛" />
      <Input label="甕곌쑵????용뮞?? value={data.buttonText || ''} onChange={(e) => onChange({ ...data, buttonText: e.target.value })} placeholder="癰귣?沅→묾? />
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-bold">?醫뤾문筌왖 ({options.length})</label>
          <Button size="sm" variant="secondary" onClick={addOption}>
            <Plus className="w-3 h-3" /> ?곕떽?
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
      events: [...events, { id: nanoid(8), title: '????깆젟', date: new Date().toISOString().split('T')[0], emoji: '?諭? }],
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
        <label className="text-sm font-bold">??깆젟 ({events.length})</label>
        <Button size="sm" variant="secondary" onClick={addEvent}>
          <Plus className="w-3 h-3" /> ?곕떽?
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
              <Input placeholder="?諭? value={ev.emoji || ''} onChange={(e) => updateEvent(idx, { emoji: e.target.value })} maxLength={2} />
              <Input type="date" value={ev.date || ''} onChange={(e) => updateEvent(idx, { date: e.target.value })} className="col-span-2" />
            </div>
            <Input placeholder="??뺛걠" value={ev.title} onChange={(e) => updateEvent(idx, { title: e.target.value })} />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmailEditor({ data, onChange }: any) {
  return (
    <>
      <Input label="??뺛걠" value={data.title || ''} onChange={(e) => onChange({ ...data, title: e.target.value })} placeholder="?? ????깊닶 ???뵝 獄쏆룄由? />
      <Input label="??살구" value={data.description || ''} onChange={(e) => onChange({ ...data, description: e.target.value })} placeholder="?? ??깍폒??깅퓠 ??甕????뵝??뺤젻?? />
      <Input label="甕곌쑵????용뮞?? value={data.buttonText || ''} onChange={(e) => onChange({ ...data, buttonText: e.target.value })} placeholder="?닌됰즴??띾┛" />
    </>
  );
}

function TextEditor({ data, onChange }: any) {
  return (
    <>
      <div>
        <label className="block text-sm font-bold mb-2">?????/label>
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
              {v === 'heading' ? '??뺛걠' : v === 'body' ? '癰귣챶揆' : '?닌됲뀋??}
            </button>
          ))}
        </div>
      </div>
      {data.variant !== 'divider' && (
        <div>
          <label className="block text-sm font-bold mb-2">??곸뒠</label>
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
        <label className="text-sm font-bold">SNS 筌띻낱寃?({links.length})</label>
        <Button size="sm" variant="secondary" onClick={addLink}>
          <Plus className="w-3 h-3" /> ?곕떽?
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
    profile: '?袁⑥쨮??,
    link: '筌띻낱寃?,
    product_grid: '?怨밸? 域밸챶???,
    inquiry: '?얜챷???臾믩뻼',
    calendar: '????,
    email: '??李????륁춿',
    text: '??용뮞??,
    sns: 'SNS',
  } as Record<string, string>)[type] || type;
}
