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

export function HomeHorizontalCarousel({ children, ariaLabel }) {
  const trackRef = useRef(null);

  function scrollByAmount(direction) {
    const track = trackRef.current;
    if (!track) return;

    const amount = Math.max(track.clientWidth * 0.82, 240);
    track.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth"
    });
  }

  return (
    <div className="relative">
      <div className="mb-3 hidden justify-end gap-2 md:flex">
        <button
          type="button"
          onClick={() => scrollByAmount("left")}
          className="flex h-10 w-10 items-center justify-center rounded-full border text-[var(--home-accent-strong)] transition hover:-translate-y-0.5"
          style={{ borderColor: "var(--home-section-line)", background: "var(--home-card-bg)" }}
          aria-label={`Scroll ${ariaLabel} left`}
        >
          <ChevronIcon direction="left" />
        </button>
        <button
          type="button"
          onClick={() => scrollByAmount("right")}
          className="flex h-10 w-10 items-center justify-center rounded-full border text-[var(--home-accent-strong)] transition hover:-translate-y-0.5"
          style={{ borderColor: "var(--home-section-line)", background: "var(--home-card-bg)" }}
          aria-label={`Scroll ${ariaLabel} right`}
        >
          <ChevronIcon direction="right" />
        </button>
      </div>

      <div
        ref={trackRef}
        className="flex gap-3 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children}
      </div>
    </div>
  );
}
