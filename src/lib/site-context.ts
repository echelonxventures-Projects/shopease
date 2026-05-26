// Site context passed through the request lifecycle
export interface SiteContext {
  site: {
    id: string;
    name: string;
    slug: string;
    domain: string | null;
    subdomain: string | null;
    status: string;
    isDefault: boolean;
    logo: string | null;
    favicon: string | null;
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    theme: unknown;
    settings: unknown;
    description: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
  };
  domains: { id: string; hostname: string; type: string; sslStatus: string }[];
  branding: {
    logo: string | null;
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };
  settings: {
    taxInclusive: boolean;
    currency: string;
    maintenanceMode: boolean;
  };
}
