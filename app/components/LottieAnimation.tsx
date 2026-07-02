"use client";

import Lottie from "lottie-react";
import { useEffect, useState } from "react";

type Props = {
  src: string;
  label: string;
  className?: string;
  loop?: boolean;
};

export default function LottieAnimation({
  src,
  label,
  className = "",
  loop = true,
}: Props) {
  const [animationData, setAnimationData] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(src)
      .then((response) => response.json() as Promise<unknown>)
      .then((data) => {
        if (!cancelled) setAnimationData(data);
      })
      .catch(() => {
        if (!cancelled) setAnimationData(null);
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  if (!animationData) {
    return (
      <div
        aria-label={label}
        className={`grid place-items-center rounded-full border border-black/10 bg-black/[0.03] ${className}`}
      >
        <span className="h-10 w-10 animate-pulse rounded-full bg-black/10" />
      </div>
    );
  }

  return (
    <Lottie
      animationData={animationData}
      loop={loop}
      aria-label={label}
      className={className}
    />
  );
}
