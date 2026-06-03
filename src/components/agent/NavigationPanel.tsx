"use client";

interface NavigationPanelProps {
  address: string;
  lat?: number;
  lng?: number;
  distanceKm?: number;
  etaMinutes?: number;
}

function buildGoogleMapsUrl(address: string, lat?: number, lng?: number): string {
  if (lat != null && lng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=driving`;
}

function buildAppleMapsUrl(address: string, lat?: number, lng?: number): string {
  if (lat != null && lng != null) {
    return `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;
  }
  return `https://maps.apple.com/?daddr=${encodeURIComponent(address)}&dirflg=d`;
}

export function NavigationPanel({
  address,
  lat,
  lng,
  distanceKm,
  etaMinutes,
}: NavigationPanelProps) {
  const googleUrl = buildGoogleMapsUrl(address, lat, lng);
  const appleUrl = buildAppleMapsUrl(address, lat, lng);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold">Navigation</h2>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
            {address}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            {distanceKm != null && (
              <span>Distance: {distanceKm} km</span>
            )}
            {etaMinutes != null && (
              <span>ETA: {etaMinutes < 1 ? "< 1" : etaMinutes} min</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <a
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-lg bg-blue-600 px-3 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Open in Google Maps
        </a>
        <a
          href={appleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Apple Maps
        </a>
      </div>
    </section>
  );
}
