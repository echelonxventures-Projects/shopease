/**
 * Haversine distance between two lat/lng points in kilometers.
 * Accuracy: ~0.5% for most earth distances.
 */
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if a point is within a circle (circular geofence).
 */
export function isPointInCircle(
  pointLat: number, pointLng: number,
  centerLat: number, centerLng: number,
  radiusKm: number
): boolean {
  return haversineDistance(pointLat, pointLng, centerLat, centerLng) <= radiusKm;
}

/**
 * Ray-casting algorithm: check if point is inside a polygon.
 * polygon: [[lat, lng], [lat, lng], ...] (closed or open)
 */
export function isPointInPolygon(
  pointLat: number, pointLng: number,
  polygon: [number, number][]
): boolean {
  let inside = false;
  const points = polygon.length;
  for (let i = 0, j = points - 1; i < points; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect = ((yi > pointLng) !== (yj > pointLng)) &&
      (pointLat < (xj - xi) * (pointLng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Get bounding box [minLat, minLng, maxLat, maxLng] for a radius.
 * Used to pre-filter DB queries before precise distance checks.
 */
export function getBoundingBox(
  lat: number, lng: number, radiusKm: number
): { minLat: number; minLng: number; maxLat: number; maxLng: number } {
  const latDeg = radiusKm / 111.32;
  const lngDeg = radiusKm / (111.32 * Math.cos(toRad(lat)));
  return {
    minLat: lat - latDeg,
    minLng: lng - lngDeg,
    maxLat: lat + latDeg,
    maxLng: lng + lngDeg,
  };
}

/**
 * Estimate travel time in minutes given distance and average speed.
 * For quick commerce, avg speed is 20-30 km/h in urban areas.
 */
export function estimatedTime(distanceKm: number, avgSpeedKmh: number = 25): number {
  return Math.ceil((distanceKm / avgSpeedKmh) * 60);
}

/**
 * Encode polyline points as JSON for route visualization.
 */
export function encodePolyline(points: { lat: number; lng: number }[]): string {
  return JSON.stringify(points.map(p => [p.lat, p.lng]));
}

export interface NearestItem<T> {
  item: T;
  distanceKm: number;
}

/**
 * Find nearest items from a list by haversine distance.
 * Returns sorted array with distance attached.
 */
export function findNearest<T extends { lat: number; lng: number }>(
  pointLat: number, pointLng: number,
  items: T[], limit: number = 5
): NearestItem<T>[] {
  return items
    .map((item) => ({
      item,
      distanceKm: haversineDistance(pointLat, pointLng, item.lat, item.lng),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
