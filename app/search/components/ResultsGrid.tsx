"use client";

type Product = {
  product_id: number;
  name?: string;
  title?: string;
  selling_price?: number;
  price?: number;
  product_image?: string[];
  status?: string;
};

type Props = {
  products: Product[];
  loading: boolean;
  emptyMessage?: string;
  columns?: number;
};

export default function ResultsGrid({ products, loading, emptyMessage, columns = 3 }: Props) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <span className="spinner" /> Searching…
      </div>
    );
  }
  if (!products.length) {
    return <p className="text-sm text-[var(--muted)]">{emptyMessage || "No products found."}</p>;
  }
  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {products.map((p) => (
        <div key={p.product_id} className="border border-black/10 rounded-[5px] bg-white">
          <div className="aspect-square bg-[rgba(0,0,0,0.04)] overflow-hidden">
            {p.product_image?.[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.product_image[0]} alt={p.name || p.title || "product"} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-[var(--muted)]">No image</div>
            )}
          </div>
          <div className="p-3">
            <h3 className="font-semibold text-sm line-clamp-2">{p.name || p.title || "Untitled"}</h3>
            <p className="text-sm mt-1">₹{p.selling_price ?? p.price ?? "-"}</p>
            <p className="text-xs text-[var(--muted)] capitalize mt-1">₹{p.price || "-"}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
