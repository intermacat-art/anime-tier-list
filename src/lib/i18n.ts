const messages = {
  "zh-TW": {
    searchAnime: "搜尋動畫",
    searchCharacter: "搜尋角色",
    searchPlaceholderAnime: "輸入動畫名稱...",
    searchPlaceholderChar: "輸入角色名稱...",
    search: "搜尋",
    winter: "冬番",
    spring: "春番",
    summer: "夏番",
    fall: "秋番",
    charHint: "搜尋角色名稱，或先在「動畫模式」找到作品再載入角色",
    back: "← 返回",
    detail: "詳情↗",
    added: "已加入",
    searching: "搜尋中...",
    loadingChars: "載入角色中...",
    animeRank: "動畫排行",
    charRank: "角色排行",
    resetRank: "重置排名",
    exportImage: "匯出圖片",
    hideSearch: "隱藏搜尋",
    showSearch: "搜尋",
    unranked: "未排名（拖曳到上方 Tier 中）",
    addFromSearch: "從右側搜尋面板加入",
    anime: "動畫",
    character: "角色",
    rightClickHint: "右鍵（手機長按）角色/動畫可加入觀點",
    dragHere: "拖曳至此",
    doubleClickRename: "雙擊修改名稱",
    remove: "移除",
    dataSource: "資料來源：",
    myTierList: "我的 Tier List",
    noteLabel: "你的觀點（為什麼放在這個 Tier？）",
    notePlaceholder: "例：無慘雖然很俗辣，但活了一千年還能壓制所有柱...",
    save: "儲存",
    cancel: "取消",
    charSearchFallback: "找不到角色，以下是相關動畫，點擊可瀏覽角色：",
    charSearchTipChinese: "角色搜尋建議使用英文或日文名（如 Edward Elric）",
    browseChars: "瀏覽角色",
    year: "年",
    browseBySeasonHint: "選擇年份與季節來瀏覽動畫，點擊可查看角色",
    genderAll: "全部",
    genderMale: "男",
    genderFemale: "女",
  },
  en: {
    searchAnime: "Search Anime",
    searchCharacter: "Search Character",
    searchPlaceholderAnime: "Enter anime name...",
    searchPlaceholderChar: "Enter character name...",
    search: "Search",
    winter: "Winter",
    spring: "Spring",
    summer: "Summer",
    fall: "Fall",
    charHint: "Search character names, or find an anime first to load its characters",
    back: "← Back",
    detail: "Detail↗",
    added: "Added",
    searching: "Searching...",
    loadingChars: "Loading characters...",
    animeRank: "Anime Tier",
    charRank: "Character Tier",
    resetRank: "Reset",
    exportImage: "Export PNG",
    hideSearch: "Hide Search",
    showSearch: "Search",
    unranked: "Unranked (drag to tiers above)",
    addFromSearch: "Add from the search panel →",
    anime: "anime",
    character: "characters",
    rightClickHint: "Right-click (long-press on mobile) to add opinion",
    dragHere: "Drop here",
    doubleClickRename: "Double-click to rename",
    remove: "Remove",
    dataSource: "Data: ",
    myTierList: "My Tier List",
    noteLabel: "Your opinion (why this tier?)",
    notePlaceholder: "e.g. This character is underrated because...",
    save: "Save",
    cancel: "Cancel",
    charSearchFallback: "No characters found. Related anime below — click to browse characters:",
    charSearchTipChinese: "Try searching character names in English or Japanese (e.g. Edward Elric)",
    browseChars: "Browse characters",
    year: "",
    browseBySeasonHint: "Pick a year & season to browse anime, click to view characters",
    genderAll: "All",
    genderMale: "Male",
    genderFemale: "Female",
  },
  ja: {
    searchAnime: "アニメ検索",
    searchCharacter: "キャラクター検索",
    searchPlaceholderAnime: "アニメ名を入力...",
    searchPlaceholderChar: "キャラクター名を入力...",
    search: "検索",
    winter: "冬アニメ",
    spring: "春アニメ",
    summer: "夏アニメ",
    fall: "秋アニメ",
    charHint: "キャラクター名で検索、またはアニメからキャラを読み込み",
    back: "← 戻る",
    detail: "詳細↗",
    added: "追加済",
    searching: "検索中...",
    loadingChars: "キャラクター読み込み中...",
    animeRank: "アニメランク",
    charRank: "キャラランク",
    resetRank: "リセット",
    exportImage: "画像出力",
    hideSearch: "検索を隠す",
    showSearch: "検索",
    unranked: "未ランク（上のTierにドラッグ）",
    addFromSearch: "右の検索パネルから追加 →",
    anime: "アニメ",
    character: "キャラ",
    rightClickHint: "右クリック（モバイルは長押し）でコメント追加",
    dragHere: "ここにドロップ",
    doubleClickRename: "ダブルクリックで名前変更",
    remove: "削除",
    dataSource: "データ：",
    myTierList: "マイTierリスト",
    noteLabel: "あなたの意見（なぜこのTier？）",
    notePlaceholder: "例：このキャラは過小評価されている...",
    save: "保存",
    cancel: "キャンセル",
    charSearchFallback: "キャラが見つかりません。関連アニメからキャラを探せます：",
    charSearchTipChinese: "英語または日本語の名前で検索してみてください（例：エドワード・エルリック）",
    browseChars: "キャラを見る",
    year: "年",
    browseBySeasonHint: "年とシーズンを選んでアニメを閲覧、クリックでキャラ表示",
    genderAll: "全て",
    genderMale: "男",
    genderFemale: "女",
  },
} as const;

export type Locale = keyof typeof messages;
type MessageKey = keyof (typeof messages)["zh-TW"];

function detectLocale(): Locale {
  if (typeof navigator === "undefined") return "zh-TW";
  const lang = navigator.language || "";
  if (lang.startsWith("zh")) return "zh-TW";
  if (lang.startsWith("ja")) return "ja";
  return "en";
}

let currentLocale: Locale | null = null;

export function getLocale(): Locale {
  if (!currentLocale) currentLocale = detectLocale();
  return currentLocale;
}

export function t(key: MessageKey): string {
  const locale = getLocale();
  return messages[locale]?.[key] ?? messages["en"][key] ?? key;
}

/** 根據語系決定動畫標題顯示優先順序 */
export function getLocalizedTitle(title: { romaji: string; english: string | null; native: string | null; chinese?: string | null }): string {
  const locale = getLocale();
  if (locale === "zh-TW") return title.chinese || title.english || title.romaji;
  if (locale === "ja") return title.native || title.romaji;
  return title.english || title.romaji;
}
