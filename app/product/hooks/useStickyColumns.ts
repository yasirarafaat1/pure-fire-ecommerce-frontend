import { useEffect, useRef, useState } from "react";

export const useStickyColumns = () => {
  const leftRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLDivElement | null>(null);
  const [stick, setStick] = useState<"left" | "right" | null>(null);

  useEffect(() => {
    const measure = () => {
      const l = leftRef.current;
      const r = rightRef.current;
      if (!l || !r) return;
      const lh = l.scrollHeight;
      const rh = r.scrollHeight;
      if (lh > rh + 40) setStick("right");
      else if (rh > lh + 40) setStick("left");
      else setStick(null);
    };
    measure();
    const id = setInterval(measure, 400);
    window.addEventListener("resize", measure);
    return () => {
      clearInterval(id);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return { leftRef, rightRef, stick };
};
