// Free IP geolocation using ip-api.com (no API key required)
// Free tier: 45 requests/minute, no signup required
// For production with higher volume, upgrade to ip-api.com Pro or use ipgeolocation.io (free tier)

interface GeoLocation {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  lat: number;
  lon: number;
  isp: string;
  as: string;
}

export async function getGeoByIp(ip: string): Promise<GeoLocation | null> {
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await res.json();

    if (data.status !== "success") return null;

    return {
      country: data.country,
      countryCode: data.countryCode,
      region: data.regionName,
      city: data.city,
      lat: data.lat,
      lon: data.lon,
      isp: data.isp,
      as: data.as,
    };
  } catch {
    return null;
  }
}

export async function getGeoForRequest(req: Request): Promise<GeoLocation | null> {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  return getGeoByIp(ip);
}
