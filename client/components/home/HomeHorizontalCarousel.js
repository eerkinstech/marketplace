"use client";

import { useRef } from "react";

function ChevronIcon({ direction = "left" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={`h-4 w-4 ${direction === "right" ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.5 4.5 7 10l5.5 5.5" />
    </svg>
  );
}

export function HomeHorizontalCarousel({ children, ariaLabel, stepMode = "viewport", itemSelector = "[data-carousel-item]" }) {
  const trackRef = useRef(null);

  function scrollByAmount(direction) {
    const track = trackRef.current;
    if (!track) return;

    let amount = Math.max(track.clientWidth * 0.82, 240);
    if (stepMode === "item") {
      const firstItem = track.querySelector(itemSelector);
      if (firstItem) {
        const itemRect = firstItem.getBoundingClientRect();
        const trackStyle = window.getComputedStyle(track);
        const gap = Number.parseFloat(trackStyle.columnGap || trackStyle.gap || "0") || 0;
        amount = itemRect.width + gap;
      }
    }
    track.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth"
    });
  }

  return (
    <div className="relative">
      <div className="absolute right-0 top-[-3.9rem] z-10 hidden items-center gap-2 md:flex">
        <button
          type="button"
          onClick={() => scrollByAmount("left")}
          className="flex h-10 w-10 items-center justify-center rounded-full border transition hover:-translate-y-0.5"
          style={{ borderColor: "var(--color-line)", background: "var(--white)", color: "var(--primary)" }}
          aria-label={`Scroll ${ariaLabel} left`}
        >
          <ChevronIcon direction="left" />
        </button>
        <button
          type="button"
          onClick={() => scrollByAmount("right")}
          className="flex h-10 w-10 items-center justify-center rounded-full border transition hover:-translate-y-0.5"
          style={{ borderColor: "var(--color-line)", background: "var(--white)", color: "var(--primary)" }}
          aria-label={`Scroll ${ariaLabel} right`}
        >
          <ChevronIcon direction="right" />
        </button>
      </div>

      <div
        ref={trackRef}
        className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children}
      </div>
    </div>
  );
}
