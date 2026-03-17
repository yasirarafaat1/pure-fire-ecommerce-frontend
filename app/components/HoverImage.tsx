"use client";

type Props = {
  images?: string[];
  alt: string;
  className?: string;
};

export default function HoverImage({ images = [], alt, className = "" }: Props) {
  const primary = images[0];
  const hover = images[2];

  return (
    <div className={`relative overflow-hidden group ${className}`}>
      {primary ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={primary}
            alt={alt}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-out ${
              hover ? "md:group-hover:opacity-0" : ""
            }`}
          />
          {hover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hover}
              alt={alt}
              className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 ease-out hidden md:block md:group-hover:opacity-100"
            />
          )}
          <div className="w-full h-full opacity-0" />
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-xs text-[var(--muted)] bg-black/5">
          No image
        </div>
      )}
    </div>
  );
}
