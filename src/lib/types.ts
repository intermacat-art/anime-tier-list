export interface TierItem {
  id: string;
  name: string;
  image: string;
  subtitle?: string; // e.g. anime title for characters
  note?: string; // user's explanation for this placement
}

export interface TierRow {
  id: string;
  label: string;
  color: string;
  items: TierItem[];
}

export type TierListMode = "anime" | "character";

export interface TierListData {
  id?: string;
  title: string;
  mode: TierListMode;
  tiers: TierRow[];
  pool: TierItem[]; // unranked items
  createdAt?: number;
}

export const DEFAULT_TIERS: Omit<TierRow, "items">[] = [
  { id: "s", label: "S", color: "#ef4444" },
  { id: "a", label: "A", color: "#f97316" },
  { id: "b", label: "B", color: "#eab308" },
  { id: "c", label: "C", color: "#22c55e" },
  { id: "d", label: "D", color: "#3b82f6" },
  { id: "f", label: "F", color: "#6b7280" },
];
