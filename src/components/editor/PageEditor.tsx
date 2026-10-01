'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Eye,
  GripVertical,
  MoreHorizontal,
  Plus,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { Block, BlockType, PageTheme } from '@/types';
import { addBlock, deleteBlock, duplicateBlock, reorderBlocks, setBlockActive, updateBlockData } from '@/lib/db/blocks';
import { useModalHistory } from '@/hooks/useModalHistory';
import { PageView } from '@/components/page/PageView';
import { BLOCK_TYPES, blockMeta, blockSummary } from './blockTypes';
import { BlockFields } from './BlockFields';
import { ConfirmDialog, FieldLabel, Toggle } from './ui';

interface Props {
  page: { id: string; slug: string; title: string; theme: PageTheme };
  blocks: Block[];
  readOnly?: boolean;
  readOnlyMessage?: string;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function PageEditor({ page, blocks: serverBlocks, readOnly = false, readOnlyMessage }: Props) {
  const router = useRouter();
  const [blocks, setBlocks] = useState<Block[]>(serverBlocks);
  const blocksRef = useRef<Block[]>(serverBlocks);
  blocksRef.current = blocks;
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Block | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  // 자동 저장: 아직 서버에 안 간 data 를 블록별로 들고 있다가 0.7초 뒤 저장
  const pending = useRef(new Map<string, any>());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  // 서버에서 새 목록이 오면 합치되, 저장 대기 중인 칸은 내가 입력한 값을 유지
  const mergeServer = useCallback(
    (list: Block[]) => list.map((sb) => (pending.current.has(sb.id) ? { ...sb, data: pending.current.get(sb.id) } : sb)),
    []
  );
  useEffect(() => {
    setBlocks(mergeServer(serverBlocks));
  }, [serverBlocks, mergeServer]);

  // 저장 안 된 채로 나가려 하면 경고
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pending.current.size > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  useModalHistory(showAdd, () => setShowAdd(false));
  useModalHistory(showPreview, () => setShowPreview(false));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const profile = blocks.find((b) => b.type === 'profile');
  const others = useMemo(() => blocks.filter((b) => b.id !== profile?.id), [blocks, profile?.id]);

  /** 저장 대기 중인 내용을 바로 저장. 성공(또는 저장할 게 없음)이면 true */
  const flush = useCallback(
    async (blockId: string): Promise<boolean> => {
      const t = timers.current.get(blockId);
      if (t) {
        clearTimeout(t);
        timers.current.delete(blockId);
      }
      const data = pending.current.get(blockId);
      if (data === undefined) return true;
      setSaveState('saving');
      try {
        await updateBlockData(page.id, blockId, data);
        if (pending.current.get(blockId) === data) pending.current.delete(blockId);
        setSaveState(pending.current.size ? 'saving' : 'saved');
        return true;
      } catch (e: any) {
        setSaveState('error');
        setError(e?.message || '저장하지 못했어요. 잠시 후 다시 시도해주세요.');
        return false;
      }
    },
    [page.id]
  );

  /**
   * 블록 data 변경. 새 data 객체 또는 (최신 data) => 새 data 함수를 받는다.
   * 사진 업로드처럼 시간이 걸리는 변경은 함수형으로 넘겨야, 업로드 중에 입력한 글자가 덮어써지지 않음.
   */
  const changeData = useCallback(
    (blockId: string, next: any) => {
      if (readOnly) return;
      const latest = pending.current.has(blockId)
        ? pending.current.get(blockId)
        : blocksRef.current.find((b) => b.id === blockId)?.data;
      const data = typeof next === 'function' ? next(latest || {}) : next;
      setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, data } : b)));
      pending.current.set(blockId, data);
      setSaveState('saving');
      const t = timers.current.get(blockId);
      if (t) clearTimeout(t);
      timers.current.set(
        blockId,
        setTimeout(() => {
          timers.current.delete(blockId);
          flush(blockId);
        }, 700)
      );
    },
    [flush, readOnly]
  );

  async function guard<T>(fn: () => Promise<T>): Promise<T | undefined> {
    setError(null);
    try {
      return await fn();
    } catch (e: any) {
      setError(e?.message || '실패했어요. 다시 시도해주세요.');
      return undefined;
    }
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAdd(type: BlockType) {
    setShowAdd(false);
    const created = await guard(() => addBlock(page.id, type));
    if (created) {
      const b = created as Block;
      setBlocks((prev) => (type === 'profile' ? [b, ...prev] : [...prev, b]));
      setExpanded((prev) => new Set(prev).add(b.id));
      setTimeout(() => document.getElementById(`block-${b.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
    }
  }

  async function handleActive(block: Block, active: boolean) {
    setBlocks((prev) => prev.map((b) => (b.id === block.id ? { ...b, is_active: active } : b)));
    const ok = await guard(() => setBlockActive(page.id, block.id, active).then(() => true));
    if (!ok) setBlocks((prev) => prev.map((b) => (b.id === block.id ? { ...b, is_active: !active } : b)));
  }

  async function handleDuplicate(block: Block) {
    // 저장 대기 중인 내용부터 저장한 뒤 복사
    if (!(await flush(block.id))) return;
    const copy = await guard(() => duplicateBlock(page.id, block.id));
    if (copy) {
      setBlocks((prev) => {
        const i = prev.findIndex((b) => b.id === block.id);
        const next = prev.slice();
        next.splice(i + 1, 0, copy as Block);
        return next;
      });
    }
  }

  async function handleDelete(block: Block) {
    setConfirmDelete(null);
    const t = timers.current.get(block.id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(block.id);
    }
    const unsaved = pending.current.get(block.id);
    pending.current.delete(block.id);
    const before = blocks;
    setBlocks((prev) => prev.filter((b) => b.id !== block.id));
    const ok = await guard(() => deleteBlock(page.id, block.id).then(() => true));
    if (!ok) {
      setBlocks(before);
      // 삭제 실패 → 저장 못 한 입력을 되살려 다시 저장
      if (unsaved !== undefined) changeData(block.id, unsaved);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = others.findIndex((b) => b.id === active.id);
    const newIndex = others.findIndex((b) => b.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const nextOthers = arrayMove(others, oldIndex, newIndex);
    const next = profile ? [profile, ...nextOthers] : nextOthers;
    setBlocks(next);
    const ok = await guard(() => reorderBlocks(page.id, next.map((b) => b.id)).then(() => true));
    if (!ok) {
      setBlocks(mergeServer(serverBlocks));
      router.refresh();
    }
  }

  const cardProps = {
    readOnly,
    onToggleExpand: toggleExpand,
    onChangeData: changeData,
    onActive: handleActive,
    onDuplicate: handleDuplicate,
    onAskDelete: (b: Block) => setConfirmDelete(b),
  };

  return (
    <>
      {readOnly && (
        <div className="mb-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600">
          {readOnlyMessage || '지금은 편집할 수 없어요.'}
        </div>
      )}

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-start justify-between gap-2">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs underline flex-shrink-0">
            닫기
          </button>
        </div>
      )}

      <div className="flex items-center justify-end h-5 mb-1.5 px-1 text-[11px] text-[#a1a1a6]">
        {saveState === 'saving' ? '저장 중…' : saveState === 'saved' ? '자동 저장됨' : saveState === 'error' ? '저장 실패' : ''}
      </div>

      <div className="space-y-2.5">
        {profile ? (
          <BlockCard block={profile} expanded={expanded.has(profile.id)} pinned {...cardProps} />
        ) : (
          !readOnly && (
            <button
              onClick={() => handleAdd('profile')}
              className="w-full h-14 rounded-2xl border-2 border-dashed border-[#d4d4d8] text-[#71717a] text-sm font-semibold flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> 프로필 추가
            </button>
          )
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={others.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            {others.map((b) => (
              <SortableCard key={b.id} block={b} expanded={expanded.has(b.id)} {...cardProps} />
            ))}
          </SortableContext>
        </DndContext>

        {others.length === 0 && (
          <div className="text-center py-10 text-sm text-[#a1a1a6]">
            아래 <strong className="text-[#111]">블록 추가</strong> 버튼으로 링크를 넣어보세요
          </div>
        )}
      </div>

      {/* 하단 떠 있는 버튼: 미리보기 / 블록 추가 (하단 메뉴 바로 위) */}
      <div className="fixed left-0 right-0 bottom-[calc(84px+env(safe-area-inset-bottom))] z-30 pointer-events-none">
        <div className="mx-auto max-w-[560px] px-4 flex items-center justify-between">
          <button
            onClick={() => setShowPreview(true)}
            className="pointer-events-auto h-11 pl-3.5 pr-4 rounded-full bg-[#3b6cf6] text-white text-sm font-semibold shadow-lg flex items-center gap-1.5"
          >
            <Eye className="w-4 h-4" /> 미리보기
          </button>
          {!readOnly && (
            <button
              onClick={() => setShowAdd(true)}
              className="pointer-events-auto h-11 pl-3.5 pr-4 rounded-full bg-[#111] text-white text-sm font-semibold shadow-lg flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> 블록 추가
            </button>
          )}
        </div>
      </div>

      {showAdd && <AddBlockSheet hasProfile={!!profile} onPick={handleAdd} onClose={() => setShowAdd(false)} />}

      {showPreview && <PreviewSheet page={page} blocks={blocks} onClose={() => setShowPreview(false)} />}

      <ConfirmDialog
        open={!!confirmDelete}
        message={'정말 삭제하시겠습니까?\n삭제하면 복구할 수 없습니다.'}
        confirmText="확인"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// 블록 카드 (접힘: 한 줄 / 펼침: 입력 칸)
// ---------------------------------------------------------------------------

interface CardProps {
  block: Block;
  expanded: boolean;
  readOnly: boolean;
  pinned?: boolean;
  onToggleExpand: (id: string) => void;
  onChangeData: (id: string, data: any) => void;
  onActive: (b: Block, active: boolean) => void;
  onDuplicate: (b: Block) => void;
  onAskDelete: (b: Block) => void;
  dragHandle?: React.ReactNode;
}

function SortableCard(props: Omit<CardProps, 'dragHandle'>) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: props.block.id,
    disabled: props.readOnly,
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 40 : undefined, position: 'relative' }}
      className={isDragging ? 'shadow-2xl rounded-2xl' : ''}
    >
      <BlockCard
        {...props}
        dragHandle={
          !props.readOnly ? (
            <button
              ref={setActivatorNodeRef}
              {...attributes}
              {...listeners}
              aria-label="끌어서 순서 바꾸기"
              className="w-7 h-9 -ml-1 flex items-center justify-center text-[#c4c4c8] touch-none cursor-grab active:cursor-grabbing flex-shrink-0"
            >
              <GripVertical className="w-4 h-4" />
            </button>
          ) : null
        }
      />
    </div>
  );
}

function BlockCard({
  block,
  expanded,
  readOnly,
  pinned,
  onToggleExpand,
  onChangeData,
  onActive,
  onDuplicate,
  onAskDelete,
  dragHandle,
}: CardProps) {
  const meta = blockMeta(block.type);
  const Icon = meta.Icon;
  const data = block.data || {};
  const [menu, setMenu] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const scheduled = !!(data.visibleFrom || data.visibleUntil);
  const off = block.is_active === false;

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(false);
    const t = setTimeout(() => document.addEventListener('click', close), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('click', close);
    };
  }, [menu]);

  return (
    <div id={`block-${block.id}`} className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      {/* 머리줄 */}
      <div className="flex items-center gap-2 px-3 h-14">
        {pinned ? <span className="w-6" /> : dragHandle}

        {expanded && !readOnly && !pinned ? (
          <Toggle size="sm" checked={!off} onChange={(v) => onActive(block, v)} label="공개" />
        ) : (
          <span
            className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${off ? 'opacity-40' : ''}`}
            style={{ backgroundColor: meta.color }}
          >
            <Icon className="w-4 h-4 text-white" />
          </span>
        )}

        <button
          type="button"
          onClick={() => onToggleExpand(block.id)}
          className="flex-1 min-w-0 flex items-center gap-2 text-left h-full"
        >
          <span className={`text-[15px] font-bold flex-shrink-0 ${off ? 'text-[#b4b4b8]' : 'text-[#111]'}`}>{meta.label}</span>
          {!expanded && (
            <span className="text-[14px] text-[#a1a1a6] truncate">{blockSummary(block)}</span>
          )}
          {!expanded && data.highlight && <Star className="w-3.5 h-3.5 fill-[#111] text-[#111] flex-shrink-0" />}
          {!expanded && scheduled && <Clock className="w-3.5 h-3.5 text-[#3b6cf6] flex-shrink-0" />}
          {!expanded && off && <span className="text-[11px] font-semibold text-[#b4b4b8] flex-shrink-0">OFF</span>}
        </button>

        {expanded && !readOnly && !pinned && (
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {meta.canHighlight && (
              <button
                type="button"
                onClick={() => onChangeData(block.id, (d: any) => ({ ...d, highlight: !d.highlight }))}
                aria-label="강조"
                className="w-8 h-8 flex items-center justify-center"
              >
                <Star className={`w-[18px] h-[18px] ${data.highlight ? 'fill-[#111] text-[#111]' : 'text-[#c4c4c8]'}`} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowSchedule((v) => !v)}
              aria-label="예약 공개"
              className="w-8 h-8 flex items-center justify-center"
            >
              <Clock className={`w-[18px] h-[18px] ${scheduled ? 'text-[#3b6cf6]' : showSchedule ? 'text-[#111]' : 'text-[#c4c4c8]'}`} />
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenu((v) => !v)}
                aria-label="블록 메뉴"
                className="w-8 h-8 flex items-center justify-center text-[#111]"
              >
                <MoreHorizontal className="w-[18px] h-[18px]" />
              </button>
              {menu && (
                <div className="absolute right-0 top-9 z-20 w-36 bg-white border border-[#ececef] rounded-xl shadow-lg overflow-hidden">
                  <button
                    onClick={() => onDuplicate(block)}
                    className="w-full h-11 px-3.5 flex items-center gap-2 text-sm hover:bg-[#f4f4f5]"
                  >
                    <Copy className="w-4 h-4" /> 블록 복사
                  </button>
                  <button
                    onClick={() => onAskDelete(block)}
                    className="w-full h-11 px-3.5 flex items-center gap-2 text-sm hover:bg-[#f4f4f5]"
                  >
                    <Trash2 className="w-4 h-4" /> 블록 삭제
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => onToggleExpand(block.id)}
          aria-label={expanded ? '접기' : '펼치기'}
          className="w-8 h-8 flex items-center justify-center text-[#71717a] flex-shrink-0"
        >
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* 펼친 내용 */}
      {expanded && (
        <div className={`px-4 pb-5 pt-1 border-t border-[#f2f2f4] ${readOnly ? 'pointer-events-none opacity-70' : ''}`}>
          {showSchedule && !pinned && (
            <SchedulePanel data={data} onChange={(d) => onChangeData(block.id, d)} />
          )}
          <div className="pt-3">
            <BlockFields type={block.type} data={data} onChange={(d) => onChangeData(block.id, d)} />
          </div>
          {pinned && !readOnly && (
            <div className="mt-4 text-right">
              <button onClick={() => onAskDelete(block)} className="text-xs text-[#a1a1a6] underline">
                프로필 블록 삭제
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 예약 공개 (시작·종료 일시) — datetime-local 은 한국 시간으로 입력받아 ISO 로 저장
function toLocalInput(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}
function fromLocalInput(v: string) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function SchedulePanel({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const now = Date.now();
  const from = data.visibleFrom ? Date.parse(data.visibleFrom) : NaN;
  const until = data.visibleUntil ? Date.parse(data.visibleUntil) : NaN;
  const status =
    !Number.isNaN(from) && now < from
      ? '공개 전 — 시작 시간이 되면 보여요'
      : !Number.isNaN(until) && now > until
        ? '종료됨 — 지금은 안 보여요'
        : data.visibleFrom || data.visibleUntil
          ? '지금 공개 중'
          : '';
  return (
    <div className="mt-3 rounded-xl bg-[#f6f7fb] p-3.5">
      <FieldLabel hint={status}>예약 공개</FieldLabel>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-[11px] text-[#71717a]">시작</span>
          <input
            type="datetime-local"
            value={toLocalInput(data.visibleFrom)}
            onChange={(e) => onChange({ ...data, visibleFrom: fromLocalInput(e.target.value) })}
            className="w-full h-10 px-2 rounded-lg border border-[#e4e4e7] bg-white text-[13px]"
          />
        </label>
        <label className="block">
          <span className="text-[11px] text-[#71717a]">종료</span>
          <input
            type="datetime-local"
            value={toLocalInput(data.visibleUntil)}
            onChange={(e) => onChange({ ...data, visibleUntil: fromLocalInput(e.target.value) })}
            className="w-full h-10 px-2 rounded-lg border border-[#e4e4e7] bg-white text-[13px]"
          />
        </label>
      </div>
      {(data.visibleFrom || data.visibleUntil) && (
        <button
          type="button"
          onClick={() => onChange({ ...data, visibleFrom: null, visibleUntil: null })}
          className="mt-2 text-xs text-[#71717a] underline"
        >
          예약 해제
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 블록 추가 시트
// ---------------------------------------------------------------------------

function AddBlockSheet({
  hasProfile,
  onPick,
  onClose,
}: {
  hasProfile: boolean;
  onPick: (t: BlockType) => void;
  onClose: () => void;
}) {
  const groups: { key: string; label: string; items: typeof BLOCK_TYPES }[] = [
    { key: 'content', label: '콘텐츠', items: BLOCK_TYPES.filter((b) => b.category === 'content') },
    { key: 'communication', label: '커뮤니케이션', items: BLOCK_TYPES.filter((b) => b.category === 'communication') },
  ];
  if (!hasProfile) groups[0].items = [BLOCK_TYPES[0], ...groups[0].items];

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-[560px] rounded-t-3xl sm:rounded-3xl max-h-[88vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 h-14 border-b border-[#f2f2f4]">
          <h2 className="font-bold text-[16px]">블록 추가</h2>
          <button onClick={onClose} aria-label="닫기" className="w-9 h-9 flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 pb-8">
          {groups.map((g) => (
            <div key={g.key} className="pt-5">
              <div className="text-[13px] text-[#71717a] mb-2">{g.label}</div>
              <div className="space-y-1">
                {g.items.map((b) => (
                  <button
                    key={b.type}
                    onClick={() => onPick(b.type)}
                    className="w-full flex items-center gap-3.5 px-2 py-2.5 rounded-xl hover:bg-[#f4f4f5] active:bg-[#e8f3ff] text-left"
                  >
                    <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: b.color }}>
                      <b.Icon className="w-5 h-5 text-white" />
                    </span>
                    <span>
                      <span className="block text-[15px] font-semibold text-[#111]">{b.label}</span>
                      <span className="block text-[12px] text-[#9a9aa0]">{b.desc}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 미리보기 (폰 프레임)
// ---------------------------------------------------------------------------

export function PreviewSheet({
  page,
  blocks,
  onClose,
}: {
  page: { title: string; slug: string; theme: PageTheme };
  blocks: Block[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] bg-black/55 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-[380px] h-[min(780px,86vh)]">
        <div className="absolute inset-0 rounded-[44px] bg-[#e9e9ec] p-[10px] shadow-2xl">
          <div className="w-full h-full rounded-[36px] overflow-hidden overflow-y-auto relative bg-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <PageView page={page} blocks={blocks} framed />
          </div>
        </div>
        <button
          onClick={onClose}
          className="absolute left-1/2 -translate-x-1/2 -bottom-5 h-12 px-6 rounded-full bg-white shadow-lg flex items-center gap-2 text-[15px] font-semibold"
        >
          <X className="w-5 h-5" /> 닫기
        </button>
      </div>
    </div>
  );
}
