"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import SearchBar from "./SearchBar";
import Suggestions from "./Suggestions";
import SuggestionsLoader from "./SuggestionsLoader";
import ResultsGrid from "./ResultsGrid";
import { getUserToken } from "../../utils/auth";

type Product = {
  product_id: number;
  name?: string;
  title?: string;
  product_image?: string[];
  selling_price?: number;
  price?: number;
  status?: string;
  catagory_id?: { name?: string };
};

type Suggestion = { label: string; sub?: string };

const API_BASE = "/api/user";

const shuffle = <T,>(items: T[]) => {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
};

const buildSuggestions = (products: Product[], limit = 12) => {
  const seen = new Set<string>();
  const built: Suggestion[] = [];

  products.forEach((product) => {
    const name = (product.name || product.title || "").trim();
    if (name && !seen.has(name)) {
      built.push({ label: name, sub: "Product" });
      seen.add(name);
    }

    const category = (product.catagory_id?.name || "").trim();
    if (category && !seen.has(category)) {
      built.push({ label: category, sub: "Category" });
      seen.add(category);
    }
  });

  return built.slice(0, limit);
};

export default function SearchModal({
  open,
  onClose,
  initialQuery = "",
  showBackdrop = true,
}: {
  open: boolean;
  onClose: () => void;
  initialQuery?: string;
  showBackdrop?: boolean;
}) {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allLoading, setAllLoading] = useState(true);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    if (!open) return;
    setQuery(initialQuery);
  }, [initialQuery, open]);

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open || allProducts.length) return;

    const load = async () => {
      setAllLoading(true);
      try {
        const response = await fetch(`${API_BASE}/show-product?limit=200`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error();
        setAllProducts(data.products || []);
      } catch {
        setMessage("Could not load products for search.");
      } finally {
        setAllLoading(false);
      }
    };

    load();
  }, [allProducts.length, open]);

  const baseSuggestions = useMemo(
    () => shuffle(buildSuggestions(allProducts)).slice(0, 12),
    [allProducts],
  );

  const defaultShowcase = useMemo(
    () => shuffle(allProducts).slice(0, 6),
    [allProducts],
  );

  useEffect(() => {
    if (!open) return undefined;

    const trimmed = query.trim();
    if (!trimmed) {
      setSuggestions(baseSuggestions);
      setHasSearched(false);
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      setSuggestLoading(true);
      try {
        const response = await fetch(`${API_BASE}/search?search=${encodeURIComponent(trimmed)}&limit=50`);
        const data = await response.json();
        setSuggestions(data?.products?.length ? buildSuggestions(data.products) : []);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestLoading(false);
      }
    }, 200);

    return () => window.clearTimeout(timer);
  }, [baseSuggestions, open, query]);

  const executeSearch = useCallback((value: string) => {
    const searchQuery = value.trim().toLowerCase();
    if (!searchQuery) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const token = getUserToken();
    if (token) {
      fetch(`${API_BASE}/activity/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-token": token },
        body: JSON.stringify({ query: searchQuery }),
      }).catch(() => undefined);
    }

    setHasSearched(true);
    setLoading(true);

    fetch(`${API_BASE}/search?search=${encodeURIComponent(searchQuery)}&limit=50`)
      .then((response) => response.json())
      .then((data) => setResults(data?.products || []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!open || !initialQuery.trim()) return;
    executeSearch(initialQuery);
  }, [executeSearch, initialQuery, open]);

  const runSearch = () => {
    executeSearch(query);
  };

  const handleSelectSuggestion = (label: string) => {
    setQuery(label);
    window.setTimeout(() => executeSearch(label), 0);
  };

  const relatedKeywords = useMemo(() => {
    if (!hasSearched) return [];
    if (!results.length) return baseSuggestions;

    const seen = new Set<string>();
    const items: Suggestion[] = [];

    results.forEach((product) => {
      const name = (product.name || product.title || "").trim();
      name
        .split(/\s+/)
        .map((word) => word.trim())
        .filter((word) => word.length > 2 && !/^\d+$/.test(word))
        .forEach((word) => {
          const key = word.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            items.push({ label: word, sub: "Keyword" });
          }
        });

      const category = (product.catagory_id?.name || "").trim();
      if (category && !seen.has(category.toLowerCase())) {
        seen.add(category.toLowerCase());
        items.push({ label: category, sub: "Category" });
      }
    });

    return items.slice(0, 12);
  }, [baseSuggestions, hasSearched, results]);

  const hasQuery = query.trim().length > 0;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      {showBackdrop ? (
        <button
          type="button"
          data-close-cursor="true"
          aria-label="Close search"
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/45"
        />
      ) : null}

      <section className="absolute inset-0 mx-auto flex h-[100dvh] max-w-5xl flex-col overflow-hidden border border-black/10 bg-white shadow-[0_24px_90px_rgba(15,23,42,0.28)] md:inset-x-0 md:top-6 md:h-[min(92dvh,760px)] md:rounded-[8px]">
        <header className="shrink-0 border-b border-black/10 bg-white px-3 py-3 md:px-4">
          <SearchBar value={query} onChange={setQuery} onSubmit={runSearch} onBack={onClose} autoFocus />
        </header>

        <main className="search-modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5">
          {hasSearched ? (
            <>
              {relatedKeywords.length > 0 ? (
                <div className="mb-4 search-fade">
                  <h3 className="mb-2 text-sm font-semibold">Related keywords</h3>
                  {loading ? <SuggestionsLoader rows={6} /> : <Suggestions items={relatedKeywords} onSelect={handleSelectSuggestion} />}
                </div>
              ) : null}

              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Results</h2>
              </div>

              <ResultsGrid
                products={results}
                loading={loading}
                emptyMessage={query ? "No products found. Try another keyword." : "Start typing to search products."}
                columns={4}
              />
            </>
          ) : (
            <div className="grid gap-5">
              <section className="search-fade">
                <h2 className="mb-3 text-lg font-semibold">Popular Keywords</h2>
                {suggestLoading ? (
                  <SuggestionsLoader />
                ) : (
                  <Suggestions items={suggestions} onSelect={handleSelectSuggestion} />
                )}
              </section>

              {!hasQuery && (allLoading || defaultShowcase.length > 0) ? (
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Popular picks</h2>
                  </div>
                  <ResultsGrid products={defaultShowcase} loading={allLoading} emptyMessage="No products to show." columns={4} />
                </section>
              ) : null}
            </div>
          )}

          {message ? <p className="mt-4 text-sm text-red-600">{message}</p> : null}
        </main>
      </section>
      <style jsx>{`
        .search-modal-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
          -webkit-overflow-scrolling: touch;
        }

        .search-modal-scroll::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
      `}</style>
    </div>
  );
}
