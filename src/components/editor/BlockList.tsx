"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  GripVertical,
} from "lucide-react";

import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import { BlockPreview } from "@/components/blocks/BlockPreview";
import { BlockEditModal } from "./BlockEditModal";
import { useModalHistory } from "@/hooks/useModalHistory";

import {
  addBlock,
  deleteBlock,
  moveBlock,
  duplicateBlock,
  toggleBlockActive,
  reorderBlocks,
} from "@/lib/db/blocks";

import type { Block, BlockType } from "@/types";

interface Props {
  pageId: string;
  blocks: Block[];
  primaryColor: string;
  readOnly?: boolean;
  readOnlyMessage?: string;
}

const BLOCK_TYPES: { type: BlockType; label: string; emoji: string; desc: string }[] = [
  { type: "profile", label: "프로필", emoji: "👤", desc: "이름·소개·사진" },
  { type: "link", label: "링크", emoji: "🔗", desc: "버튼 하나" },
  { type: "product_grid", label: "상품 그리드", emoji: "🛍️", desc: "상품 여러 개" },
  { type: "inquiry", label: "문의 양식", emoji: "💬", desc: "카테고리 선택" },
  { type: "calendar", label: "달력", emoji: "📅", desc: "일정·D-day" },
  { type: "email", label: "이메일 수집", emoji: "📧", desc: "구독 폼" },
  { type: "text", label: "텍스트", emoji: "📝", desc: "제목·본문·구분선" },
  { type: "sns", label: "SNS 링크", emoji: "✨", desc: "아이콘 모음" },
];

function SortableBlock({
  block,
  idx,
  total,
  primaryColor,
  busyId,
  openMenuId,
  setOpenMenuId,
  setEditingBlock,
  handleAction,
  readOnly,
}: any) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id, disabled: readOnly });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 40 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${!block.is_active ? "opacity-50" : ""} ${
        busyId === block.id ? "pointer-events-none opacity-50" : ""
      } ${isDragging ? "shadow-2xl rounded-2xl" : ""}`}
    >
      <div className="relative group">
        <BlockPreview block={block} primaryColor={primaryColor} />

        {!readOnly && (
          <>
            {/* 드래그 핸들 */}
            <button
              ref={setActivatorNodeRef}
              {...attributes}
              {...listeners}
              aria-label="드래그해서 순서 변경"
              className="absolute top-2 left-2 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center border border-border z-10 touch-none cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="w-4 h-4 text-text-3" />
            </button>

            {/* 메뉴 버튼 */}
            <button
              onClick={() => setOpenMenuId(openMenuId === block.id ? null : block.id)}
              aria-label="블록 메뉴"
              className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-primary-soft border border-border z-10"
            >
              <MoreVertical className="w-4 h-4 text-text-2" />
            </button>
          </>
        )}

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
              disabled={idx === total - 1}
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
              {block.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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

export function BlockList({ pageId, blocks: serverBlocks, primaryColor, readOnly = false, readOnlyMessage }: Props) {
  const router = useRouter();

  // 낙관적 순서: 드래그 직후 화면은 바로 바뀌고, 서버 저장은 뒤에서
  const [blocks, setBlocks] = useState<Block[]>(serverBlocks);
  useEffect(() => setBlocks(serverBlocks), [serverBlocks]);

  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useModalHistory(showAddSheet, () => setShowAddSheet(false));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // 메뉴 바깥 클릭 시 닫기
  useEffect(() => {
    if (!openMenuId) return;
    const close = () => setOpenMenuId(null);
    const t = setTimeout(() => document.addEventListener("click", close), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("click", close);
    };
  }, [openMenuId]);

  async function guard<T>(fn: () => Promise<T>): Promise<T | undefined> {
    setError(null);
    try {
      return await fn();
    } catch (e: any) {
      setError(e?.message || "실패했어요. 다시 시도해주세요.");
      return undefined;
    }
  }

  async function handleAdd(type: BlockType) {
    setShowAddSheet(false);
    const newBlock = await guard(() => addBlock(pageId, type));
    if (newBlock) setEditingBlock(newBlock as Block);
  }

  async function handleAction(blockId: string, action: "up" | "down" | "duplicate" | "delete" | "toggle") {
    setOpenMenuId(null);
    if (action === "delete" && !confirm("삭제하시겠어요? 이 블록의 통계 데이터도 함께 삭제됩니다.")) return;

    setBusyId(blockId);
    try {
      await guard(async () => {
        if (action === "up" || action === "down") await moveBlock(pageId, blockId, action);
        else if (action === "duplicate") await duplicateBlock(pageId, blockId);
        else if (action === "delete") await deleteBlock(pageId, blockId);
        else if (action === "toggle") await toggleBlockActive(pageId, blockId);
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const next = arrayMove(blocks, oldIndex, newIndex);
    setBlocks(next); // 즉시 반영

    const ok = await guard(() => reorderBlocks(pageId, next.map((b) => b.id)).then(() => true));
    if (!ok) {
      setBlocks(serverBlocks); // 실패 시 되돌림
      router.refresh();
    }
  }

  return (
    <>
      {readOnly && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {readOnlyMessage || "지금은 편집할 수 없어요."}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center justify-between gap-2">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs underline">닫기</button>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {blocks.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl">
                <p className="text-text-2 mb-4">아직 블록이 없어요</p>
              </div>
            ) : (
              blocks.map((block, idx) => (
                <SortableBlock
                  key={block.id}
                  block={block}
                  idx={idx}
                  total={blocks.length}
                  primaryColor={primaryColor}
                  busyId={busyId}
                  openMenuId={openMenuId}
                  setOpenMenuId={setOpenMenuId}
                  setEditingBlock={setEditingBlock}
                  handleAction={handleAction}
                  readOnly={readOnly}
                />
              ))
            )}

            {!readOnly && (
              <button
                onClick={() => setShowAddSheet(true)}
                className="w-full h-14 border-2 border-dashed border-border rounded-2xl text-text-2 font-bold hover:border-primary hover:text-primary hover:bg-primary-soft transition flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" /> 블록 추가
              </button>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {showAddSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
          onClick={() => setShowAddSheet(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl max-h-[85vh] overflow-y-auto"
          >
            <div className="border-b border-border p-4 sticky top-0 bg-white flex items-center justify-between">
              <h2 className="font-bold text-base">블록 추가</h2>
              <button onClick={() => setShowAddSheet(false)} className="text-sm text-text-3">닫기</button>
            </div>

            <div className="grid grid-cols-2 gap-2 p-4">
              {BLOCK_TYPES.map((b) => (
                <button
                  key={b.type}
                  onClick={() => handleAdd(b.type)}
                  className="border border-border rounded-xl hover:border-primary hover:bg-primary-soft flex flex-col items-center justify-center gap-1 transition py-4 px-2"
                >
                  <span className="text-2xl leading-none">{b.emoji}</span>
                  <span className="text-sm font-bold">{b.label}</span>
                  <span className="text-[11px] text-text-3">{b.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {editingBlock && (
        <BlockEditModal pageId={pageId} block={editingBlock} onClose={() => setEditingBlock(null)} />
      )}
    </>
  );
}
