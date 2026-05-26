"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getCountriesForDropdown } from "@/server/actions/localization-actions";
import { getSubLocations } from "@/server/actions/location-actions";
import { ChevronDown, X, Search, Loader2, MapPin, Building2 } from "lucide-react";

interface LocationSelectorProps {
  countryId?: string;
  stateId?: string;
  districtId?: string;
  villageId?: string;
  onChange: (values: { countryId: string; stateId: string; districtId: string; villageId: string; countryName?: string; stateName?: string; districtName?: string; villageName?: string }) => void;
  showCountry?: boolean;
  showState?: boolean;
  showDistrict?: boolean;
  showVillage?: boolean;
  errors?: Record<string, string>;
}

interface LocationOption {
  id: string;
  name: string;
  code?: string;
  type?: string;
}

const POLL_INTERVAL = 30_000;

// ---- Searchable Dropdown (for Country/State) ----

function SearchableSelect({
  label,
  options,
  selectedId,
  selectedName,
  loading,
  placeholder,
  error,
  onSelect,
  onClear,
  disabled,
  required,
}: {
  label: string;
  options: LocationOption[];
  selectedId?: string;
  selectedName?: string;
  loading?: boolean;
  placeholder?: string;
  error?: string;
  onSelect: (id: string) => void;
  onClear?: () => void;
  disabled?: boolean;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
        setHighlightedIdx(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setHighlightedIdx(-1);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const filtered = options.filter((o) =>
    o.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
      setHighlightedIdx(-1);
      return;
    }
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIdx((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIdx((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIdx >= 0 && highlightedIdx < filtered.length) {
        onSelect(filtered[highlightedIdx].id);
        setOpen(false);
        setQuery("");
        setHighlightedIdx(-1);
      }
    }
  }, [open, filtered, highlightedIdx, onSelect]);

  useEffect(() => {
    if (highlightedIdx >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-option]");
      items[highlightedIdx]?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIdx]);

  const isSelected = selectedId && selectedName;

  return (
    <div ref={ref} className="relative">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <button
        type="button"
        disabled={disabled || loading || options.length === 0}
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`mt-1 w-full flex items-center justify-between px-3 py-2.5 border rounded-lg text-sm transition-all
          ${error
            ? "border-red-400 bg-red-50"
            : isSelected
              ? "border-blue-400 bg-blue-50 hover:border-blue-500"
              : "border-gray-300 bg-white hover:border-gray-400"
          }
          ${disabled || loading || options.length === 0
            ? "opacity-50 cursor-not-allowed bg-gray-50"
            : "cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
          }`}
      >
        {loading ? (
          <span className="flex items-center gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading...
          </span>
        ) : isSelected ? (
          <span className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-medium text-xs truncate">
              {selectedName}
            </span>
          </span>
        ) : (
          <span className="text-gray-400">{placeholder || `Select ${label.toLowerCase()}`}</span>
        )}
        {!loading && (
          <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-180" : "text-gray-400"}`} />
        )}
        {loading && (
          <Loader2 className="w-4 h-4 text-gray-400 animate-spin shrink-0" />
        )}
      </button>

      {error && <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>}

      {open && !disabled && !loading && options.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden" role="listbox">
          {/* Search bar */}
          {options.length > 5 && (
            <div className="flex items-center px-3 py-2 border-b bg-gray-50">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setHighlightedIdx(0); }}
                onKeyDown={handleKeyDown}
                placeholder="Type to search..."
                className="w-full ml-2 text-sm bg-transparent outline-none"
              />
              {query && (
                <button type="button" onClick={() => { setQuery(""); inputRef.current?.focus(); }} className="ml-1 text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Options */}
          <div ref={listRef} className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-sm text-gray-400 text-center">
                No matches for &quot;{query}&quot;
              </div>
            ) : (
              filtered.map((opt, idx) => (
                <div
                  key={opt.id}
                  data-option
                  role="option"
                  aria-selected={opt.id === selectedId}
                  className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between transition-colors
                    ${opt.id === selectedId
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : idx === highlightedIdx
                        ? "bg-blue-100 text-blue-800"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  onClick={() => {
                    onSelect(opt.id);
                    setOpen(false);
                    setQuery("");
                    setHighlightedIdx(-1);
                  }}
                  onMouseEnter={() => setHighlightedIdx(idx)}
                >
                  <span className="truncate">{opt.name}</span>
                  <span className="flex items-center gap-1 shrink-0">
                    {opt.code && <span className="text-xs text-gray-400 font-mono">{opt.code}</span>}
                    {opt.id === selectedId && (
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Clear selection */}
          {selectedId && (
            <div className="border-t">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear?.();
                  setOpen(false);
                  setQuery("");
                  setHighlightedIdx(-1);
                }}
                className="w-full text-center px-3 py-2 text-xs text-red-500 hover:bg-red-50 font-medium transition-colors flex items-center justify-center gap-1"
              >
                <X className="w-3 h-3" /> Clear selection
              </button>
            </div>
          )}

          {options.length > 5 && (
            <div className="border-t bg-gray-50 px-3 py-1.5 text-xs text-gray-400 text-center">
              {filtered.length} of {options.length} results
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---- Free-text search input (for District/City when no sub-location data exists) ----

function FreeTextSearch({
  label,
  value,
  onChange,
  placeholder,
  error,
  required,
}: {
  label: string;
  value: string;
  onChange: (name: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Search the database as user types
  const doSearch = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const { searchLocations } = await import("@/server/actions/location-actions");
      const data = await searchLocations(q);
      setResults(data.map((l: any) => ({ id: l.id, name: l.name, code: l.code, type: l.type })));
      setOpen(true);
      setHighlightedIdx(-1);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, []);

  const handleChange = useCallback((val: string) => {
    setQuery(val);
    onChange(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 200);
  }, [onChange, doSearch]);

  const handleSelect = useCallback((opt: LocationOption) => {
    setQuery(opt.name);
    onChange(opt.name);
    setOpen(false);
    setResults([]);
  }, [onChange]);

  return (
    <div ref={ref} className="relative">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className={`mt-1 flex items-center border rounded-lg overflow-hidden transition-all
        ${error ? "border-red-400 bg-red-50" : "border-gray-300 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100"}
      `}>
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && open && results.length > 0) {
              setHighlightedIdx((prev) => (prev < results.length - 1 ? prev + 1 : 0));
            } else if (e.key === "ArrowUp" && open && results.length > 0) {
              setHighlightedIdx((prev) => (prev > 0 ? prev - 1 : results.length - 1));
            } else if (e.key === "Enter" && open && highlightedIdx >= 0) {
              handleSelect(results[highlightedIdx]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={placeholder || `Type to search ${label.toLowerCase()}...`}
          className="flex-1 px-3 py-2.5 text-sm bg-transparent outline-none"
        />
        {loading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin mr-2" />}
        {!loading && query && (
          <button type="button" onClick={() => { setQuery(""); onChange(""); setResults([]); }} className="mr-2 text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>}

      {/* Search results dropdown */}
      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden" role="listbox">
          <div className="max-h-48 overflow-y-auto">
            {results.map((opt, idx) => (
              <div
                key={opt.id}
                role="option"
                className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between transition-colors
                  ${idx === highlightedIdx ? "bg-blue-100 text-blue-800" : "text-gray-700 hover:bg-gray-50"}
                `}
                onClick={() => handleSelect(opt)}
                onMouseEnter={() => setHighlightedIdx(idx)}
              >
                <span className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{opt.name}</span>
                </span>
                <span className="flex items-center gap-1 shrink-0">
                  {opt.code && <span className="text-xs text-gray-400 font-mono">{opt.code}</span>}
                  {opt.type && <span className="text-xs text-blue-400 bg-blue-50 px-1.5 py-0.5 rounded">{opt.type}</span>}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t bg-gray-50 px-3 py-1.5 text-xs text-gray-400 text-center">
            {results.length} results — or press Enter to use &quot;{query}&quot;
          </div>
        </div>
      )}

      {/* Helper text */}
      {!error && (
        <p className="text-xs text-gray-400 mt-1">
          Type to search — or enter your {label.toLowerCase()} manually
        </p>
      )}
    </div>
  );
}

// ---- Main Cascading Selector ----

export function LocationCascadingSelector({
  countryId,
  stateId,
  districtId,
  villageId,
  onChange,
  showCountry = true,
  showState = true,
  showDistrict = true,
  showVillage = true,
  errors = {},
}: LocationSelectorProps) {
  const [countries, setCountries] = useState<LocationOption[]>([]);
  const [states, setStates] = useState<LocationOption[]>([]);
  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [villages, setVillages] = useState<LocationOption[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [countriesError, setCountriesError] = useState<string | null>(null);
  const [hasDistrictData, setHasDistrictData] = useState(false);
  const [hasVillageData, setHasVillageData] = useState(false);

  // Fetch countries — with polling for auto-sync
  useEffect(() => {
    let cancelled = false;
    const fetch = () => {
      getCountriesForDropdown()
        .then((data) => {
          if (cancelled) return;
          setCountries(data.map((c: any) => ({ id: c.id, name: `${c.currencySymbol} ${c.name} (${c.code})`, code: c.code, type: "COUNTRY" })));
          setCountriesLoading(false);
          setCountriesError(null);
        })
        .catch((err) => {
          if (cancelled) return;
          console.error("[LocationSelector] Failed to load countries:", err);
          setCountriesLoading(false);
          setCountriesError("Failed to load countries. Refresh to retry.");
        });
    };
    fetch();
    const interval = setInterval(fetch, POLL_INTERVAL);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Fetch states when country changes — with polling
  useEffect(() => {
    let cancelled = false;
    if (!countryId) { setStates([]); return; }

    const fetch = () => {
      setLoadingStates(true);
      getSubLocations(countryId)
        .then((locs) => {
          if (cancelled) return;
          setStates(locs.map((l: any) => ({ id: l.id, name: l.name, code: l.code, type: l.type })));
          setLoadingStates(false);
        })
        .catch(() => {
          if (cancelled) return;
          setStates([]);
          setLoadingStates(false);
        });
    };
    fetch();
    const interval = setInterval(fetch, POLL_INTERVAL);
    return () => { cancelled = true; clearInterval(interval); };
  }, [countryId]);

  // Fetch districts when state changes — check if sub-location data exists
  useEffect(() => {
    let cancelled = false;
    if (!stateId) { setDistricts([]); setHasDistrictData(false); return; }

    const fetch = () => {
      setLoadingDistricts(true);
      getSubLocations(stateId)
        .then((locs) => {
          if (cancelled) return;
          const mapped = locs.map((l: any) => ({ id: l.id, name: l.name, code: l.code, type: l.type }));
          if (mapped.length > 0) {
            setDistricts(mapped);
            setHasDistrictData(true);
          } else {
            setDistricts([]);
            setHasDistrictData(false);
          }
          setLoadingDistricts(false);
        })
        .catch(() => {
          if (cancelled) return;
          setDistricts([]);
          setHasDistrictData(false);
          setLoadingDistricts(false);
        });
    };
    fetch();
    const interval = setInterval(fetch, POLL_INTERVAL);
    return () => { cancelled = true; clearInterval(interval); };
  }, [stateId]);

  // Fetch villages when district changes — check if sub-location data exists
  useEffect(() => {
    let cancelled = false;
    if (!districtId) { setVillages([]); setHasVillageData(false); return; }

    const fetch = () => {
      setLoadingVillages(true);
      getSubLocations(districtId)
        .then((locs) => {
          if (cancelled) return;
          const mapped = locs.map((l: any) => ({ id: l.id, name: l.name, code: l.code, type: l.type }));
          if (mapped.length > 0) {
            setVillages(mapped);
            setHasVillageData(true);
          } else {
            setVillages([]);
            setHasVillageData(false);
          }
          setLoadingVillages(false);
        })
        .catch(() => {
          if (cancelled) return;
          setVillages([]);
          setHasVillageData(false);
          setLoadingVillages(false);
        });
    };
    fetch();
    const interval = setInterval(fetch, POLL_INTERVAL);
    return () => { cancelled = true; clearInterval(interval); };
  }, [districtId]);

  const handleCountry = useCallback((id: string) => {
    const c = countries.find((c) => c.id === id);
    const name = c?.name.replace(/^[₹$£€¥₣₡₦₩]\s*/, "").replace(/\s*\(.*\)$/, "");
    onChange({ countryId: id, stateId: "", districtId: "", villageId: "", ...(name && { countryName: name }) });
  }, [countries, onChange]);

  const handleState = useCallback((id: string) => {
    const name = states.find((s) => s.id === id)?.name;
    onChange({ countryId, stateId: id, districtId: "", villageId: "", ...(name && { stateName: name }) });
  }, [countryId, states, onChange]);

  const handleDistrict = useCallback((id: string) => {
    const name = districts.find((d) => d.id === id)?.name;
    onChange({ countryId, stateId, districtId: id, villageId: "", ...(name && { districtName: name }) });
  }, [countryId, stateId, districts, onChange]);

  const handleVillage = useCallback((id: string) => {
    const name = villages.find((v) => v.id === id)?.name;
    onChange({ countryId, stateId, districtId, villageId: id, ...(name && { villageName: name }) });
  }, [countryId, stateId, districtId, villages, onChange]);

  const handleClearCountry = useCallback(() => {
    onChange({ countryId: "", stateId: "", districtId: "", villageId: "" });
  }, [onChange]);

  const handleClearState = useCallback(() => {
    onChange({ countryId, stateId: "", districtId: "", villageId: "" });
  }, [countryId, onChange]);

  const handleClearDistrict = useCallback(() => {
    onChange({ countryId, stateId, districtId: "", villageId: "" });
  }, [countryId, stateId, onChange]);

  const handleClearVillage = useCallback(() => {
    onChange({ countryId, stateId, districtId, villageId: "" });
  }, [countryId, stateId, districtId, onChange]);

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center gap-2 pb-3 border-b">
        <MapPin className="w-5 h-5 text-blue-600" />
        <h3 className="text-sm font-bold text-gray-800">Delivery Location</h3>
        <span className="ml-auto text-xs text-gray-400">Auto-sync every 30s</span>
      </div>

      {countriesError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
          {countriesError}
        </div>
      )}

      {/* Country — always dropdown (has real data) */}
      {showCountry && (
        <SearchableSelect
          label="Country / Region"
          placeholder="Search and select country..."
          options={countries}
          selectedId={countryId}
          selectedName={countries.find((c) => c.id === countryId)?.name}
          loading={countriesLoading}
          error={errors.countryId}
          onSelect={handleCountry}
          onClear={handleClearCountry}
        />
      )}

      {/* State — always dropdown (has real data) */}
      {showState && countryId && (
        <SearchableSelect
          label="State / Province"
          placeholder="Search state or province..."
          options={states}
          selectedId={stateId}
          selectedName={states.find((s) => s.id === stateId)?.name}
          loading={loadingStates}
          error={errors.stateId}
          required
          onSelect={handleState}
          onClear={handleClearState}
          disabled={!countryId}
        />
      )}

      {/* District — dropdown if data exists, otherwise free-text search */}
      {showDistrict && stateId && hasDistrictData && (
        <SearchableSelect
          label="District / City"
          placeholder="Search district or city..."
          options={districts}
          selectedId={districtId}
          selectedName={districts.find((d) => d.id === districtId)?.name}
          loading={loadingDistricts}
          error={errors.districtId}
          required
          onSelect={handleDistrict}
          onClear={handleClearDistrict}
          disabled={!stateId}
        />
      )}

      {showDistrict && stateId && !hasDistrictData && (
        <FreeTextSearch
          label="District / City"
          value={districtId}
          onChange={(name) => onChange({ countryId, stateId, districtId: name, villageId: "", districtName: name })}
          placeholder="Type to search or enter your city/district..."
          error={errors.districtId}
          required
        />
      )}

      {/* Village — dropdown if data exists, otherwise free-text search */}
      {showVillage && districtId && hasVillageData && (
        <SearchableSelect
          label="Village / Locality"
          placeholder="Search village or locality..."
          options={villages}
          selectedId={villageId}
          selectedName={villages.find((v) => v.id === villageId)?.name}
          loading={loadingVillages}
          error={errors.villageId}
          onSelect={handleVillage}
          onClear={handleClearVillage}
          disabled={!districtId}
        />
      )}

      {showVillage && districtId && !hasVillageData && (
        <FreeTextSearch
          label="Village / Locality"
          value={villageId}
          onChange={(name) => onChange({ countryId, stateId, districtId, villageId: name, villageName: name })}
          placeholder="Type to search or enter your locality..."
          error={errors.villageId}
        />
      )}

      {/* Selection summary */}
      {(countryId || stateId || districtId || villageId) && (
        <div className="pt-2 border-t">
          <p className="text-xs text-gray-500 font-medium mb-1">Selected:</p>
          <div className="flex flex-wrap gap-1">
            {countryId && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                {countries.find((c) => c.id === countryId)?.name.replace(/^[₹$£€¥₣₡₦₩]\s*/, "").replace(/\s*\(.*\)$/, "")}
              </span>
            )}
            {stateId && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                {states.find((s) => s.id === stateId)?.name}
              </span>
            )}
            {districtId && !hasDistrictData && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                {districtId}
              </span>
            )}
            {districtId && hasDistrictData && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                {districts.find((d) => d.id === districtId)?.name}
              </span>
            )}
            {villageId && !hasVillageData && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                {villageId}
              </span>
            )}
            {villageId && hasVillageData && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                {villages.find((v) => v.id === villageId)?.name}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
