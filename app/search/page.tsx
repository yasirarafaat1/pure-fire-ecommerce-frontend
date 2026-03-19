"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SearchBar from "./components/SearchBar";
import Suggestions from "./components/Suggestions";
import ResultsGrid from "./components/ResultsGrid";
import { getUserToken } from "../utils/auth";

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

const API_BASE = "/api/user";
const getToken = () => getUserToken();
export default function SearchPage() {
  const router = useRouter();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [debounceId, setDebounceId] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/show-product?limit=200`, { cache: "no-store" });
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

  const gridCols = 4;

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions(baseSuggestions);
      setHasSearched(false);
      return;
    }
    if (debounceId) clearTimeout(debounceId);
    const id = setTimeout(async () => {
      setSuggestLoading(true);
      try {
        const res = await fetch(`${API_BASE}/search?search=${encodeURIComponent(query)}&limit=50`);
        const data = await res.json();
        if (data?.products?.length) {
          const seen = new Set<string>();
          const built: { label: string; sub?: string }[] = [];
          data.products.forEach((p: Product) => {
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
          setSuggestions(built.slice(0, 12));
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
      setHasSearched(false);
      return;
    }
    const token = getToken();
    if (token) {
      fetch(`${API_BASE}/activity/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-token": token },
        body: JSON.stringify({ query: q }),
      }).catch(() => { });
    }
    setHasSearched(true);
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/search?search=${encodeURIComponent(q)}&limit=50`);
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

  const relatedKeywords = useMemo(() => {
    if (!hasSearched) return [];
    if (!results.length) return baseSuggestions;
    const seen = new Set<string>();
    const items: { label: string; sub?: string }[] = [];
    results.forEach((p) => {
      const name = (p.name || p.title || "").trim();
      if (name) {
        name
          .split(/\s+/)
          .map((w) => w.trim())
          .filter((w) => w.length > 2 && !/^\d+$/.test(w))
          .forEach((w) => {
            const key = w.toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              items.push({ label: w, sub: "Keyword" });
            }
          });
      }
      const cat = (p.catagory_id?.name || "").trim();
      if (cat && !seen.has(cat.toLowerCase())) {
        seen.add(cat.toLowerCase());
        items.push({ label: cat, sub: "Category" });
      }
    });
    return items.slice(0, 12);
  }, [hasSearched, results, baseSuggestions]);

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
          {!hasSearched && (
            <div>
              {suggestLoading && <span className="text-xs text-[var(--muted)]">Searching suggestions…</span>}
              <Suggestions items={suggestions} onSelect={handleSelectSuggestion} />
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {hasQuery ? (
          <>
            {relatedKeywords.length > 0 && (
              <div className="mb-2">
                <h3 className="font-semibold text-sm mb-2">Related keywords</h3>
                <Suggestions items={relatedKeywords} onSelect={handleSelectSuggestion} />
              </div>
            )}
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-lg">Results</h2>
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


