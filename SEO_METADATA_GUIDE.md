/**
 * SEO METADATA IMPLEMENTATION GUIDE
 * Complete Next.js 13+ App Router Metadata Setup
 * ================================================
 * 
 * This guide demonstrates production-ready SEO metadata implementation
 * for Next.js ecommerce projects with dynamic product pages.
 * 
 * FILES STRUCTURE:
 * ├── app/
 * │   ├── config/
 * │   │   └── metadata.ts           (Site-wide config)
 * │   ├── lib/
 * │   │   └── metadata-utils.ts     (Utilities)
 * │   ├── layout.tsx                (Root layout with schema)
 * │   ├── product/
 * │   │   ├── page.tsx              (Query route metadata)
 * │   │   ├── metadata.ts           (Product metadata builder)
 * │   │   └── [id]/[slug]/
 * │   │       └── page.tsx          (Slug route metadata)
 * │   └── utils/
 * │       └── productUrl.ts         (URL builders)
 */

/**
 * KEY FEATURES IMPLEMENTED:
 * ✅ Dynamic Open Graph metadata for products
 * ✅ Twitter Card tags (summary_large_image)
 * ✅ Canonical URLs (prevents duplicate content)
 * ✅ JSON-LD structured data (Organization + WebSite)
 * ✅ Product-specific OG type
 * ✅ Dynamic image generation support
 * ✅ Fallback logic for missing data
 * ✅ SEO-friendly URL structure (/product/[id]/[slug])
 * ✅ Image size optimization (1200x630)
 * ✅ Meta description character limit (160 chars)
 */

/**
 * SETUP CHECKLIST
 */

// 1. CREATE ENVIRONMENT VARIABLES (.env.local or Vercel)
/*
NEXT_PUBLIC_SITE_URL=https://pure-fire.vercel.app
NEXT_PUBLIC_SITE_NAME=Pure Fire
NEXT_PUBLIC_SITE_DESCRIPTION=Quality-first everyday wear. Minimal, comfortable, and made to last.
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=YOUR_GOOGLE_VERIFICATION_TOKEN_HERE
NEXT_PUBLIC_API_URL=https://your-api.com
*/

// 2. ADD SOCIAL MEDIA TO siteConfig (app/config/metadata.ts)
/*
export const siteConfig = {
  ...
  twitterHandle: "purefire",  // Without @
  // Add more social handles as needed
};
*/

// 3. UPDATE FAVICONS AND OG IMAGES
/*
Required files in /public/:
- favicon.ico (32x32)
- favicon-32x32.png
- apple-touch-icon.png (180x180)
- og-image.png (1200x630) - Used for Open Graph
- logo.png - Used in schema.org structured data
*/

// 4. ENABLE VERCEL CACHING FOR METADATA
/*
In next.config.ts:
async headers() {
  return [
    {
      source: "/api/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "public, s-maxage=60, stale-while-revalidate=120",
        },
      ],
    },
  ];
},
*/

/**
 * USAGE EXAMPLES
 */

// Example 1: Homepage metadata (in app/page.tsx)
/*
import type { Metadata } from "next";
import { generatePageMetadata } from "@/app/lib/metadata-utils";

export const metadata: Metadata = generatePageMetadata({
  title: "Premium Everyday Wear | Pure Fire",
  description: "Quality-first everyday wear. Minimal, comfortable, and made to last. Shop Pure Fire's collection of essentials.",
  url: "https://pure-fire.vercel.app",
  type: "website",
  tags: ["fashion", "clothing", "minimal wear"],
});

export default function HomePage() {
  return <div>...</div>;
}
*/

// Example 2: Collections page metadata (in app/collections/page.tsx)
/*
import type { Metadata } from "next";
import { generatePageMetadata } from "@/app/lib/metadata-utils";

export const metadata: Metadata = generatePageMetadata({
  title: "Browse Our Collections | Pure Fire",
  description: "Explore our curated collections of premium everyday wear. Find your perfect fit.",
  url: "https://pure-fire.vercel.app/collections",
  type: "website",
});
*/

// Example 3: Product page metadata (in app/product/[id]/[slug]/page.tsx)
/*
See app/product/metadata.ts for complete implementation
- Fetches product data
- Generates Open Graph metadata with product image
- Creates canonical URL
- Sets Twitter Card metadata
- Includes structured data
*/

// Example 4: Contact page (in app/contact/page.tsx)
/*
import type { Metadata } from "next";
import { generatePageMetadata } from "@/app/lib/metadata-utils";

export const metadata: Metadata = generatePageMetadata({
  title: "Contact Us | Pure Fire",
  description: "Get in touch with our customer service team. We're here to help with any questions about our products.",
  url: "https://pure-fire.vercel.app/contact",
  tags: ["contact", "support"],
});
*/

