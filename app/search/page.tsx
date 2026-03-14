"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SearchBar from "./components/SearchBar";
import Suggestions from "./components/Suggestions";
import ResultsGrid from "./components/ResultsGrid";

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

const API_BASE = "/api/admin";

export default function SearchPage() {
  const router = useRouter();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [debounceId, setDebounceId] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/get-products`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error();
        setAllProducts(data.products || []);
      } catch {
        setMessage("Could not load products for search.");
      }
    };
    load();
  }, []);

  const [suggestions, setSuggestions] = useState<{ label: string; sub?: string }[]>([]);

  const baseSuggestions = useMemo(() => {
    const seen = new Set<string>();
    const built: { label: string; sub?: string }[] = [];
    allProducts.forEach((p) => {
      const name = (p.name || p.title || "").trim();
      if (name && !seen.has(name)) {
        built.push({ label: name, sub: "Product" });
        seen.add(name);
      }
      const cat = (p.catagory_id?.name || "").trim();
      if (cat && !seen.has(cat)) {
        built.push({ label: cat, sub: "Category" });
        seen.add(cat);
      }
    });
    // Shuffle to keep it dynamic on every open
    for (let i = built.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [built[i], built[j]] = [built[j], built[i]];
    }
    return built.slice(0, 12);
  }, [allProducts, allProducts.length]);

  const defaultShowcase = useMemo(() => {
    const pool = [...allProducts];
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 6);
  }, [allProducts, allProducts.length]);

  const [gridCols, setGridCols] = useState(3);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("search_grid_cols") : null;
    const num = stored ? parseInt(stored, 10) : NaN;
    if (num && [3, 4, 6].includes(num)) {
      setGridCols(num);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("search_grid_cols", String(gridCols));
    }
  }, [gridCols]);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions(baseSuggestions);
      return;
    }
    if (debounceId) clearTimeout(debounceId);
    const id = setTimeout(async () => {
      setSuggestLoading(true);
      try {
        const res = await fetch(`${API_BASE}/search-products?q=${encodeURIComponent(query)}&limit=0`);
        const data = await res.json();
        if (data?.suggestions) {
          const built = data.suggestions.map((s: string) => ({ label: s }));
          setSuggestions(built);
        } else {
          setSuggestions([]);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestLoading(false);
      }
    }, 200);
    setDebounceId(id);
  }, [query, baseSuggestions]);

  const runSearch = () => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setResults([]);
      return;
    }
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/search-products?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (data?.products) setResults(data.products);
        else setResults([]);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    })();
  };

  const handleSelectSuggestion = (label: string) => {
    setQuery(label);
    setTimeout(runSearch, 0);
  };

  const hasQuery = query.trim().length > 0;

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="sticky top-0 z-10 bg-white border-b border-black/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-3">
          <SearchBar
            value={query}
            onChange={setQuery}
            onSubmit={runSearch}
            onBack={() => router.back()}
          />
          <div>
            {suggestLoading && <span className="text-xs text-[var(--muted)]">Searching suggestions…</span>}
            <Suggestions items={suggestions} onSelect={handleSelectSuggestion} />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {hasQuery ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-lg">Results</h2>
              <div className="flex items-center gap-2">
                {[3, 4, 6].map((n) => {
                  const active = gridCols === n;
                  return (
                    <button
                      key={n}
                      className={`btn btn-ghost !p-2 border ${active ? "border-black bg-black text-white" : "border-black/20 bg-black/5 text-black"}`}
                      onClick={() => setGridCols(n)}
                      aria-label={`Show ${n} columns`}
                    >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill={active ? "black" : "none"}
                      stroke={active ? "white" : "currentColor"}
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {Array.from({ length: n }).map((_, idx) => {
                        const cols = Math.ceil(Math.sqrt(n));
                        const size = 4;
                        const gap = 2;
                        const x = (idx % cols) * (size + gap) + 1;
                        const y = Math.floor(idx / cols) * (size + gap) + 1;
                        return <rect key={idx} x={x} y={y} width={size} height={size} />;
                      })}
                    </svg>
                    {/* <span className={`text-xs ml-1 ${active ? "text-white" : ""}`}>{n}</span> */}
                  </button>
                  );
                })}
              </div>
            </div>
            <ResultsGrid
              products={results}
              loading={loading}
              emptyMessage={query ? "No products found. Try another keyword." : "Start typing to search products."}
              columns={gridCols}
            />
          </>
        ) : (
          defaultShowcase.length > 0 && (
            <section className="mt-1">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-lg">Popular picks</h2>
                <div className="flex items-center gap-2">
                  {[3, 4, 6].map((n) => {
                    const active = gridCols === n;
                    return (
                    <button
                      key={`pop-${n}`}
                      className={`btn btn-ghost !p-2 border ${active ? "border-black bg-black text-white" : "border-black/20 bg-black/5 text-black"}`}
                      onClick={() => setGridCols(n)}
                      aria-label={`Show ${n} columns`}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                        fill={active ? "black" : "none"}
                        stroke={active ? "white" : "currentColor"}
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        {Array.from({ length: n }).map((_, idx) => {
                          const cols = Math.ceil(Math.sqrt(n));
                          const size = 4;
                          const gap = 2;
                          const x = (idx % cols) * (size + gap) + 1;
                          const y = Math.floor(idx / cols) * (size + gap) + 1;
                          return <rect key={idx} x={x} y={y} width={size} height={size} />;
                        })}
                      </svg>
                      {/* <span className={`text-xs ml-1 ${active ? "text-white" : ""}`}>{n}</span> */}
                    </button>
                  );
                })}
              </div>
            </div>
              <ResultsGrid products={defaultShowcase} loading={false} emptyMessage="No products to show." columns={gridCols} />
            </section>
          )
        )}
        {message && <p className="text-sm text-red-600 mt-4">{message}</p>}
      </main>
    </div>
  );
}
