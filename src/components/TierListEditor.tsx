"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toPng } from "html-to-image";
import type { TierItem, TierRow, TierListMode } from "@/lib/types";
import { DEFAULT_TIERS } from "@/lib/types";
import SearchPanel from "./SearchPanel";
import NoteModal from "./NoteModal";
import { t } from "@/lib/i18n";

// --- Sortable item ---
function SortableItem({
  item,
  onRightClick,
}: {
  item: TierItem;
  onRightClick: (item: TierItem) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { item },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative group w-16 h-16 md:w-20 md:h-20 rounded overflow-hidden cursor-grab active:cursor-grabbing flex-shrink-0"
      onContextMenu={(e) => {
        e.preventDefault();
        onRightClick(item);
      }}
      title={item.note ? `${item.name}: ${item.note}` : item.name}
    >
      <Image
        src={item.image}
        alt={item.name}
        fill
        className="object-cover pointer-events-none"
        sizes="80px"
        unoptimized
      />
      {item.note && (
        <div className="absolute top-0 right-0 bg-blue-500 w-3 h-3 rounded-bl" />
      )}
      <div className="absolute inset-x-0 bottom-0 bg-black/70 px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-[9px] text-white truncate text-center">{item.name}</p>
      </div>
    </div>
  );
}

