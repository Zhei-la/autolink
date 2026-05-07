'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, Copy, Trash2, Edit3, Eye, EyeOff, MoreVertical, Plus } from 'lucide-react';
import { BlockPreview } from '@/components/blocks/BlockPreview';
import { BlockEditModal } from './BlockEditModal';
import { addBlock, deleteBlock, moveBlock, duplicateBlock, toggleBlockActive } from '@/lib/db/blocks';
import type { Block, BlockType } from '@/types';

interface Props {
  pageId: string;
  blocks: Block[];
  primaryColor: string;
}

const BLOCK_TYPES: { type: BlockType; label: string; emoji: string }[] = [
  { type: 'profile', label: '?袁⑥쨮??, emoji: '?維' },
  { type: 'link', label: '筌띻낱寃?, emoji: '?逾? },
  { type: 'product_grid', label: '?怨밸? 域밸챶???, emoji: '??싨닼? },
  { type: 'inquiry', label: '?얜챷???臾믩뻼', emoji: '?裕? },
  { type: 'calendar', label: '????, emoji: '?諭? },
  { type: 'email', label: '??李????륁춿', emoji: '?踰? },
  { type: 'text', label: '??용뮞??, emoji: '?諭? },
  { type: 'sns', label: 'SNS 筌띻낱寃?, emoji: '?? },
];

export function BlockList({ pageId, blocks, primaryColor }: Props) {
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleAdd(type: BlockType) {
    setShowAddSheet(false);
    const newBlock = await addBlock(pageId, type);
    setEditingBlock(newBlock as Block);
  }

  async function handleAction(blockId: string, action: 'up' | 'down' | 'duplicate' | 'delete' | 'toggle') {
    setBusyId(blockId);
    setOpenMenuId(null);
    try {
      if (action === 'up' || action === 'down') {
        await moveBlock(pageId, blockId, action);
      } else if (action === 'duplicate') {
        await duplicateBlock(pageId, blockId);
      } else if (action === 'delete') {
        if (!confirm('?????뤿뻻野껋쥙堉?? ???됰뗀以???????怨쀬뵠?怨뺣즲 ??ｍ뜞 ?????몃빍??')) return;
        await deleteBlock(pageId, blockId);
      } else if (action === 'toggle') {
        await toggleBlockActive(pageId, blockId);
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="space-y-3">
        {blocks.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl">
            <p className="text-text-2 mb-4">?袁⑹춦 ?됰뗀以????곷선??/p>
          </div>
        ) : (
          blocks.map((block, idx) => (
            <div
              key={block.id}
              className={`relative ${!block.is_active ? 'opacity-50' : ''} ${busyId === block.id ? 'pointer-events-none opacity-50' : ''}`}
            >
              <div className="relative group">
                <BlockPreview block={block} primaryColor={primaryColor} />

                <button
                  onClick={() => setOpenMenuId(openMenuId === block.id ? null : block.id)}
                  className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-primary-soft border border-border z-10"
                >
                  <MoreVertical className="w-4 h-4 text-text-2" />
                </button>

                {openMenuId === block.id && (
                  <div className="absolute top-12 right-2 bg-white border border-border rounded-xl shadow-lg z-20 overflow-hidden w-44">
                    <button
                      onClick={() => { setEditingBlock(block); setOpenMenuId(null); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-primary-soft flex items-center gap-2 text-sm font-bold"
                    >
                      <Edit3 className="w-4 h-4" /> ??륁젟??띾┛
                    </button>
                    <button
                      onClick={() => handleAction(block.id, 'up')}
                      disabled={idx === 0}
                      className="w-full text-left px-4 py-2.5 hover:bg-primary-soft flex items-center gap-2 text-sm disabled:opacity-30"
                    >
                      <ChevronUp className="w-4 h-4" /> ?袁⑥쨮 ??猷?                    </button>
                    <button
                      onClick={() => handleAction(block.id, 'down')}
                      disabled={idx === blocks.length - 1}
                      className="w-full text-left px-4 py-2.5 hover:bg-primary-soft flex items-center gap-2 text-sm disabled:opacity-30"
                    >
                      <ChevronDown className="w-4 h-4" /> ?袁⑥삋嚥???猷?                    </button>
                    <button
                      onClick={() => handleAction(block.id, 'duplicate')}
                      className="w-full text-left px-4 py-2.5 hover:bg-primary-soft flex items-center gap-2 text-sm"
                    >
                      <Copy className="w-4 h-4" /> 癰귣벊??                    </button>
                    <button
                      onClick={() => handleAction(block.id, 'toggle')}
                      className="w-full text-left px-4 py-2.5 hover:bg-primary-soft flex items-center gap-2 text-sm"
                    >
                      {block.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {block.is_active ? '??쑵??源딆넅' : '??뽮쉐??}
                    </button>
                    <button
                      onClick={() => handleAction(block.id, 'delete')}
                      className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-500 flex items-center gap-2 text-sm border-t border-border"
                    >
                      <Trash2 className="w-4 h-4" /> ????                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        <button
          onClick={() => setShowAddSheet(true)}
          className="w-full h-14 border-2 border-dashed border-border rounded-2xl text-text-2 font-bold hover:border-primary hover:text-primary hover:bg-primary-soft transition flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> ?됰뗀以??곕떽?
        </button>
      </div>

      {/* ?됰뗀以??곕떽? 筌뤴뫀??- PC?? 筌뤴뫀而??筌뤴뫀紐?揶쎛?????臾롮쓺 */}
      {showAddSheet && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowAddSheet(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-sm rounded-2xl max-h-[85vh] overflow-y-auto"
          >
            <div className="border-b border-border p-4 sticky top-0 bg-white">
              <h2 className="font-bold text-base">?됰뗀以??곕떽?</h2>
            </div>
            <div className="grid grid-cols-2 gap-2 p-4 block-add-grid">
              {BLOCK_TYPES.map((b) => (
                <button
                  key={b.type}
                  onClick={() => handleAdd(b.type)}
                  className="h-20 border border-border rounded-xl hover:border-primary hover:bg-primary-soft flex flex-col items-center justify-center gap-1 transition"
                >
                  <span className="text-xl">{b.emoji}</span>
                  <span className="text-xs font-bold">{b.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {editingBlock && (
        <BlockEditModal
          pageId={pageId}
          block={editingBlock}
          onClose={() => setEditingBlock(null)}
        />
      )}
    </>
  );
}
