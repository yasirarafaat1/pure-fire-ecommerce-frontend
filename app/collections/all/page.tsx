"use client";

import { Suspense, useState } from "react";
import { usePathname } from "next/navigation";
import CategoryStrip from "../../home/components/category-strip";
import CollectionHeader from "./components/CollectionHeader";
import CollectionFilters from "./components/CollectionFilters";
import ProductsGrid from "./components/ProductsGrid";
import { useCollectionPage } from "./components/useCollectionPage";

function CollectionsPage() {
  const pathname = usePathname() || "";
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const {
    sortOptions,
    collectionTitle,
    activeSort,
    setActiveSort,
    openSections,
    toggleSection,
    pendingFilters,
    availableFilters,
    priceBounds,
    setPriceMin,
    setPriceMax,
    setPriceRange,
    toggleValue,
    hasSelections,
    applyFilters,
    clearFilters,
    isLoading,
    sortedProducts,
    discount,
    handleSelectProduct,
  } = useCollectionPage();

  const filterProps = {
    openSections,
    toggle: toggleSection,
    pendingFilters,
    availableFilters,
    priceBounds,
    onSetPriceMin: setPriceMin,
    onSetPriceMax: setPriceMax,
    onSetPriceRange: setPriceRange,
    toggleValue,
    hasSelections,
    onApply: applyFilters,
    onClear: clearFilters,
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <CategoryStrip />
      <main className="max-w-6xl mx-auto px-4 py-6 pt-3 grid gap-6">
        <CollectionHeader
          collectionTitle={collectionTitle}
          sortOptions={sortOptions}
          activeSort={activeSort}
          onSortChange={setActiveSort}
          onOpenFilters={() => setMobileFilterOpen(true)}
        />

        <div className="grid gap-6 md:grid-cols-[280px_1fr] items-start">
          <aside className="hidden md:grid md:self-start md:sticky md:top-24 md:max-h-[calc(100vh-6rem)] px-2 gap-4 bg-white text-black">
            <CollectionFilters {...filterProps} onClose={() => setMobileFilterOpen(false)} />
          </aside>

          <section className="grid gap-4">
            <ProductsGrid
              isLoading={isLoading}
              products={sortedProducts}
              discount={discount}
              onSelect={handleSelectProduct}
              gridKey={pathname}
            />
          </section>
        </div>
      </main>

      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${
          mobileFilterOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!mobileFilterOpen}
      >
        <button
          className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${
            mobileFilterOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMobileFilterOpen(false)}
          aria-label="Close filters"
        />
        <aside
          className={`absolute right-0 top-0 h-full w-[86%] max-w-sm bg-white text-black border-l border-black/10 p-4 overflow-y-auto transform transition-transform duration-300 ${
            mobileFilterOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="grid gap-4">
            <CollectionFilters {...filterProps} onClose={() => setMobileFilterOpen(false)} />
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function CollectionsPageWrapper() {
  return (
    <Suspense fallback={null}>
      <CollectionsPage />
    </Suspense>
  );
}
