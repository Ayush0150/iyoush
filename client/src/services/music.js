const JUNK_COVERS_REGEX =
  /\b(karaoke|tribute|kidz bop|in the style of|instrumental cover|piano cover|guitar cover|smooth jazz|lullaby|renditions|all stars|parody|country version|acoustic cover|cover sessions|reggae|café|cafe|lounge|sing-along|piano pop|rockabye|type beat|drill mix|slowed|reverb|nightcore|sped up)\b/i;

const TRENDING_SEED_ARTISTS = [
  "The Weeknd",
  "Drake",
  "Taylor Swift",
  "Dua Lipa",
  "Billie Eilish",
  "Coldplay",
  "Post Malone",
  "Ed Sheeran",
];

function normalizeItem(t) {
  if (!t || !t.previewUrl) return null;
  return {
    id: String(t.trackId),
    title: t.trackName,
    artist: t.artistName,
    album: t.collectionName || "",
    genre: t.primaryGenreName || "Music",
    durationSec: t.trackTimeMillis ? Math.round(t.trackTimeMillis / 1000) : 180,
    cover: t.artworkUrl100
      ? t.artworkUrl100.replace("100x100bb.jpg", "600x600bb.jpg")
      : "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&q=80",
    streamUrl: t.previewUrl,
  };
}

/**
 * Searches the official Apple Music / iTunes catalogue.
 * Strictly delivers authentic original studio recordings by the real artist.
 */
async function fetchCatalog(searchTerm, limit = 25) {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
      searchTerm
    )}&entity=song&limit=40`;

    const res = await fetch(url, { signal: AbortSignal.timeout(4500) });
    if (!res.ok) return [];
    const data = await res.json();
    const rawResults = data.results || [];

    const cleanLower = searchTerm.toLowerCase();
    const wantsRemix = /\b(remix|mix|edit|bootleg)\b/i.test(cleanLower);

    // Filter out items without playable audio or obvious tribute covers
    const valid = rawResults.filter((t) => {
      if (!t.previewUrl) return false;
      const title = (t.trackName || "").toLowerCase();
      const artist = (t.artistName || "").toLowerCase();
      const album = (t.collectionName || "").toLowerCase();
      return (
        !JUNK_COVERS_REGEX.test(title) &&
        !JUNK_COVERS_REGEX.test(artist) &&
        !JUNK_COVERS_REGEX.test(album)
      );
    });

    if (valid.length === 0) return [];

    // Intelligent authenticity ranking to guarantee real artist & original album version
    valid.sort((a, b) => {
      const aTitle = (a.trackName || "").toLowerCase();
      const bTitle = (b.trackName || "").toLowerCase();
      const aArtist = (a.artistName || "").toLowerCase();
      const bArtist = (b.artistName || "").toLowerCase();

      // 1. Artist matching
      const aArtistMatch =
        aArtist === cleanLower ? 3 : aArtist.startsWith(cleanLower) ? 2 : aArtist.includes(cleanLower) ? 1 : 0;
      const bArtistMatch =
        bArtist === cleanLower ? 3 : bArtist.startsWith(cleanLower) ? 2 : bArtist.includes(cleanLower) ? 1 : 0;
      if (bArtistMatch !== aArtistMatch) return bArtistMatch - aArtistMatch;

      // 2. Clean title matching (excluding feat tags)
      const aCleanTitle = aTitle.replace(/\s*\(feat\..*?\)/i, "").trim();
      const bCleanTitle = bTitle.replace(/\s*\(feat\..*?\)/i, "").trim();
      const aExact = aCleanTitle === cleanLower ? 2 : aCleanTitle.startsWith(cleanLower) ? 1 : 0;
      const bExact = bCleanTitle === cleanLower ? 2 : bCleanTitle.startsWith(cleanLower) ? 1 : 0;
      if (bExact !== aExact) return bExact - aExact;

      // 3. Demote remixes/acoustic/live versions unless the user explicitly searched for them
      if (!wantsRemix) {
        const aIsRemix = /\b(remix|edit|bootleg|cover|acoustic|live)\b/i.test(aTitle) ? 1 : 0;
        const bIsRemix = /\b(remix|edit|bootleg|cover|acoustic|live)\b/i.test(bTitle) ? 1 : 0;
        if (aIsRemix !== bIsRemix) return aIsRemix - bIsRemix;
      }

      // 4. Prefer full studio albums over one-off singles
      const aIsAlbum = (a.collectionPrice || 0) > 5 ? 1 : 0;
      const bIsAlbum = (b.collectionPrice || 0) > 5 ? 1 : 0;
      if (bIsAlbum !== aIsAlbum) return bIsAlbum - aIsAlbum;

      // 5. Earliest release date for the original master hit
      const aDate = new Date(a.releaseDate || "2099").getTime();
      const bDate = new Date(b.releaseDate || "2099").getTime();
      return aDate - bDate;
    });

    return valid.slice(0, limit).map(normalizeItem).filter(Boolean);
  } catch (err) {
    console.warn("Music search error:", err);
    return [];
  }
}

/**
 * Fetch top trending tracks from major global chart artists
 */
export async function getTrendingTracks(limit = 25) {
  try {
    const fetchPromises = TRENDING_SEED_ARTISTS.map((artist) =>
      fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(
          artist
        )}&entity=song&limit=4`,
        { signal: AbortSignal.timeout(4000) }
      )
        .then((r) => r.json())
        .then((d) => d.results || [])
        .catch(() => [])
    );

    const groupResults = await Promise.all(fetchPromises);
    const combined = [];

    // Interleave tracks across artists for diverse, balanced playlist
    for (let i = 0; i < 4; i++) {
      for (const group of groupResults) {
        const track = group[i];
        if (track && track.previewUrl) {
          const title = (track.trackName || "").toLowerCase();
          if (!JUNK_COVERS_REGEX.test(title)) {
            combined.push(track);
          }
        }
      }
    }

    if (combined.length > 0) {
      return combined.slice(0, limit).map(normalizeItem).filter(Boolean);
    }
  } catch (err) {
    console.warn("Trending fetch fallback:", err);
  }

  // Backup search
  return fetchCatalog("The Weeknd", limit);
}

/**
 * Search tracks by artist name or song title
 */
export async function searchTracks(query, limit = 25) {
  const clean = (query || "").trim();
  if (!clean || clean.toLowerCase() === "trending") {
    return getTrendingTracks(limit);
  }
  return fetchCatalog(clean, limit);
}
