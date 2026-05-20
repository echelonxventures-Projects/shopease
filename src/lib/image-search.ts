// Free image search using Unsplash API (free tier: 50 requests/hour)
// Alternative: Cloudinary (free tier) for production
// Get free API key: https://unsplash.com/oauth/applications

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const UNSPLASH_BASE = "https://api.unsplash.com";

export async function searchImages(query: string, page: number = 1, perPage: number = 10) {
  if (!UNSPLASH_ACCESS_KEY) {
    // Fallback: return empty results
    return { results: [], total: 0, totalPages: 0 };
  }

  try {
    const url = new URL(`${UNSPLASH_BASE}/search/photos`);
    url.searchParams.set("query", query);
    url.searchParams.set("page", page.toString());
    url.searchParams.set("per_page", perPage.toString());

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
    });

    const data = await res.json();

    return {
      results: (data.results || []).map((img: any) => ({
        id: img.id,
        url: img.urls?.regular,
        thumb: img.urls?.thumb,
        full: img.urls?.full,
        alt: img.alt_description,
        photographer: img.user?.name,
      })),
      total: data.total || 0,
      totalPages: data.total_pages || 0,
    };
  } catch {
    return { results: [], total: 0, totalPages: 0 };
  }
}

export async function getRandomImage(query?: string) {
  if (!UNSPLASH_ACCESS_KEY) return null;

  try {
    const url = new URL(`${UNSPLASH_BASE}/photos/random`);
    if (query) url.searchParams.set("query", query);
    url.searchParams.set("w", "800");
    url.searchParams.set("h", "800");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
    });

    const data = await res.json();

    return {
      url: data.urls?.regular,
      thumb: data.urls?.thumb,
      photographer: data.user?.name,
    };
  } catch {
    return null;
  }
}
