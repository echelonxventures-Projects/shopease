import { NextRequest, NextResponse } from "next/server";
import { getGeocodingProvider, getMapApiKey } from "@/lib/map-config";

// POST /api/location — Geocode / Reverse Geocode
// Body: { action: "forward" | "reverse", query?: string, lat?: number, lng?: number }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "forward") {
      return forwardGeocode(body.query);
    }

    if (action === "reverse") {
      return reverseGeocode(body.lat, body.lng);
    }

    return NextResponse.json(
      { success: false, error: "Invalid action. Use 'forward' or 'reverse'." },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Forward geocoding: address → lat/lng
async function forwardGeocode(query: string) {
  if (!query || query.trim().length < 3) {
    return NextResponse.json(
      { success: false, error: "Query too short" },
      { status: 400 }
    );
  }

  const provider = getGeocodingProvider();

  if (provider === "google") {
    return googleForwardGeocode(query);
  }

  // Default: Nominatim (free, no API key)
  const params = new URLSearchParams({
    format: "json",
    q: query,
    limit: "1",
    addressdetails: "1",
  });

  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "ShopEase/1.0",
    },
  });

  if (!res.ok) {
    return NextResponse.json(
      { success: false, error: "Geocoding service unavailable" },
      { status: 502 }
    );
  }

  const data = await res.json();

  if (!data || data.length === 0) {
    return NextResponse.json(
      { success: false, error: "Location not found" },
      { status: 404 }
    );
  }

  const result = data[0];
  return NextResponse.json({
    success: true,
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
    address: result.display_name,
    components: result.address || {},
  });
}

// Reverse geocoding: lat/lng → address
async function reverseGeocode(lat: number, lng: number) {
  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      { success: false, error: "Invalid coordinates" },
      { status: 400 }
    );
  }

  const provider = getGeocodingProvider();

  if (provider === "google") {
    return googleReverseGeocode(lat, lng);
  }

  // Default: Nominatim (free, no API key)
  const params = new URLSearchParams({
    format: "json",
    lat: String(lat),
    lon: String(lng),
    addressdetails: "1",
  });

  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "ShopEase/1.0",
    },
  });

  if (!res.ok) {
    return NextResponse.json(
      { success: false, error: "Reverse geocoding service unavailable" },
      { status: 502 }
    );
  }

  const data = await res.json();

  if (data.error) {
    return NextResponse.json(
      { success: false, error: "Address not found" },
      { status: 404 }
    );
  }

  const addr = data.address || {};
  const address = [
    addr.road || addr.street || "",
    addr.neighbourhood || "",
    addr.suburb || addr.district || "",
    addr.city || addr.town || addr.village || "",
    addr.state || "",
    addr.postcode || "",
    addr.country || "",
  ].filter(Boolean).join(", ");

  return NextResponse.json({
    success: true,
    address,
    components: addr,
    formattedAddress: data.display_name,
  });
}

// Google Geocoding (forward)
async function googleForwardGeocode(query: string) {
  const apiKey = getMapApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "Google Maps API key not configured" },
      { status: 500 }
    );
  }

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", query);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  const data = await res.json();

  if (data.status !== "OK") {
    return NextResponse.json(
      { success: false, error: data.error_message || "Geocoding failed" },
      { status: 404 }
    );
  }

  const loc = data.results[0].geometry.location;
  return NextResponse.json({
    success: true,
    lat: loc.lat,
    lng: loc.lng,
    address: data.results[0].formatted_address,
    components: data.results[0].address_components || [],
  });
}

// Google Geocoding (reverse)
async function googleReverseGeocode(lat: number, lng: number) {
  const apiKey = getMapApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "Google Maps API key not configured" },
      { status: 500 }
    );
  }

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("latlng", `${lat},${lng}`);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  const data = await res.json();

  if (data.status !== "OK") {
    return NextResponse.json(
      { success: false, error: data.error_message || "Reverse geocoding failed" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    address: data.results[0].formatted_address,
    formattedAddress: data.results[0].formatted_address,
    components: data.results[0].address_components || [],
  });
}
