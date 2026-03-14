import CategoryStrip from "./home/components/category-strip";
import BannerCarousel from "./home/components/banner-carousel";
import TopProducts from "./home/components/top-products";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-black">
      <CategoryStrip />
      <BannerCarousel />
      <TopProducts />
    </div>
  );
}