/**
 * BEST PRACTICES
 */

/*
1. CANONICAL URLS
   - Always include canonical URLs to prevent duplicate content
   - Use absolute URLs (not relative)
   - Point to the preferred version of a page

2. OPEN GRAPH IMAGES
   - Always use 1200x630px images (prevents distortion)
   - Compress images (aim for < 200KB)
   - Use descriptive alt text
   - For products: show main product image

3. DESCRIPTIONS
   - Keep titles under 60 characters (display limit)
   - Keep descriptions under 160 characters (search snippets)
   - Include primary keywords naturally
   - Make them compelling and clickable

4. STRUCTURED DATA (JSON-LD)
   - Always include Organization schema
   - Use Product schema for product pages
   - Include BreadcrumbList for navigation
   - Validate with https://schema.org/validator

5. TWITTER CARDS
   - Use "summary_large_image" for products and articles
   - Always include images for better engagement
   - Keep titles and descriptions concise
   - Test with https://cards-dev.twitter.com/validator

6. PERFORMANCE
   - Use dynamic=force-dynamic sparingly (impacts build time)
   - Cache product data with revalidate timings
   - Use next/image for image optimization
   - Preload critical OG images

7. TESTING & VALIDATION
   - Google Search Console: https://search.google.com/search-console
   - Twitter Card Validator: https://cards-dev.twitter.com/validator
   - Facebook Sharing Debugger: https://developers.facebook.com/tools/debug
   - Schema.org Validator: https://schema.org/validator
   - Lighthouse: Run audits in Chrome DevTools
*/

/**
 * COMMON PITFALLS TO AVOID
 */

/*
❌ Using relative URLs in og:image (must be absolute)
❌ Forgetting canonical URLs (causes duplicate content issues)
❌ OG images that are too large or non-standard sizes
❌ Descriptions over 160 characters (truncated in search results)
❌ Not including Twitter card tags
❌ Hardcoding metadata (make it dynamic when possible)
❌ Using generic product titles and descriptions
❌ Not testing with sharing debuggers before launch
❌ Ignoring cache headers (stale data served)
❌ Not implementing structured data (schema.org)
*/

/**
 * ADVANCED TOPICS
 */

/*
1. DYNAMIC OG IMAGE GENERATION
   - Use @vercel/og for dynamic image generation
   - Generate unique images for each product on-the-fly
   - Example: /api/og?id=123&name=product-name

2. INTERNATIONALIZATION (i18n)
   - Use alternates.languages in metadata
   - Generate hreflang links
   - Set canonical for each language variant

3. SITEMAP.XML & ROBOTS.TXT
   - Auto-generated by Next.js (app/sitemap.ts)
   - Include all important pages
   - Set proper crawl delay in robots.txt
   - Submit to Search Console

4. SCHEMA MARKUP ENTITIES
   - Organization: Company name, logo, contact
   - Product: Name, description, image, price, rating
   - BreadcrumbList: Site navigation structure
   - FAQPage: For FAQ sections

5. MONITORING
   - Set up Google Search Console alerts
   - Monitor Core Web Vitals
   - Track CTR and impressions over time
   - Use Google Analytics 4 events
*/

/**
 * RESOURCES & TOOLS
 */

/*
Documentation:
- https://nextjs.org/docs/app/building-your-application/optimizing/metadata
- https://schema.org/Product
- https://ogp.me/ (Open Graph Protocol)
- https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview

Tools:
- Google Search Console: https://search.google.com/search-console
- Google Structured Data Testing Tool: https://search.google.com/test/rich-results
- WAVE (Accessibility): https://wave.webaim.org/
- GTmetrix (Performance): https://gtmetrix.com/
- Screaming Frog SEO Spider: https://www.screamingfrog.co.uk/seo-spider/
*/

/**
 * DEPLOYMENT CHECKLIST
 */

/*
Before going live:
☐ Add all environment variables to Vercel
☐ Set correct metadataBase URL
☐ Add Google Search Console verification token
☐ Upload og-image, logo, and favicon files
☐ Test all pages with sharing debuggers
☐ Validate structured data with schema validator
☐ Run Lighthouse audit (target: 90+ SEO score)
☐ Test on Chrome, Firefox, and Safari
☐ Verify robots.txt and sitemap.xml
☐ Submit sitemap to Google Search Console
☐ Set up GSC monitoring and alerts
☐ Configure Vercel Analytics

After launch:
☐ Monitor Performance in GSC weekly
☐ Check for indexing issues
☐ Monitor Core Web Vitals
☐ Track rankings for target keywords
☐ Set up conversion tracking
*/

export {};
