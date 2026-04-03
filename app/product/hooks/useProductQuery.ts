import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { extractProductIdFromPathname } from "../../utils/productUrl";

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

const parseSearch = (search: string, pathname: string): QueryState => {
  const params = new URLSearchParams(search || "");
  return {
    productId: params.get("id") || extractProductIdFromPathname(pathname) || undefined,
    colorParam: params.get("color"),
    sizeParam: params.get("size"),
    queryString: params.toString(),
  };
};

export const useProductQuery = (): ProductQuery => {
  const pathname = usePathname();
  const lastLocationRef = useRef("");
  const [state, setState] = useState<QueryState>(() => {
    if (typeof window === "undefined") {
      return { productId: undefined, colorParam: null, sizeParam: null, queryString: "" };
    }
    return parseSearch(window.location.search || "", window.location.pathname || pathname || "");
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const update = () => {
      const search = window.location.search || "";
      const currentPath = window.location.pathname || pathname || "";
      const locationKey = `${currentPath}${search}`;
      if (locationKey === lastLocationRef.current) return;
      lastLocationRef.current = locationKey;
      const next = parseSearch(search, currentPath);
      setState((prev) =>
        prev.queryString === next.queryString && prev.productId === next.productId ? prev : next,
      );
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
    update();

    return () => {
      history.pushState = originalPush;
      history.replaceState = originalReplace;
      window.removeEventListener("popstate", update);
      window.removeEventListener("locationchange", update);
    };
  }, [pathname]);

  const nextUrl = useMemo(
    () => (state.queryString ? `${pathname}?${state.queryString}` : pathname),
    [pathname, state.queryString],
  );

  return { ...state, nextUrl };
};
