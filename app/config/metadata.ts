/**
 * Centralized SEO metadata configuration
 * Provides consistent branding and defaults across the site
 */

export const siteConfig = {
  name: "Pure Fire",
  description:
    "Quality-first everyday wear. Minimal, comfortable, and made to last.",
  tagline: "Premium everyday essentials for the modern lifestyle.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://pure-fire.vercel.app",
  ogImage: "/og-image.png", // 1200x630px recommended
  logoImage: "/logo.png",
  twitterHandle: "@purefire", // Without @, optional
  author: "Pure Fire",
  keywords: [
    "clothing",
    "everyday wear",
    "minimal fashion",
    "comfortable apparel",
    "quality tshirts",
  ],
};

export const defaultMetadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.author }],
  creator: siteConfig.author,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [
      {
        url: `${siteConfig.url}${siteConfig.ogImage}`,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [`${siteConfig.url}${siteConfig.ogImage}`],
    creator: siteConfig.twitterHandle ? `@${siteConfig.twitterHandle}` : undefined,
  },
  alternates: {
    canonical: siteConfig.url,
  },
};
