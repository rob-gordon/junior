"use client";

import { useLayoutEffect, useRef, useState } from "react";

// Renders text on a single line, shrinking the font just enough to fit the
// container. The hidden span measures the natural (unscaled) width so the
// visible span can be sized in one pass without feedback loops.
export default function FitText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    const fit = () => {
      const available = container.clientWidth;
      const natural = measure.scrollWidth;
      // 0.99 absorbs subpixel rounding in scrollWidth.
      setScale(natural > available && natural > 0 ? (available / natural) * 0.99 : 1);
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(container);
    // Glyph widths change once the display webfont finishes loading.
    document.fonts?.ready.then(fit).catch(() => {});
    return () => ro.disconnect();
  }, [text]);

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      <span
        ref={measureRef}
        aria-hidden
        className="absolute invisible whitespace-nowrap"
      >
        {text}
      </span>
      <span
        className="block whitespace-nowrap"
        style={scale < 1 ? { fontSize: `${scale}em` } : undefined}
      >
        {text}
      </span>
    </div>
  );
}
