"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// ===================== PIN CODE AUTO-DETECT (Global) =====================

interface PinCodeResult {
  valid: boolean;
  message?: string;
  country?: string | null;
  state?: string | null;
  district?: string | null;
  city?: string | null;
  pincode?: string | null;
}

export async function resolvePinCode(pincode: string, countryCode?: string): Promise<PinCodeResult> {
  const trimmed = pincode.trim();
  if (trimmed.length < 3) {
    return { valid: false, message: "Enter at least 3 characters" };
  }

  // Try Nominatim (works globally — no API key needed)
  const params = new URLSearchParams({
    format: "jsonv2",
    postalcode: trimmed,
    addressdetails: "1",
    limit: "1",
  });

  // If country code is provided, narrow the search
  if (countryCode) {
    params.set("countrycodes", countryCode.toLowerCase());
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: {
          "Accept": "application/json",
          "User-Agent": "ShopEase/1.0",
        },
      },
    );

    if (!res.ok) {
      return { valid: false, message: "Lookup service unavailable" };
    }

    const data = await res.json();

    // India-specific: use postalpincode.in as fallback for better accuracy
    const isoCode = countryCode?.toUpperCase() || "";
    const isIndia = isoCode === "IN" || /^\d{6}$/.test(trimmed);

    if (isIndia && data.length === 0) {
      return resolvePinCodeIndia(trimmed);
    }

    if (!data || data.length === 0) {
      // Fallback to India API for 6-digit codes
      if (/^\d{6}$/.test(trimmed)) {
        return resolvePinCodeIndia(trimmed);
      }
      return { valid: false, message: "Pin code not found" };
    }

    const addr = data[0].address || {};
    return {
      valid: true,
      country: addr.country || data[0].display_name.split(", ").pop() || null,
      state: addr.state || addr.state_district || null,
      district: addr.county || addr.district || null,
      city: addr.city || addr.town || addr.village || addr.municipality || addr.county || null,
      pincode: addr.postcode || trimmed,
    };
  } catch {
    // Last resort: try India API for 6-digit codes
    if (/^\d{6}$/.test(trimmed)) {
      return resolvePinCodeIndia(trimmed);
    }
    return { valid: false, message: "Pin code lookup failed. Please fill manually." };
  }
}

// Fallback: India Post API for Indian PIN codes
async function resolvePinCodeIndia(pincode: string): Promise<PinCodeResult> {
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    if (!res.ok) return { valid: false, message: "Failed to fetch pin code data" };

    const data = await res.json();
    if (!Array.isArray(data) || !data[0] || data[0].Status !== "Success") {
      return { valid: false, message: "Pin code not found" };
    }

    const offices: Array<{ DeliveryStatus?: string; Country?: string; State?: string; District?: string; Name?: string; Pincode?: string }> = data[0].PostOffice;
    if (!offices || offices.length === 0) {
      return { valid: false, message: "No data for this pin code" };
    }

    // Pick the first delivery office, or fall back to first entry
    const main = offices.find((o) => o.DeliveryStatus === "Delivery") || offices[0];

    return {
      valid: true,
      country: main.Country || "India",
      state: main.State || null,
      district: main.District || null,
      city: main.Name || null,
      pincode: main.Pincode || pincode,
    };
  } catch {
    return { valid: false, message: "Pin code lookup failed" };
  }
}

// ===================== LOCATION DROPDOWN HELPERS =====================

export async function getCountries() {
  // From CountryProfile (enriched country data)
  const profiles = await prisma.countryProfile.findMany({
    where: { isActive: true },
    include: { location: true },
    orderBy: { location: { name: "asc" } },
  });

  return profiles.map((p) => ({
    id: p.locationId,
    code: p.isoCode,
    name: p.location.name,
    currency: p.currency,
    currencySymbol: p.currencySymbol,
    taxRate: Number(p.taxRate),
  }));
}

export async function getStatesForCountry(countryId: string) {
  const states = await prisma.location.findMany({
    where: { parentId: countryId, type: "STATE", isActive: true },
    orderBy: { name: "asc" },
  });

  return states.map((s) => ({
    id: s.id,
    code: s.code,
    name: s.name,
  }));
}

