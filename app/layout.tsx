import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Geist_Mono, Manrope } from "next/font/google";
import "./globals.css";
import "lenis/dist/lenis.css";
import CloseCursorOverlay from "./components/CloseCursorOverlay";
import PublicFrame from "./components/PublicFrame";
import SmoothScrollProvider from "./components/SmoothScrollProvider";
import { defaultMetadata, siteConfig } from "./config/metadata";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const bodoniModa = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

/**
 * Global metadata configuration
 * Applies to all pages unless overridden by page-specific metadata
 */
async function getAdminFaviconUrl() {
  const rawBase =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://purefire-backend.onrender.com";
  const trimmedBase = rawBase.trim();
  const base = /^https?:\/\//i.test(trimmedBase)
    ? trimmedBase
    : /^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(trimmedBase)
      ? `http://${trimmedBase}`
      : `https://${trimmedBase}`;

  try {
    const response = await fetch(`${base.replace(/\/$/, "")}/admin/settings/public`, {
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) return "";
    const payload = (await response.json()) as { data?: { seo?: { faviconUrl?: string } } };
    return payload.data?.seo?.faviconUrl || "";
  } catch {
    return "";
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const faviconUrl = await getAdminFaviconUrl();
  return {
    ...defaultMetadata,
    metadataBase: siteConfig.url ? new URL(siteConfig.url) : undefined,
    manifest: "/favicon_io/site.webmanifest",
    icons: faviconUrl
      ? { icon: faviconUrl, shortcut: faviconUrl, apple: faviconUrl }
      : undefined,
  formatDetection: {
    telephone: true,
    email: true,
  },
  verification: {
    google: (() => {
      const codes = [
        process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
        process.env.NEXT_PUBLIC_GOOGLE_MERCHANT_VERIFICATION ??
          "uni4iST7WXBBAu_BYMDgeO12xKGt8NYS4DD6gRb1Xt0",
      ].filter(Boolean) as string[];

      return codes.length === 1 ? codes[0] : codes;
    })(),
  },
  };
}

/**
 * Viewport configuration for responsive design
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* JSON-LD Schema for Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: siteConfig.name,
              url: siteConfig.url,
              logo: `${siteConfig.url}/logo.png`,
              description: siteConfig.description,
              sameAs: [
                // Add your social media profiles
                // "https://www.facebook.com/purefire",
                // "https://www.instagram.com/purefire",
              ],
            }),
          }}
        />

        {/* JSON-LD Schema for Website */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: siteConfig.name,
              url: siteConfig.url,
              description: siteConfig.description,
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
                },
                query_input: "required name=search_term_string",
              },
            }),
          }}
        />
      </head>

      <body
        suppressHydrationWarning
        className={`${manrope.variable} ${geistMono.variable} ${bodoniModa.variable} antialiased`}
      >
        <SmoothScrollProvider />
        <PublicFrame>{children}</PublicFrame>
        <CloseCursorOverlay />
      </body>
    </html>
  );
}
