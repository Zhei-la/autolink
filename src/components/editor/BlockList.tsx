"use client";

import { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  Copy,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  MoreVertical,
  Plus,
} from "lucide-react";

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import { BlockPreview } from "@/components/blocks/BlockPreview";
import { BlockEditModal } from "./BlockEditModal";

import {
  addBlock,
  deleteBlock,
  moveBlock,
  duplicateBlock,
  toggleBlockActive,
} from "@/lib/db/blocks";

import type { Block, BlockType } from "@/types";

interface Props {
  pageId: string;
  blocks: Block[];
  primaryColor: string;
}

const BLOCK_TYPES: { type: BlockType; label: string; emoji: string }[] = [
  { type: "profile", label: "프로필", emoji: "👤" },
  { type: "link", label: "링크", emoji: "🔗" },
  { type: "product_grid", label: "상품 그리드", emoji: "🛍️" },
  { type: "inquiry", label: "문의 양식", emoji: "💬" },
  { type: "calendar", label: "달력", emoji: "📅" },
  { type: "email", label: "이메일 수집", emoji: "📧" },
  { type: "text", label: "텍스트", emoji: "📝" },
  { type: "sns", label: "SNS 링크", emoji: "✨" },
];

function SortableBlock({
  block,
  idx,
  blocks,
  primaryColor,
  busyId,
  openMenuId,
  setOpenMenuId,
  setEditingBlock,
  handleAction,
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${
        !block.is_active ? "opacity-50" : ""
      } ${busyId === block.id ? "pointer-events-none opacity-50" : ""}`}
    >
      <div className="relative group">
        <BlockPreview block={block} primaryColor={primaryColor} />

        <button
          {...attributes}
          {...listeners}
          onClick={() =>
            setOpenMenuId(openMenuId === block.id ? null : block.id)
          }
          className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-primary-soft border border-border z-10 touch-none"
        >
          <MoreVertical className="w-4 h-4 text-text-2" />
        </button>

        {openMenuId === block.id && (
          <div className="absolute top-12 right-2 bg-white border border-border rounded-xl shadow-lg z-20 overflow-hidden w-44">
            <button
              onClick={() => {
                setEditingBlock(block);
                setOpenMenuId(null);
              }}
              className="w-full text-left px-4 py-2.5 hover:bg-primary-soft flex items-center gap-2 text-sm font-bold"
            >
              <Edit3 className="w-4 h-4" /> 수정하기
            </button>

            <button
              onClick={() => handleAction(block.id, "up")}
              disabled={idx === 0}
              className="w-full text-left px-4 py-2.5 hover:bg-primary-soft flex items-center gap-2 text-sm disabled:opacity-30"
            >
              <ChevronUp className="w-4 h-4" /> 위로 이동
            </button>

            <button
              onClick={() => handleAction(block.id, "down")}
              disabled={idx === blocks.length - 1}
              className="w-full text-left px-4 py-2.5 hover:bg-primary-soft flex items-center gap-2 text-sm disabled:opacity-30"
            >
              <ChevronDown className="w-4 h-4" /> 아래로 이동
            </button>

            <button
              onClick={() => handleAction(block.id, "duplicate")}
              className="w-full text-left px-4 py-2.5 hover:bg-primary-soft flex items-center gap-2 text-sm"
            >
              <Copy className="w-4 h-4" /> 복제
            </button>

            <button
              onClick={() => handleAction(block.id, "toggle")}
              className="w-full text-left px-4 py-2.5 hover:bg-primary-soft flex items-center gap-2 text-sm"
            >
              {block.is_active ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}

              {block.is_active ? "비활성화" : "활성화"}
            </button>

            <button
              onClick={() => handleAction(block.id, "delete")}
              className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-500 flex items-center gap-2 text-sm border-t border-border"
            >
              <Trash2 className="w-4 h-4" /> 삭제
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function BlockList({
  pageId,
  blocks,
  primaryColor,
}: Props) {
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);

  const [showAddSheet, setShowAddSheet] = useState(false);

  const [openMenuId, setOpenMenuId] = useState<string | null>(
    null
  );

  const [busyId, setBusyId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  async function handleAdd(type: BlockType) {
    setShowAddSheet(false);

    const newBlock = await addBlock(pageId, type);

    setEditingBlock(newBlock as Block);
  }

  async function handleAction(
    blockId: string,
    action: "up" | "down" | "duplicate" | "delete" | "toggle"
  ) {
    setBusyId(blockId);

    setOpenMenuId(null);

    try {
      if (action === "up" || action === "down") {
        await moveBlock(pageId, blockId, action);
      } else if (action === "duplicate") {
        await duplicateBlock(pageId, blockId);
      } else if (action === "delete") {
        if (
          !confirm(
            "삭제하시겠어요? 이 블록의 통계 데이터도 함께 삭제됩니다."
          )
        )
          return;

        await deleteBlock(pageId, blockId);
      } else if (action === "toggle") {
        await toggleBlockActive(pageId, blockId);
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleDragEnd(event: any) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = blocks.findIndex(
      (block) => block.id === active.id
    );

    const newIndex = blocks.findIndex(
      (block) => block.id === over.id
    );

    if (oldIndex === -1 || newIndex === -1) return;

    if (newIndex > oldIndex) {
      await moveBlock(pageId, active.id, "down");
    } else {
      await moveBlock(pageId, active.id, "up");
    }
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={blocks.map((block) => block.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {blocks.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl">
                <p className="text-text-2 mb-4">
                  아직 블록이 없어요
                </p>
              </div>
            ) : (
              blocks.map((block, idx) => (
                <SortableBlock
                  key={block.id}
                  block={block}
                  idx={idx}
                  blocks={blocks}
                  primaryColor={primaryColor}
                  busyId={busyId}
                  openMenuId={openMenuId}
                  setOpenMenuId={setOpenMenuId}
                  setEditingBlock={setEditingBlock}
                  handleAction={handleAction}
                />
              ))
            )}

            <button
              onClick={() => setShowAddSheet(true)}
              className="w-full h-14 border-2 border-dashed border-border rounded-2xl text-text-2 font-bold hover:border-primary hover:text-primary hover:bg-primary-soft transition flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> 블록 추가
            </button>
          </div>
        </SortableContext>
      </DndContext>

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
              <h2 className="font-bold text-base">
                블록 추가
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-2 p-4 auto-rows-auto">
              {BLOCK_TYPES.map((b) => (
                <button
                  key={b.type}
                  onClick={() => handleAdd(b.type)}
                  className="h-20 sm:h-24 min-h-0 !aspect-auto border border-border rounded-xl hover:border-primary hover:bg-primary-soft flex flex-col items-center justify-center gap-1 transition"
                >
                  <span className="text-xl">{b.emoji}</span>

                  <span className="text-xs font-bold">
                    {b.label}
                  </span>
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