export async function getDistrictsForState(stateId: string) {
  const districts = await prisma.location.findMany({
    where: { parentId: stateId, type: "DISTRICT", isActive: true },
    orderBy: { name: "asc" },
  });

  return districts.map((d) => ({
    id: d.id,
    code: d.code,
    name: d.name,
  }));
}

export async function getCitiesForDistrict(districtId: string) {
  const cities = await prisma.location.findMany({
    where: { parentId: districtId, type: "CITY", isActive: true },
    orderBy: { name: "asc" },
  });

  return cities.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
  }));
}

// Search locations by name (for city search)
export async function searchLocations(query: string, type?: string) {
  const where: Prisma.LocationWhereInput = {
    name: { contains: query, mode: "insensitive" },
    isActive: true,
  };
  if (type) where.type = type as Prisma.LocationWhereInput["type"];

  const results = await prisma.location.findMany({
    where,
    orderBy: { name: "asc" },
    take: 20,
  });

  return results.map((loc) => ({
    id: loc.id,
    code: loc.code,
    name: loc.name,
    type: loc.type,
  }));
}

// ===================== ID TYPE HELPERS =====================

interface IdTypeOption {
  value: string;
  label: string;
  formatHint: string;
}

const COUNTRY_ID_TYPES: Record<string, { types: IdTypeOption[] }> = {
  IN: {
    types: [
      { value: "GSTIN", label: "GSTIN", formatHint: "XX XXXXX XXXX X ZX9 (15 chars)" },
      { value: "PAN", label: "PAN", formatHint: "AAAAA9999A (10 chars)" },
    ],
  },
  US: {
    types: [
      { value: "EIN", label: "EIN (Employer ID)", formatHint: "XX-XXXXXXX" },
      { value: "TAX_ID", label: "Tax ID", formatHint: "3-20 alphanumeric" },
    ],
  },
  GB: {
    types: [
      { value: "VAT", label: "VAT Number", formatHint: "GB XXXXXXXXX" },
      { value: "TAX_ID", label: "Tax ID", formatHint: "3-20 alphanumeric" },
    ],
  },
  DE: {
    types: [
      { value: "VAT", label: "VAT (USt-IdNr.)", formatHint: "DE XXXXXXXXX" },
      { value: "TAX_ID", label: "Tax ID", formatHint: "3-20 alphanumeric" },
    ],
  },
  FR: {
    types: [
      { value: "VAT", label: "VAT (TVA)", formatHint: "FR XX XXXXXXXXX" },
      { value: "TAX_ID", label: "Tax ID", formatHint: "3-20 alphanumeric" },
    ],
  },
  AU: {
    types: [
      { value: "ABN", label: "ABN (Australian Business)", formatHint: "11 digits" },
      { value: "TAX_ID", label: "Tax ID", formatHint: "3-20 alphanumeric" },
    ],
  },
  CA: {
    types: [
      { value: "TAX_ID", label: "BN / GST No.", formatHint: "XXXXX XXXXX RT001" },
    ],
  },
  SG: {
    types: [
      { value: "TAX_ID", label: "GST Reg No.", formatHint: "XXXXXXX XXXX" },
    ],
  },
  MY: {
    types: [
      { value: "SST", label: "SST (Sales & Service Tax)", formatHint: "XXXXXX XXXXXX" },
      { value: "TAX_ID", label: "Tax ID", formatHint: "3-20 alphanumeric" },
    ],
  },
};

export async function getIdTypesForCountry(countryIsoCode: string) {
  const match = COUNTRY_ID_TYPES[countryIsoCode.toUpperCase()];
  return match?.types || [
    { value: "BUSINESS_REG", label: "Business Registration", formatHint: "4-20 alphanumeric" },
    { value: "TAX_ID", label: "Tax ID", formatHint: "3-20 alphanumeric" },
    { value: "OTHER", label: "Other", formatHint: "3-50 chars" },
  ];
}
