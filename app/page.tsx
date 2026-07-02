import CategoryStrip from "./home/components/category-strip";
import BannerCarousel from "./home/components/banner-carousel";
import NewArrivals from "./home/components/new-arrivals";
import BestSellers from "./home/components/best-sellers";
import TopProducts from "./home/components/top-products";
import SuggestedProducts from "./components/SuggestedProducts";
import QualityMarquee from "./home/components/quality-marquee";
import CustomerReviewsMarquee from "./home/components/customerreviewsmarquee";
import InstagramReelsMarquee from "./home/components/insta-reels";
import type { Metadata } from "next";
import { siteConfig } from "./config/metadata";

const homeDescription =
  "Shop Pure Fire everyday wear, new arrivals, best sellers, top products, and style inspiration in one clean fashion storefront.";

export const metadata: Metadata = {
  title: "Pure Fire - Everyday Fashion Essentials",
  description: homeDescription,
  openGraph: {
    title: "Pure Fire - Everyday Fashion Essentials",
    description: homeDescription,
    url: siteConfig.url,
  },
  twitter: {
    title: "Pure Fire - Everyday Fashion Essentials",
    description: homeDescription,
  },
};

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-80px)] overflow-x-hidden bg-white text-black">
      <CategoryStrip />
      <BannerCarousel />
      <TopProducts />
      <NewArrivals />
      <SuggestedProducts />
      <BestSellers />
      <CustomerReviewsMarquee />
      <InstagramReelsMarquee />
      <QualityMarquee />
    </main>
  );
}
