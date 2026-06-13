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
};

export async function fetchPublicSettings() {
  const response = await fetch("/api/site-settings", { cache: "no-store" });
  if (!response.ok) throw new Error("Settings request failed");
  const payload = (await response.json()) as { data?: Partial<PublicSettings> };
  return {
    ...defaultPublicSettings,
    ...payload.data,
    socialLinks: {
      ...defaultPublicSettings.socialLinks,
      ...(payload.data?.socialLinks || {}),
    },
  };
}
