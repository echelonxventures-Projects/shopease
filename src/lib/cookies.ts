import { cookies } from "next/headers";

export function getLocaleCookie(): Promise<string> {
  return cookies().then((c) => c.get("locale")?.value ?? "en");
}

export function getRegionCookie(): Promise<string> {
  return cookies().then((c) => c.get("region")?.value ?? "IN");
}

export function getLocaleRegion(): Promise<{ locale: string; region: string }> {
  return Promise.all([getLocaleCookie(), getRegionCookie()]).then(
    ([locale, region]) => ({ locale, region })
  );
}
