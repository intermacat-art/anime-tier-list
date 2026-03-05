const ANILIST_API = "https://graphql.anilist.co";

export interface AnilistMedia {
  id: number;
  title: {
    romaji: string;
    english: string | null;
    native: string | null;
  };
  coverImage: {
    large: string;
    medium: string;
  };
  format: string | null;
  seasonYear: number | null;
  season: string | null;
}

export interface AnilistCharacter {
  id: number;
  name: {
    full: string;
    native: string | null;
  };
  image: {
    large: string;
    medium: string;
  };
  media?: {
    nodes: { title: { romaji: string } }[];
  };
}

async function queryAnilist<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(ANILIST_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`AniList API error: ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message ?? "AniList query failed");
  return json.data;
}

export async function searchAnime(search: string, page = 1): Promise<{ media: AnilistMedia[]; hasNext: boolean }> {
  const query = `
    query ($search: String, $page: Int) {
      Page(page: $page, perPage: 20) {
        pageInfo { hasNextPage }
        media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
          id
          title { romaji english native }
          coverImage { large medium }
          format
          seasonYear
          season
        }
      }
    }
  `;
  const data = await queryAnilist<{ Page: { media: AnilistMedia[]; pageInfo: { hasNextPage: boolean } } }>(query, { search, page });
  return { media: data.Page.media, hasNext: data.Page.pageInfo.hasNextPage };
}

export async function getSeasonalAnime(year: number, season: string, page = 1): Promise<{ media: AnilistMedia[]; hasNext: boolean }> {
  const query = `
    query ($season: MediaSeason, $seasonYear: Int, $page: Int) {
      Page(page: $page, perPage: 20) {
        pageInfo { hasNextPage }
        media(season: $season, seasonYear: $seasonYear, type: ANIME, sort: POPULARITY_DESC) {
          id
          title { romaji english native }
          coverImage { large medium }
          format
          seasonYear
          season
        }
      }
    }
  `;
  const data = await queryAnilist<{ Page: { media: AnilistMedia[]; pageInfo: { hasNextPage: boolean } } }>(query, { season: season.toUpperCase(), seasonYear: year, page });
  return { media: data.Page.media, hasNext: data.Page.pageInfo.hasNextPage };
}

export async function getCharactersByMedia(mediaId: number): Promise<AnilistCharacter[]> {
  const query = `
    query ($mediaId: Int) {
      Media(id: $mediaId) {
        characters(sort: ROLE, perPage: 25) {
          nodes {
            id
            name { full native }
            image { large medium }
          }
        }
      }
    }
  `;
  const data = await queryAnilist<{ Media: { characters: { nodes: AnilistCharacter[] } } }>(query, { mediaId });
  return data.Media.characters.nodes;
}

export async function searchCharacters(search: string, page = 1): Promise<{ characters: AnilistCharacter[]; hasNext: boolean }> {
  const query = `
    query ($search: String, $page: Int) {
      Page(page: $page, perPage: 20) {
        pageInfo { hasNextPage }
        characters(search: $search, sort: FAVOURITES_DESC) {
          id
          name { full native }
          image { large medium }
          media(perPage: 1) {
            nodes { title { romaji } }
          }
        }
      }
    }
  `;
  const data = await queryAnilist<{ Page: { characters: AnilistCharacter[]; pageInfo: { hasNextPage: boolean } } }>(query, { search, page });
  return { characters: data.Page.characters, hasNext: data.Page.pageInfo.hasNextPage };
}
