import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export type ProductQuery = {
  productId?: string;
  colorParam: string | null;
  sizeParam: string | null;
  queryString: string;
  nextUrl: string;
};

type QueryState = {
  productId?: string;
  colorParam: string | null;
  sizeParam: string | null;
  queryString: string;
};

const parseSearch = (search: string): QueryState => {
  const params = new URLSearchParams(search || "");
  return {
    productId: params.get("id") || undefined,
    colorParam: params.get("color"),
    sizeParam: params.get("size"),
    queryString: params.toString(),
  };
};

export const useProductQuery = (): ProductQuery => {
  const pathname = usePathname();
  const lastSearchRef = useRef("");
  const [state, setState] = useState<QueryState>(() => {
    if (typeof window === "undefined") {
      return { productId: undefined, colorParam: null, sizeParam: null, queryString: "" };
    }
    return parseSearch(window.location.search || "");
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const update = () => {
      const search = window.location.search || "";
      if (search === lastSearchRef.current) return;
      lastSearchRef.current = search;
      const next = parseSearch(search);
      setState((prev) => (prev.queryString === next.queryString ? prev : next));
    };

    const originalPush = history.pushState;
    const originalReplace = history.replaceState;

    history.pushState = function (...args) {
      const result = originalPush.apply(this, args as any);
      window.dispatchEvent(new Event("locationchange"));
      return result;
    };
    history.replaceState = function (...args) {
      const result = originalReplace.apply(this, args as any);
      window.dispatchEvent(new Event("locationchange"));
      return result;
    };

    window.addEventListener("popstate", update);
    window.addEventListener("locationchange", update);

    return () => {
      history.pushState = originalPush;
      history.replaceState = originalReplace;
      window.removeEventListener("popstate", update);
      window.removeEventListener("locationchange", update);
    };
  }, []);

  const nextUrl = useMemo(
    () => (state.queryString ? `${pathname}?${state.queryString}` : pathname),
    [pathname, state.queryString],
  );

  return { ...state, nextUrl };
};
