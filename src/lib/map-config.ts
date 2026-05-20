export type MapProvider = 'leaflet' | 'google' | 'mapbox';
export type GeocodingProvider = 'nominatim' | 'google';

export function getMapProvider(): MapProvider {
  return (process.env.NEXT_PUBLIC_MAP_PROVIDER as MapProvider) || 'leaflet';
}

export function getGeocodingProvider(): GeocodingProvider {
  return (process.env.NEXT_PUBLIC_GEOCODING_PROVIDER as GeocodingProvider) || 'nominatim';
}

export function getMapApiKey(): string | null {
  const provider = getMapProvider();
  if (provider === 'google') return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || null;
  if (provider === 'mapbox') return process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || null;
  return null;
}
