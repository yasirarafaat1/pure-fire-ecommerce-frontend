"use client";

import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  playSignal: number;
};

export default function NavbarCartLottie({ playSignal }: Props) {
  const lottieRef = useRef<LottieRefCurrentProps | null>(null);
  const [animationData, setAnimationData] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/lottie/navbar-cart.json")
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
  }, []);

  useEffect(() => {
    if (!animationData || !lottieRef.current) return;

    if (playSignal > 0) {
      lottieRef.current.setSpeed(1.35);
      lottieRef.current.goToAndPlay(0, true);
      return;
    }

    lottieRef.current.goToAndStop(0, true);
  }, [animationData, playSignal]);

  if (!animationData) {
    return <span className="block h-6 w-6 rounded-sm border-2 border-current" />;
  }

  return (
    <Lottie
      lottieRef={lottieRef}
      animationData={animationData}
      autoplay={false}
      loop={false}
      aria-hidden="true"
      className="nav-cart-lottie h-7 w-7"
    />
  );
}
