import CategoryStrip from "./home/components/category-strip";
import BannerCarousel from "./home/components/banner-carousel";
import NewArrivals from "./home/components/new-arrivals";
import BestSellers from "./home/components/best-sellers";
import TopProducts from "./home/components/top-products";
import SuggestedProducts from "./components/SuggestedProducts";
import QualityMarquee from "./home/components/quality-marquee";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-black">
      <CategoryStrip />
      <BannerCarousel />
      <TopProducts />
      <NewArrivals />
      <SuggestedProducts />
      <BestSellers />
      <QualityMarquee />
    </div>
  );
}
