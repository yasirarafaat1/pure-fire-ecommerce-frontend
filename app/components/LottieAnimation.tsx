"use client";

import Lottie from "lottie-react";
import { useEffect, useState } from "react";

type Props = {
  src: string;
  label: string;
  className?: string;
  loop?: boolean;
  color?: string;
};

function hexToLottieColor(hex: string) {
  const clean = hex.replace("#", "").trim();
  const value =
    clean.length === 3
      ? clean
          .split("")
          .map((part) => part + part)
          .join("")
      : clean;

  if (!/^[0-9a-fA-F]{6}$/.test(value)) return null;

  return [
    Number.parseInt(value.slice(0, 2), 16) / 255,
    Number.parseInt(value.slice(2, 4), 16) / 255,
    Number.parseInt(value.slice(4, 6), 16) / 255,
    1,
  ];
}

function isBlackLottieColor(value: unknown) {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    value.every((item) => typeof item === "number") &&
    value[0] <= 0.04 &&
    value[1] <= 0.04 &&
    value[2] <= 0.04 &&
    value[3] >= 0 &&
    value[3] <= 1
  );
}

function recolorBlackValues(value: unknown, color: number[]): unknown {
  if (isBlackLottieColor(value)) return color;

  if (Array.isArray(value)) {
    return value.map((item) => recolorBlackValues(item, color));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        recolorBlackValues(item, color),
      ]),
    );
  }

  return value;
}

export default function LottieAnimation({
  src,
  label,
  className = "",
  loop = true,
  color,
}: Props) {
  const [animationData, setAnimationData] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(src)
      .then((response) => response.json() as Promise<unknown>)
      .then((data) => {
        if (cancelled) return;

        const lottieColor = color ? hexToLottieColor(color) : null;
        setAnimationData(lottieColor ? recolorBlackValues(data, lottieColor) : data);
      })
      .catch(() => {
        if (!cancelled) setAnimationData(null);
      });

    return () => {
      cancelled = true;
    };
  }, [color, src]);

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