// --- Droppable tier row ---
function DroppableTierRow({
  tier,
  onRightClick,
  onRenameLabel,
}: {
  tier: TierRow;
  onRightClick: (item: TierItem) => void;
  onRenameLabel: (tierId: string, newLabel: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: tier.id });
  const itemIds = tier.items.map((i) => i.id);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(tier.label);

  return (
    <div className="flex border-b border-zinc-700 min-h-[4.5rem] md:min-h-[5.5rem]">
      <div
        className="w-14 md:w-20 flex items-center justify-center text-xl md:text-2xl font-black flex-shrink-0 cursor-pointer select-none"
        style={{ backgroundColor: tier.color }}
        onDoubleClick={() => { setEditing(true); setEditValue(tier.label); }}
        title={t("doubleClickRename")}
      >
        {editing ? (
          <input
            className="w-full h-full bg-transparent text-center text-xl md:text-2xl font-black outline-none text-white"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => { onRenameLabel(tier.id, editValue || tier.label); setEditing(false); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") { onRenameLabel(tier.id, editValue || tier.label); setEditing(false); }
              if (e.key === "Escape") setEditing(false);
            }}
            autoFocus
            maxLength={10}
          />
        ) : (
          tier.label
        )}
      </div>
      <SortableContext id={tier.id} items={itemIds} strategy={rectSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex-1 flex flex-wrap items-center gap-1 p-1 min-h-[4.5rem] md:min-h-[5.5rem] transition-colors ${
            isOver ? "bg-zinc-700/60" : "bg-zinc-800/50"
          }`}
        >
          {tier.items.map((item) => (
            <SortableItem key={item.id} item={item} onRightClick={onRightClick} />
          ))}
          {tier.items.length === 0 && !isOver && (
            <span className="text-zinc-600 text-xs px-2">{t("dragHere")}</span>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// --- Droppable pool ---
function DroppablePool({
  pool,
  mode,
  onRightClick,
  onRemove,
}: {
  pool: TierItem[];
  mode: TierListMode;
  onRightClick: (item: TierItem) => void;
  onRemove: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "pool" });
  const poolIds = pool.map((i) => i.id);

  return (
    <div className="mt-4 bg-zinc-900 rounded-xl border border-zinc-700 p-3">
      <h3 className="text-sm font-bold text-zinc-400 mb-2">
        {t("unranked")}
      </h3>
      <SortableContext id="pool" items={poolIds} strategy={rectSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex flex-wrap gap-1 min-h-[5rem] transition-colors rounded ${
            isOver ? "bg-zinc-800" : ""
          }`}
        >
          {pool.map((item) => (
            <div key={item.id} className="relative group/remove">
              <SortableItem item={item} onRightClick={onRightClick} />
              <button
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover/remove:opacity-100 transition-opacity z-10"
                onClick={() => onRemove(item.id)}
                title="移除"
              >
                ×
              </button>
            </div>
          ))}
          {pool.length === 0 && (
            <p className="text-zinc-600 text-sm py-4 w-full text-center">
              {t("addFromSearch")}{mode === "anime" ? t("anime") : t("character")}
            </p>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// --- Main editor ---
export default function TierListEditor() {
  const [mode, setMode] = useState<TierListMode>("anime");
  const [title, setTitle] = useState(t("myTierList"));
  const [tiers, setTiers] = useState<TierRow[]>(
    DEFAULT_TIERS.map((t) => ({ ...t, items: [] }))
  );
  const [pool, setPool] = useState<TierItem[]>([]);
  const [activeItem, setActiveItem] = useState<TierItem | null>(null);
  const [noteItem, setNoteItem] = useState<TierItem | null>(null);
  const [showSearch, setShowSearch] = useState(true);
  const exportRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Helper: find which container an item is in
  const getContainer = useCallback(
    (itemId: string): string | null => {
      if (pool.some((i) => i.id === itemId)) return "pool";
      for (const t of tiers) {
        if (t.items.some((i) => i.id === itemId)) return t.id;
      }
      return null;
    },
    [pool, tiers]
  );

  // Helper: find an item by id
  const getItem = useCallback(
    (id: string): TierItem | undefined => {
      const inPool = pool.find((i) => i.id === id);
      if (inPool) return inPool;
      for (const t of tiers) {
        const found = t.items.find((i) => i.id === id);
        if (found) return found;
      }
      return undefined;
    },
    [pool, tiers]
  );

  // Resolve what container an "over" id refers to
  const resolveOverContainer = useCallback(
    (overId: string): string | null => {
      // It's a droppable container itself (tier id or "pool")
      if (overId === "pool") return "pool";
      if (tiers.some((t) => t.id === overId)) return overId;
      // It's an item inside a container
      return getContainer(overId);
    },
    [tiers, getContainer]
  );

  const handleDragStart = (e: DragStartEvent) => {
    const item = getItem(e.active.id as string);
    setActiveItem(item ?? null);
  };

  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const fromContainer = getContainer(activeId);
    const toContainer = resolveOverContainer(overId);

    if (!fromContainer || !toContainer || fromContainer === toContainer) return;

    // Remove from source
    const item = getItem(activeId);
    if (!item) return;

    setPool((prev) => prev.filter((i) => i.id !== activeId));
    setTiers((prev) =>
      prev.map((t) => ({ ...t, items: t.items.filter((i) => i.id !== activeId) }))
    );

    // Add to destination
    if (toContainer === "pool") {
      setPool((prev) => [...prev, item]);
    } else {
      setTiers((prev) =>
        prev.map((t) => {
          if (t.id !== toContainer) return t;
          // Insert at the position of the hovered item, or at end
          const overIndex = t.items.findIndex((i) => i.id === overId);
          const newItems = [...t.items];
          if (overIndex >= 0) {
            newItems.splice(overIndex, 0, item);
          } else {
            newItems.push(item);
          }
          return { ...t, items: newItems };
        })
      );
    }
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = e;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;

    const container = getContainer(activeId);
    const overContainer = resolveOverContainer(overId);

    // Only reorder within same container
    if (!container || container !== overContainer) return;

    if (container === "pool") {
      setPool((prev) => {
        const oldIdx = prev.findIndex((i) => i.id === activeId);
        const newIdx = prev.findIndex((i) => i.id === overId);
        if (oldIdx < 0 || newIdx < 0) return prev;
        const arr = [...prev];
        const [moved] = arr.splice(oldIdx, 1);
        arr.splice(newIdx, 0, moved);
        return arr;
      });
    } else {
      setTiers((prev) =>
        prev.map((t) => {
          if (t.id !== container) return t;
          const oldIdx = t.items.findIndex((i) => i.id === activeId);
          const newIdx = t.items.findIndex((i) => i.id === overId);
          if (oldIdx < 0 || newIdx < 0) return t;
          const arr = [...t.items];
          const [moved] = arr.splice(oldIdx, 1);
          arr.splice(newIdx, 0, moved);
          return { ...t, items: arr };
        })
      );
    }
  };

  const handleAddItem = useCallback((item: TierItem) => {
    setPool((prev) => [...prev, item]);
  }, []);

  const handleSaveNote = useCallback((id: string, note: string) => {
    const update = (items: TierItem[]) =>
      items.map((i) => (i.id === id ? { ...i, note } : i));
    setPool((prev) => update(prev));
    setTiers((prev) => prev.map((t) => ({ ...t, items: update(t.items) })));
  }, []);

  const handleRemoveItem = useCallback((id: string) => {
    setPool((prev) => prev.filter((i) => i.id !== id));
    setTiers((prev) => prev.map((t) => ({ ...t, items: t.items.filter((i) => i.id !== id) })));
  }, []);

  const handleRenameLabel = useCallback((tierId: string, newLabel: string) => {
    setTiers((prev) => prev.map((t) => (t.id === tierId ? { ...t, label: newLabel } : t)));
  }, []);

  const handleExport = useCallback(async () => {
    if (!exportRef.current) return;
    const node = exportRef.current;
    const imgs = node.querySelectorAll("img");
    const originalSrcs = new Map<HTMLImageElement, string>();

    // 透過代理將外部圖片轉成 base64，避免 CORS 問題
    await Promise.all(
      Array.from(imgs).map(async (img) => {
        const src = img.src;
        if (!src || src.startsWith("data:")) return;
        originalSrcs.set(img, src);
        try {
          const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(src)}`;
          const res = await fetch(proxyUrl);
          const blob = await res.blob();
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          img.src = dataUrl;
        } catch { /* keep original src */ }
      })
    );

    try {
      const dataUrl = await toPng(node, {
        backgroundColor: "#18181b",
        pixelRatio: 2,
        skipFonts: true,
      });
      const link = document.createElement("a");
      link.download = `${title}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("Export failed", e);
      alert("Export failed. Please try again.");
    } finally {
      // 還原圖片 src
      originalSrcs.forEach((src, img) => { img.src = src; });
    }
  }, [title]);

  const handleReset = useCallback(() => {
    const allItems = [...pool];
    tiers.forEach((t) => allItems.push(...t.items));
    setPool(allItems);
    setTiers((prev) => prev.map((t) => ({ ...t, items: [] })));
  }, [pool, tiers]);

  return (
    <div className="flex h-screen bg-zinc-950 text-white">
      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-2 p-3 border-b border-zinc-800 flex-wrap">
          <input
            className="bg-zinc-900 text-white font-bold text-lg px-3 py-1 rounded outline-none focus:ring-2 focus:ring-blue-500 w-64"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="flex bg-zinc-800 rounded overflow-hidden">
            <button
              className={`px-3 py-1.5 text-sm transition-colors ${
                mode === "anime" ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-white"
              }`}
              onClick={() => setMode("anime")}
            >
              {t("animeRank")}
            </button>
            <button
              className={`px-3 py-1.5 text-sm transition-colors ${
                mode === "character" ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-white"
              }`}
              onClick={() => setMode("character")}
            >
              {t("charRank")}
            </button>
          </div>
          <div className="flex-1" />
          <button
            className="px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
            onClick={handleReset}
          >
            {t("resetRank")}
          </button>
          <button
            className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-500 rounded transition-colors"
            onClick={handleExport}
          >
            {t("exportImage")}
          </button>
          <button
            className="px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 rounded transition-colors md:hidden"
            onClick={() => setShowSearch(!showSearch)}
          >
            {showSearch ? t("hideSearch") : t("showSearch")}
          </button>
        </div>

        {/* Tier list */}
        <div className="flex-1 overflow-y-auto p-2 md:p-4">
          <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            {/* Exportable area */}
            <div ref={exportRef} className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-700">
              <div className="px-4 py-3 border-b border-zinc-700 flex items-center justify-between">
                <h2 className="font-bold text-lg">{title}</h2>
                <span className="text-xs text-zinc-500">
                  {t("dataSource")}
                  <a href="https://anilist.co" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">AniList</a>
                </span>
              </div>
              {tiers.map((tier) => (
                <DroppableTierRow
                  key={tier.id}
                  tier={tier}
                  onRightClick={setNoteItem}
                  onRenameLabel={handleRenameLabel}
                />
              ))}
            </div>

            {/* Unranked pool */}
            <DroppablePool
              pool={pool}
              mode={mode}
              onRightClick={setNoteItem}
              onRemove={handleRemoveItem}
            />

            <DragOverlay>
              {activeItem && (
                <div className="w-16 h-16 md:w-20 md:h-20 rounded overflow-hidden shadow-2xl opacity-90 relative">
                  <Image
                    src={activeItem.image}
                    alt={activeItem.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                    unoptimized
                  />
                </div>
              )}
            </DragOverlay>
          </DndContext>

          <p className="text-xs text-zinc-600 mt-3 text-center">
            {t("rightClickHint")}
          </p>
        </div>
      </div>

      {/* Search panel */}
      {showSearch && (
        <div className="w-72 md:w-80 flex-shrink-0">
          <SearchPanel mode={mode} onAdd={handleAddItem} />
        </div>
      )}

      {/* Note modal */}
      <NoteModal item={noteItem} onSave={handleSaveNote} onClose={() => setNoteItem(null)} />
    </div>
  );
}
