"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { searchAnime, searchCharacters, getCharactersByMedia, getSeasonalAnime, getDisplayTitle, getMediaChineseTitle } from "@/lib/anilist";
import type { AnilistMedia, AnilistCharacter } from "@/lib/anilist";
import type { TierItem, TierListMode } from "@/lib/types";

interface SearchPanelProps {
  mode: TierListMode;
  onAdd: (item: TierItem) => void;
  existingIds: Set<string>;
}

export default function SearchPanel({ mode, onAdd, existingIds }: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [animeResults, setAnimeResults] = useState<AnilistMedia[]>([]);
  const [charResults, setCharResults] = useState<AnilistCharacter[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnime, setSelectedAnime] = useState<AnilistMedia | null>(null);
  const [animeChars, setAnimeChars] = useState<AnilistCharacter[]>([]);
  const [loadingChars, setLoadingChars] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // 預設載入當季動畫
  useEffect(() => {
    if (initialized || mode !== "anime") return;
    setInitialized(true);
    const now = new Date();
    const month = now.getMonth();
    const season = month < 3 ? "WINTER" : month < 6 ? "SPRING" : month < 9 ? "SUMMER" : "FALL";
    setLoading(true);
    getSeasonalAnime(now.getFullYear(), season)
      .then((res) => setAnimeResults(res.media))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [initialized, mode]);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSelectedAnime(null);
    try {
      if (mode === "anime") {
        const res = await searchAnime(query);
        setAnimeResults(res.media);
      } else {
        const res = await searchCharacters(query);
        setCharResults(res.characters);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [query, mode]);

  const handleLoadSeason = useCallback(async (season: string) => {
    setLoading(true);
    setSelectedAnime(null);
    setQuery("");
    try {
      const now = new Date();
      const year = now.getFullYear();
      const res = await getSeasonalAnime(year, season);
      setAnimeResults(res.media);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectAnimeForChars = useCallback(async (anime: AnilistMedia) => {
    setSelectedAnime(anime);
    setLoadingChars(true);
    try {
      const chars = await getCharactersByMedia(anime.id);
      setAnimeChars(chars);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingChars(false);
    }
  }, []);

  const addAnime = (m: AnilistMedia) => {
    const id = `anime-${m.id}`;
    if (existingIds.has(id)) return;
    onAdd({
      id,
      name: getDisplayTitle(m),
      image: m.coverImage.large,
      subtitle: m.seasonYear ? `${m.seasonYear}` : undefined,
    });
  };

  const addCharacter = (c: AnilistCharacter) => {
    const id = `char-${c.id}`;
    if (existingIds.has(id)) return;
    const mediaNode = c.media?.nodes?.[0];
    const subtitle = mediaNode
      ? getMediaChineseTitle(mediaNode)
      : selectedAnime
        ? getDisplayTitle(selectedAnime)
        : undefined;
    onAdd({
      id,
      name: c.name.native || c.name.full,
      image: c.image.large,
      subtitle,
    });
  };

  const currentSeason = () => {
    const m = new Date().getMonth();
    if (m < 3) return "WINTER";
    if (m < 6) return "SPRING";
    if (m < 9) return "SUMMER";
    return "FALL";
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-l border-zinc-700">
      <div className="p-3 border-b border-zinc-700">
        <h3 className="text-sm font-bold text-zinc-300 mb-2">
          {mode === "anime" ? "搜尋動畫" : "搜尋角色"}
        </h3>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-zinc-800 text-white text-sm rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={mode === "anime" ? "輸入動畫名稱..." : "輸入角色名稱..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-3 py-2 rounded transition-colors"
            onClick={handleSearch}
          >
            搜尋
          </button>
        </div>

        {mode === "anime" && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {(["WINTER", "SPRING", "SUMMER", "FALL"] as const).map((s) => (
              <button
                key={s}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  s === currentSeason()
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
                onClick={() => handleLoadSeason(s)}
              >
                {s === "WINTER" ? "冬番" : s === "SPRING" ? "春番" : s === "SUMMER" ? "夏番" : "秋番"}
              </button>
            ))}
          </div>
        )}

        {mode === "character" && !selectedAnime && (
          <p className="text-xs text-zinc-500 mt-2">
            搜尋角色名稱，或先在「動畫模式」找到作品再載入角色
          </p>
        )}
      </div>

      {/* Character mode: select anime first */}
      {mode === "character" && selectedAnime && (
        <div className="p-2 bg-zinc-800 border-b border-zinc-700 flex items-center gap-2">
          <button
            className="text-zinc-400 hover:text-white text-sm"
            onClick={() => { setSelectedAnime(null); setAnimeChars([]); }}
          >
            ← 返回
          </button>
          <span className="text-xs text-zinc-300 truncate">{getDisplayTitle(selectedAnime)}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2">
        {loading && <p className="text-zinc-500 text-sm text-center py-4">搜尋中...</p>}

        {/* Anime results */}
        {mode === "anime" && !loading && animeResults.map((m) => {
          const id = `anime-${m.id}`;
          const added = existingIds.has(id);
          const displayTitle = getDisplayTitle(m);
          return (
            <div
              key={m.id}
              className={`flex items-center gap-2 p-2 rounded mb-1 transition-colors ${
                added ? "opacity-40" : "hover:bg-zinc-800 cursor-pointer"
              }`}
              onClick={() => !added && addAnime(m)}
            >
              <Image
                src={m.coverImage.medium}
                alt={displayTitle}
                width={40}
                height={56}
                className="rounded object-cover w-10 h-14 flex-shrink-0"
                unoptimized
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white truncate">{displayTitle}</p>
                {displayTitle !== m.title.romaji && (
                  <p className="text-xs text-zinc-500 truncate">{m.title.romaji}</p>
                )}
                {m.seasonYear && (
                  <p className="text-xs text-zinc-600">{m.seasonYear} {m.season}</p>
                )}
              </div>
              <a
                href={`https://anilist.co/anime/${m.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-blue-400 hover:underline flex-shrink-0 ml-1"
                onClick={(e) => e.stopPropagation()}
              >
                詳情↗
              </a>
              {added && <span className="text-xs text-zinc-600 ml-1">已加入</span>}
            </div>
          );
        })}

        {/* Character search results */}
        {mode === "character" && !loading && !selectedAnime && charResults.map((c) => {
          const id = `char-${c.id}`;
          const added = existingIds.has(id);
          const mediaNode = c.media?.nodes?.[0];
          const mediaTitle = mediaNode ? getMediaChineseTitle(mediaNode) : undefined;
          return (
            <div
              key={c.id}
              className={`flex items-center gap-2 p-2 rounded mb-1 transition-colors ${
                added ? "opacity-40" : "hover:bg-zinc-800 cursor-pointer"
              }`}
              onClick={() => !added && addCharacter(c)}
            >
              <Image
                src={c.image.medium}
                alt={c.name.full}
                width={40}
                height={40}
                className="rounded object-cover w-10 h-10 flex-shrink-0"
                unoptimized
              />
              <div className="min-w-0">
                <p className="text-sm text-white truncate">{c.name.native || c.name.full}</p>
                {c.name.native && (
                  <p className="text-xs text-zinc-500 truncate">{c.name.full}</p>
                )}
                {mediaTitle && (
                  <p className="text-xs text-zinc-600 truncate">{mediaTitle}</p>
                )}
              </div>
              {added && <span className="text-xs text-zinc-600 ml-auto">已加入</span>}
            </div>
          );
        })}

        {/* Characters from selected anime */}
        {mode === "character" && selectedAnime && !loadingChars && animeChars.map((c) => {
          const id = `char-${c.id}`;
          const added = existingIds.has(id);
          return (
            <div
              key={c.id}
              className={`flex items-center gap-2 p-2 rounded mb-1 transition-colors ${
                added ? "opacity-40" : "hover:bg-zinc-800 cursor-pointer"
              }`}
              onClick={() => !added && addCharacter(c)}
            >
              <Image
                src={c.image.medium}
                alt={c.name.full}
                width={40}
                height={40}
                className="rounded object-cover w-10 h-10 flex-shrink-0"
                unoptimized
              />
              <div className="min-w-0">
                <p className="text-sm text-white truncate">{c.name.native || c.name.full}</p>
                {c.name.native && (
                  <p className="text-xs text-zinc-500 truncate">{c.name.full}</p>
                )}
              </div>
              {added && <span className="text-xs text-zinc-600 ml-auto">已加入</span>}
            </div>
          );
        })}
        {loadingChars && <p className="text-zinc-500 text-sm text-center py-4">載入角色中...</p>}
      </div>
    </div>
  );
}
