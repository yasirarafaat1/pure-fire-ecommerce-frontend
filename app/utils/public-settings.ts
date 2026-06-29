export type PublicSettings = {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  address: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    twitter?: string;
  };
  seo?: {
    title?: string;
    description?: string;
    logoUrl?: string;
    faviconUrl?: string;
  };
  instagramReels?: {
    enabled?: boolean;
    handle?: string;
  };
};

export const defaultPublicSettings: PublicSettings = {
  storeName: process.env.NEXT_PUBLIC_SITE_NAME || "Pure Fire",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@purefire.com",
  supportPhone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || "+91 79053 25078",
  address: process.env.NEXT_PUBLIC_SUPPORT_LOCATION || "India",
  socialLinks: {
    instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || "#",
    facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK || "#",
    youtube: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE || "#",
    twitter: process.env.NEXT_PUBLIC_SOCIAL_TWITTER || "#",
  },
  seo: {
    logoUrl: "",
    faviconUrl: "",
  },
  instagramReels: {
    enabled: false,
    handle: "",
  },
};

async function fetchWithTimeout(url: string, options?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    return await fetch(url, {
      ...options,
      signal: options?.signal || controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchPublicSettings() {
  const response = await fetchWithTimeout("/api/site-settings", { cache: "no-store" });
  if (!response.ok) throw new Error("Settings request failed");
  const payload = (await response.json()) as { data?: Partial<PublicSettings> };
  return {
    ...defaultPublicSettings,
    ...payload.data,
    socialLinks: {
      ...defaultPublicSettings.socialLinks,
      ...(payload.data?.socialLinks || {}),
    },
    seo: {
      ...defaultPublicSettings.seo,
      ...(payload.data?.seo || {}),
    },
    instagramReels: {
      ...defaultPublicSettings.instagramReels,
      ...(payload.data?.instagramReels || {}),
    },
  };
}
