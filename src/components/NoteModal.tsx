"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { TierItem } from "@/lib/types";
import { t } from "@/lib/i18n";

interface NoteModalProps {
  item: TierItem | null;
  onSave: (id: string, note: string) => void;
  onClose: () => void;
}

export default function NoteModal({ item, onSave, onClose }: NoteModalProps) {
  const [note, setNote] = useState("");

  useEffect(() => {
    if (item) setNote(item.note ?? "");
  }, [item]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-zinc-900 rounded-xl p-6 w-full max-w-md mx-4 border border-zinc-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <Image
            src={item.image}
            alt={item.name}
            width={48}
            height={48}
            className="rounded object-cover w-12 h-12"
            unoptimized
          />
          <div>
            <h3 className="text-white font-bold">{item.name}</h3>
            {item.subtitle && <p className="text-xs text-zinc-500">{item.subtitle}</p>}
          </div>
        </div>

        <label className="block text-sm text-zinc-400 mb-1">
          {t("noteLabel")}
        </label>
        <textarea
          className="w-full bg-zinc-800 text-white rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={4}
          placeholder={t("notePlaceholder")}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
        />
        <p className="text-xs text-zinc-600 mt-1 text-right">{note.length}/200</p>

        <div className="flex justify-end gap-2 mt-4">
          <button
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
            onClick={onClose}
          >
            {t("cancel")}
          </button>
          <button
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            onClick={() => { onSave(item.id, note); onClose(); }}
          >
            {t("save")}
          </button>
        </div>
      </div>
    </div>
  );
}
