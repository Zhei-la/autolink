'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Clock, Copy, Eye, GripVertical, Plus, Star, Trash2, X } from 'lucide-react';
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
import { BLOCK_TYPES, BlockGlyph, blockMeta, blockSummary } from './blockTypes';
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
    <div className="lg:grid lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] lg:gap-14">
      <div className="min-w-0">
        {readOnly && (
          <div className="mb-3 p-4 bg-cherry-soft rounded-2xl text-sm text-cherry-dark">
            {readOnlyMessage || '지금은 편집할 수 없어요.'}
          </div>
        )}

        {error && (
          <div className="mb-3 p-3 bg-cherry-soft rounded-xl text-sm text-cherry-dark flex items-start justify-between gap-2">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-xs underline flex-shrink-0">
              닫기
            </button>
          </div>
        )}

        <div className="flex items-center justify-between h-6 mb-3 px-0.5">
          <span className="text-[13px] text-[#8b8b90]">
            {others.length > 1 ? '왼쪽 손잡이를 끌어서 순서를 바꿔요' : '블록을 쌓아서 페이지를 만들어요'}
          </span>
          <SaveBadge state={saveState} />
        </div>

        {profile ? (
          <div className="bl-panel overflow-hidden mb-3">
            <BlockCard block={profile} expanded={expanded.has(profile.id)} pinned {...cardProps} />
          </div>
        ) : (
          !readOnly && (
            <button
              onClick={() => handleAdd('profile')}
              className="w-full h-14 mb-3 rounded-[16px] border-2 border-dashed border-line text-[#3f3f44] text-sm font-semibold flex items-center justify-center gap-1.5 hover:border-ink transition"
            >
              <Plus className="w-4 h-4" /> 프로필 넣기
            </button>
          )
        )}

        {others.length > 0 && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={others.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              <div className="rounded-[16px] border border-line divide-y divide-line">
                {others.map((b) => (
                  <SortableCard key={b.id} block={b} expanded={expanded.has(b.id)} {...cardProps} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {!readOnly && (
          <button
            onClick={() => setShowAdd(true)}
            className="mt-3 w-full h-14 rounded-[16px] border-2 border-dashed border-line text-ink text-[15px] font-bold flex items-center justify-center gap-1.5 hover:border-cherry hover:text-cherry transition bl-ring"
          >
            <Plus className="w-[18px] h-[18px]" /> 블록 추가
          </button>
        )}
      </div>

      {/* 넓은 화면: 오른쪽에 실시간 미리보기 */}
      <aside className="hidden lg:block">
        <div className="sticky top-[124px]">
          <PhoneFrame height="calc(100vh - 190px)">
            <PageView page={page} blocks={blocks} framed />
          </PhoneFrame>
          <p className="mt-3 text-center text-[12px] text-[#8b8b90]">고치는 대로 바로 바뀌어요</p>
        </div>
      </aside>

      {/* 좁은 화면: 아래에 미리보기 · 블록 추가 */}
      <div className="lg:hidden fixed left-0 right-0 bottom-[calc(16px+env(safe-area-inset-bottom))] z-30 flex justify-center pointer-events-none">
        <div className="pointer-events-auto h-12 rounded-full bg-ink text-white flex items-center shadow-[0_8px_24px_rgba(23,23,23,0.28)] overflow-hidden">
          <button onClick={() => setShowPreview(true)} className="h-full pl-4 pr-4 flex items-center gap-1.5 text-[14px] font-semibold">
            <Eye className="w-4 h-4" /> 미리보기
          </button>
          {!readOnly && (
            <button
              onClick={() => setShowAdd(true)}
              className="h-full pl-3.5 pr-4 flex items-center gap-1.5 text-[14px] font-bold bg-cherry"
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
        title="이 블록을 지울까요?"
        message={'지운 블록은 되돌릴 수 없어요.'}
        confirmText="지우기"
        danger
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
      />
    </div>
  );
}

function SaveBadge({ state }: { state: SaveState }) {
  if (state === 'idle') return null;
  const map = {
    saving: { text: '저장 중', dot: 'bg-[#c9c9cd] animate-pulse' },
    saved: { text: '저장됨', dot: 'bg-ink' },
    error: { text: '저장 안 됨', dot: 'bg-cherry' },
  } as const;
  const m = map[state];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold ${state === 'error' ? 'text-cherry' : 'text-[#3f3f44]'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.text}
    </span>
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
      className={`bg-white first:rounded-t-[16px] last:rounded-b-[16px] ${isDragging ? 'shadow-[0_12px_32px_rgba(23,23,23,0.18)] rounded-[16px] ring-1 ring-ink' : ''}`}
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
              className="w-6 h-10 flex items-center justify-center text-[#c9c9cd] hover:text-ink touch-none cursor-grab active:cursor-grabbing flex-shrink-0"
            >
              <GripVertical className="w-4 h-4" />
            </button>
          ) : (
            <span className="w-6" />
          )
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
  const data = block.data || {};
  const [showSchedule, setShowSchedule] = useState(false);
  const scheduled = !!(data.visibleFrom || data.visibleUntil);
  const off = block.is_active === false;
  const summary = blockSummary(block);

  return (
    <div id={`block-${block.id}`}>
      {/* 머리줄 */}
      <div className={`flex items-center gap-2.5 pl-1.5 pr-2 min-h-[68px] ${expanded ? 'bg-mist/60' : ''}`}>
        {pinned ? <span className="w-6" /> : dragHandle}

        <span className={`w-11 h-11 rounded-[12px] flex items-center justify-center flex-shrink-0 ${expanded ? 'bg-white' : 'bg-mist'}`}>
          <BlockGlyph type={block.type} size={30} dim={off} />
        </span>

        <button
          type="button"
          onClick={() => onToggleExpand(block.id)}
          aria-expanded={expanded}
          className="flex-1 min-w-0 text-left py-2"
        >
          <span className="flex items-center gap-1.5">
            <span className={`text-[15px] font-bold ${off ? 'text-[#b4b4b8]' : 'text-ink'}`}>{meta.label}</span>
            {data.highlight && (
              <span className="text-[11px] font-bold px-1.5 h-[18px] leading-[18px] rounded-md bg-cherry-soft text-cherry">강조</span>
            )}
            {scheduled && <Clock className="w-3.5 h-3.5 text-cherry flex-shrink-0" aria-label="예약 공개" />}
            {off && <span className="text-[11px] font-bold px-1.5 h-[18px] leading-[18px] rounded-md bg-mist text-[#8b8b90]">숨김</span>}
          </span>
          <span className={`block text-[13px] truncate mt-0.5 ${summary ? 'text-[#6b6b70]' : 'text-[#b4b4b8]'}`}>
            {summary || '눌러서 내용을 채워 주세요'}
          </span>
        </button>

        {!pinned && !readOnly && (
          <Toggle size="sm" checked={!off} onChange={(v) => onActive(block, v)} label={off ? '보이기' : '숨기기'} />
        )}

        <button
          type="button"
          onClick={() => onToggleExpand(block.id)}
          aria-label={expanded ? '접기' : '펼치기'}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#8b8b90] hover:bg-white flex-shrink-0"
        >
          <ChevronDown className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* 펼친 내용 */}
      {expanded && (
        <div className={`px-4 pb-5 pt-3 border-t border-line ${readOnly ? 'pointer-events-none opacity-70' : ''}`}>
          {!pinned && !readOnly && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {meta.canHighlight && (
                <Chip on={!!data.highlight} onClick={() => onChangeData(block.id, (d: any) => ({ ...d, highlight: !d.highlight }))}>
                  <Star className={`w-3.5 h-3.5 ${data.highlight ? 'fill-current' : ''}`} /> 강조
                </Chip>
              )}
              <Chip on={scheduled || showSchedule} onClick={() => setShowSchedule((v) => !v)}>
                <Clock className="w-3.5 h-3.5" /> 예약 공개
              </Chip>
              <Chip onClick={() => onDuplicate(block)}>
                <Copy className="w-3.5 h-3.5" /> 복사
              </Chip>
              <Chip onClick={() => onAskDelete(block)} danger>
                <Trash2 className="w-3.5 h-3.5" /> 지우기
              </Chip>
            </div>
          )}
          {showSchedule && !pinned && <SchedulePanel data={data} onChange={(d) => onChangeData(block.id, d)} />}
          <BlockFields type={block.type} data={data} onChange={(d) => onChangeData(block.id, d)} />
          {pinned && !readOnly && (
            <div className="mt-5 text-right">
              <button onClick={() => onAskDelete(block)} className="text-xs text-[#8b8b90] underline">
                프로필 빼기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Chip({
  on,
  danger,
  onClick,
  children,
}: {
  on?: boolean;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`h-8 px-3 rounded-full text-[13px] font-semibold inline-flex items-center gap-1 transition bl-ring ${
        on
          ? 'bg-cherry text-white'
          : danger
            ? 'bg-white border border-line text-[#8b8b90] hover:text-cherry hover:border-cherry'
            : 'bg-white border border-line text-[#3f3f44] hover:border-ink'
      }`}
    >
      {children}
    </button>
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
      ? '시작 시간이 되면 보여요'
      : !Number.isNaN(until) && now > until
        ? '끝나서 지금은 안 보여요'
        : data.visibleFrom || data.visibleUntil
          ? '지금 공개 중'
          : '';
  return (
    <div className="mb-4 rounded-[14px] border border-cherry/30 bg-cherry-soft/50 p-3.5">
      <FieldLabel hint={status}>예약 공개</FieldLabel>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-[11px] text-[#71717a]">시작</span>
          <input
            type="datetime-local"
            value={toLocalInput(data.visibleFrom)}
            onChange={(e) => onChange({ ...data, visibleFrom: fromLocalInput(e.target.value) })}
            className="w-full h-10 px-2 rounded-[10px] border border-line bg-white text-[13px]"
          />
        </label>
        <label className="block">
          <span className="text-[11px] text-[#71717a]">종료</span>
          <input
            type="datetime-local"
            value={toLocalInput(data.visibleUntil)}
            onChange={(e) => onChange({ ...data, visibleUntil: fromLocalInput(e.target.value) })}
            className="w-full h-10 px-2 rounded-[10px] border border-line bg-white text-[13px]"
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
  const show = BLOCK_TYPES.filter((b) => b.category === 'show');
  const groups = [
    { key: 'show', label: '페이지에 보여줄 것', items: hasProfile ? show : [BLOCK_TYPES[0], ...show] },
    { key: 'receive', label: '방문자에게 받을 것', items: BLOCK_TYPES.filter((b) => b.category === 'receive') },
  ];

  return (
    <div className="fixed inset-0 z-[60] bg-ink/40 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-[600px] rounded-t-[24px] sm:rounded-[24px] max-h-[88vh] overflow-y-auto"
      >
        <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-5 h-16">
          <h2 className="font-extrabold text-[18px] text-ink">무엇을 넣을까요?</h2>
          <button onClick={onClose} aria-label="닫기" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-mist">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 pb-8">
          {groups.map((g) => (
            <section key={g.key} className="mb-6 last:mb-0">
              <h3 className="text-[13px] font-semibold text-[#8b8b90] mb-2.5">{g.label}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {g.items.map((b) => (
                  <button
                    key={b.type}
                    onClick={() => onPick(b.type)}
                    className="group text-left rounded-[16px] border border-line p-3 hover:border-ink active:bg-mist transition bl-ring"
                  >
                    <span className="w-full aspect-[2/1] rounded-[12px] bg-mist flex items-center justify-center mb-2.5 group-hover:bg-cherry-soft transition">
                      <BlockGlyph type={b.type} size={40} />
                    </span>
                    <span className="block text-[15px] font-bold text-ink">{b.label}</span>
                    <span className="block text-[12px] leading-snug text-[#8b8b90] mt-0.5">{b.desc}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 휴대폰 틀 (미리보기)
// ---------------------------------------------------------------------------

export function PhoneFrame({ children, height = 'min(760px, 82vh)' }: { children: React.ReactNode; height?: string }) {
  return (
    <div className="mx-auto w-full max-w-[360px] rounded-[46px] bg-ink p-[9px] shadow-[0_24px_60px_rgba(23,23,23,0.22)]" style={{ height }}>
      <div className="relative w-full h-full rounded-[38px] overflow-hidden bg-white">
        <span className="absolute top-2.5 left-1/2 -translate-x-1/2 z-10 w-20 h-5 rounded-full bg-ink" aria-hidden />
        <div className="w-full h-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{children}</div>
      </div>
    </div>
  );
}

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
    <div className="fixed inset-0 z-[70] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center p-4 gap-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full">
        <PhoneFrame>
          <PageView page={page} blocks={blocks} framed />
        </PhoneFrame>
      </div>
      <button onClick={onClose} className="h-12 px-6 rounded-full bg-ink text-white flex items-center gap-2 text-[15px] font-semibold">
        <X className="w-5 h-5" /> 닫기
      </button>
    </div>
  );
}
