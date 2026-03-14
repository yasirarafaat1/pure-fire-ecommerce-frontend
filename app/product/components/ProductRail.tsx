"use client";

type Item = {
  id?: string | number;
  productId?: string | number;
  color?: string;
  images?: string[];
  title: string;
  price: number | string;
  mrp?: number | string;
  badge?: string;
  image: string;
};
type Props = { title: string; items: Item[] };

export default function ProductRail({ title, items }: Props) {
  if (!items.length) return null;
  return (
    <section className="grid pl-4 pr-4 md:p-4 gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {items.map((item, i) => (
          <a
            key={i}
            href={`/product?id=${item.productId ?? item.id ?? ""}${item.color ? `&color=${encodeURIComponent(item.color)}` : ""}`}
            className="group flex-shrink-0 cursor-pointer border border-black/20 rounded-[5px] w-[calc((100vw-48px)/3)]"
            style={{ width: "calc((100vw - 48px)/3.2)", maxWidth: "200px" }}
          >
            <div className="aspect-[3/4] overflow-hidden relative">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover transition-opacity duration-300 md:group-hover:opacity-0"
              />
              {item.images?.[2] && (
                <img
                  src={item.images[2]}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-300 md:group-hover:opacity-100"
                />
              )}
            </div>
            <div className="p-2 md:p-4">
              <p className="text-sm font-medium line-clamp-2">{item.title}</p>
              <div className="flex items-center gap-2 text-sm mt-1">
                <span className="font-semibold">₹{item.price}</span>
                {item.mrp !== undefined && item.mrp !== null && (
                  <span className="text-xs text-[#999] line-through">₹{item.mrp}</span>
                )}
              </div>
              {/* {item.badge && <span className="text-xs text-red-600">{item.badge}</span>} */}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
