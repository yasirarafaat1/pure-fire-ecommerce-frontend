type ProductHrefInput = {
    id: string | number;
    name?: string;
    slug?: string;
    color?: string;
    size?: string;
};

const toSlug = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

const ensureProductSlug = (name?: string, slug?: string) => {
    const source = (slug || name || "").trim();
    const normalized = toSlug(source);
    return normalized || "product";
};

export const buildProductPath = ({ id, name, slug }: Omit<ProductHrefInput, "color" | "size">) => {
    const safeId = encodeURIComponent(String(id));
    const safeSlug = ensureProductSlug(name, slug);
    return `/product/${safeId}/${safeSlug}`;
};

export const buildProductHref = ({ id, name, slug, color, size }: ProductHrefInput) => {
    const path = buildProductPath({ id, name, slug });
    const params = new URLSearchParams();
    if (color) params.set("color", color);
    if (size) params.set("size", size);
    const query = params.toString();
    return query ? `${path}?${query}` : path;
};

export const extractProductIdFromPathname = (pathname: string) => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts[0] !== "product") return undefined;
    return parts[1] ? decodeURIComponent(parts[1]) : undefined;
};
