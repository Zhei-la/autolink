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
  { type: 'profile', label: '프로필', emoji: '👤' },
  { type: 'link', label: '링크', emoji: '🔗' },
  { type: 'product_grid', label: '상품 그리드', emoji: '🛍️' },
  { type: 'inquiry', label: '문의 양식', emoji: '💬' },
  { type: 'calendar', label: '달력', emoji: '📅' },
  { type: 'email', label: '이메일 수집', emoji: '📧' },
  { type: 'text', label: '텍스트', emoji: '📝' },
  { type: 'sns', label: 'SNS 링크', emoji: '✨' },
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
        if (!confirm('삭제하시겠어요? 이 블록의 통계 데이터도 함께 삭제됩니다.')) return;
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
            <p className="text-text-2 mb-4">아직 블록이 없어요</p>
          </div>
        ) : (
          blocks.map((block, idx) => (
            <div
              key={block.id}
              className={`relative ${!block.is_active ? 'opacity-50' : ''} ${busyId === block.id ? 'pointer-events-none opacity-50' : ''}`}
            >
              {/* 블록 미리보기 */}
              <div className="relative group">
                <BlockPreview block={block} primaryColor={primaryColor} />

                {/* 우상단 메뉴 버튼 */}
                <button
                  onClick={() => setOpenMenuId(openMenuId === block.id ? null : block.id)}
                  className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-primary-soft border border-border z-10"
                >
                  <MoreVertical className="w-4 h-4 text-text-2" />
                </button>

                {/* 메뉴 드롭다운 */}
                {openMenuId === block.id && (
                  <div className="absolute top-12 right-2 bg-white border border-border rounded-xl shadow-lg z-20 overflow-hidden w-44">
                    <button
                      onClick={() => { setEditingBlock(block); setOpenMenuId(null); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-primary-soft flex items-center gap-2 text-sm font-bold"
                    >
                      <Edit3 className="w-4 h-4" /> 수정하기
                    </button>
                    <button
                      onClick={() => handleAction(block.id, 'up')}
                      disabled={idx === 0}
                      className="w-full text-left px-4 py-2.5 hover:bg-primary-soft flex items-center gap-2 text-sm disabled:opacity-30"
                    >
                      <ChevronUp className="w-4 h-4" /> 위로 이동
                    </button>
                    <button
                      onClick={() => handleAction(block.id, 'down')}
                      disabled={idx === blocks.length - 1}
                      className="w-full text-left px-4 py-2.5 hover:bg-primary-soft flex items-center gap-2 text-sm disabled:opacity-30"
                    >
                      <ChevronDown className="w-4 h-4" /> 아래로 이동
                    </button>
                    <button
                      onClick={() => handleAction(block.id, 'duplicate')}
                      className="w-full text-left px-4 py-2.5 hover:bg-primary-soft flex items-center gap-2 text-sm"
                    >
                      <Copy className="w-4 h-4" /> 복제
                    </button>
                    <button
                      onClick={() => handleAction(block.id, 'toggle')}
                      className="w-full text-left px-4 py-2.5 hover:bg-primary-soft flex items-center gap-2 text-sm"
                    >
                      {block.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {block.is_active ? '비활성화' : '활성화'}
                    </button>
                    <button
                      onClick={() => handleAction(block.id, 'delete')}
                      className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-500 flex items-center gap-2 text-sm border-t border-border"
                    >
                      <Trash2 className="w-4 h-4" /> 삭제
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* 블록 추가 버튼 */}
        <button
          onClick={() => setShowAddSheet(true)}
          className="w-full h-14 border-2 border-dashed border-border rounded-2xl text-text-2 font-bold hover:border-primary hover:text-primary hover:bg-primary-soft transition flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> 블록 추가
        </button>
      </div>

      {/* 블록 추가 시트 */}
      {showAddSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
          onClick={() => setShowAddSheet(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl"
          >
            <div className="border-b border-border p-4">
              <h2 className="font-bold text-lg">블록 추가</h2>
            </div>
            <div className="grid grid-cols-2 gap-2 p-4">
              {BLOCK_TYPES.map((b) => (
                <button
                  key={b.type}
                  onClick={() => handleAdd(b.type)}
                  className="aspect-square border border-border rounded-2xl hover:border-primary hover:bg-primary-soft flex flex-col items-center justify-center gap-2 transition"
                >
                  <span className="text-3xl">{b.emoji}</span>
                  <span className="text-sm font-bold">{b.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 블록 수정 모달 */}
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
