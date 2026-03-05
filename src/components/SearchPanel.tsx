"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { searchAnime, searchCharacters, getCharactersByMedia, getSeasonalAnime, getDisplayTitle } from "@/lib/anilist";
import type { AnilistMedia, AnilistCharacter } from "@/lib/anilist";
import type { TierItem, TierListMode } from "@/lib/types";
import { t } from "@/lib/i18n";

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
  const [fallbackAnime, setFallbackAnime] = useState<AnilistMedia[]>([]);

  // 預設載入當季動畫
  useEffect(() => {
    if (mode !== "anime") return;
    // 只在結果為空且沒有搜尋詞時載入
    if (animeResults.length > 0 || query.trim()) return;
    const now = new Date();
    const month = now.getMonth();
    const season = month < 3 ? "WINTER" : month < 6 ? "SPRING" : month < 9 ? "SUMMER" : "FALL";
    let cancelled = false;
    setLoading(true);
    getSeasonalAnime(now.getFullYear(), season)
      .then((res) => { if (!cancelled) setAnimeResults(res.media); })
      .catch((err) => { if (!cancelled) console.error("Failed to load seasonal anime:", err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSelectedAnime(null);
    setFallbackAnime([]);
    try {
      if (mode === "anime") {
        const res = await searchAnime(query);
        setAnimeResults(res.media);
      } else {
        const res = await searchCharacters(query);
        setCharResults(res.characters);
        // 角色搜尋無結果時，自動用同樣關鍵字搜動畫作為 fallback
        if (res.characters.length === 0) {
          try {
            const animeRes = await searchAnime(query);
            setFallbackAnime(animeRes.media);
          } catch { /* ignore */ }
        }
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
      ? getDisplayTitle(mediaNode)
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

  const seasonLabels: Record<string, string> = {
    WINTER: t("winter"),
    SPRING: t("spring"),
    SUMMER: t("summer"),
    FALL: t("fall"),
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-l border-zinc-700">
      <div className="p-3 border-b border-zinc-700">
        <h3 className="text-sm font-bold text-zinc-300 mb-2">
          {mode === "anime" ? t("searchAnime") : t("searchCharacter")}
        </h3>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-zinc-800 text-white text-sm rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={mode === "anime" ? t("searchPlaceholderAnime") : t("searchPlaceholderChar")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-3 py-2 rounded transition-colors"
            onClick={handleSearch}
          >
            {t("search")}
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
                {seasonLabels[s]}
              </button>
            ))}
          </div>
        )}

        {mode === "character" && !selectedAnime && (
          <p className="text-xs text-zinc-500 mt-2">{t("charHint")}</p>
        )}
      </div>

      {mode === "character" && selectedAnime && (
        <div className="p-2 bg-zinc-800 border-b border-zinc-700 flex items-center gap-2">
          <button
            className="text-zinc-400 hover:text-white text-sm"
            onClick={() => { setSelectedAnime(null); setAnimeChars([]); }}
          >
            {t("back")}
          </button>
          <span className="text-xs text-zinc-300 truncate">{getDisplayTitle(selectedAnime)}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2">
        {loading && <p className="text-zinc-500 text-sm text-center py-4">{t("searching")}</p>}

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
                {t("detail")}
              </a>
              {added && <span className="text-xs text-zinc-600 ml-1">{t("added")}</span>}
            </div>
          );
        })}

        {mode === "character" && !loading && !selectedAnime && charResults.map((c) => {
          const id = `char-${c.id}`;
          const added = existingIds.has(id);
          const mediaNode = c.media?.nodes?.[0];
          const mediaTitle = mediaNode ? getDisplayTitle(mediaNode) : undefined;
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
              {added && <span className="text-xs text-zinc-600 ml-auto">{t("added")}</span>}
            </div>
          );
        })}

        {mode === "character" && !loading && !selectedAnime && charResults.length === 0 && fallbackAnime.length > 0 && (
          <div>
            <p className="text-xs text-yellow-500 px-1 py-2">{t("charSearchFallback")}</p>
            <p className="text-xs text-zinc-600 px-1 mb-2">{t("charSearchTipChinese")}</p>
            {fallbackAnime.map((m) => {
              const displayTitle = getDisplayTitle(m);
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-2 p-2 rounded mb-1 hover:bg-zinc-800 cursor-pointer"
                  onClick={() => handleSelectAnimeForChars(m)}
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
                  </div>
                  <span className="text-xs text-blue-400 flex-shrink-0">{t("browseChars")}</span>
                </div>
              );
            })}
          </div>
        )}

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
              {added && <span className="text-xs text-zinc-600 ml-auto">{t("added")}</span>}
            </div>
          );
        })}
        {loadingChars && <p className="text-zinc-500 text-sm text-center py-4">{t("loadingChars")}</p>}
      </div>
    </div>
  );
}
