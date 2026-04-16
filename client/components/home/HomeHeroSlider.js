"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function resolveSlideColors(slide = {}) {
  return {
    background: slide.backgroundColor || "linear-gradient(135deg, var(--home-hero-start) 0%, var(--home-hero-end) 100%)",
    color: slide.textColor || "var(--home-hero-text)",
    accent: slide.accentColor || "var(--home-accent-strong)"
  };
}

export function HomeHeroSlider({ slides = [] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) return null;

  const active = slides[index];
  const colors = resolveSlideColors(active);

  return (
    <section
      className="relative overflow-hidden rounded-[30px] border"
      style={{ background: colors.background, color: colors.color, borderColor: "var(--home-section-line)", boxShadow: "var(--home-shadow)" }}
    >
      <div className="grid min-h-[260px] gap-5 p-5 md:grid-cols-[minmax(0,1fr)_minmax(250px,0.72fr)] md:p-7 lg:min-h-[280px] lg:p-8">
        <div className="flex flex-col justify-center">
          {active.eyebrow ? (
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] opacity-70">{active.eyebrow}</div>
          ) : null}
          <h1 className="mt-2.5 max-w-[11ch] text-[34px] font-black uppercase leading-[0.95] md:text-5xl lg:text-[56px]">{active.title}</h1>
          {active.subtitle ? (
            <p className="mt-3 max-w-[30rem] text-base md:text-xl" style={{ color: "var(--home-hero-muted)" }}>
              {active.subtitle}
            </p>
          ) : null}
          {active.description ? (
            <p className="mt-3 max-w-[34rem] text-sm leading-6" style={{ color: "var(--home-hero-muted)" }}>
              {active.description}
            </p>
          ) : null}
          {active.href ? (
            <div className="mt-5">
              <Link
                href={active.href}
                className="inline-flex items-center gap-2 text-base font-black uppercase tracking-[0.08em] underline underline-offset-4 md:text-lg"
                style={{ color: colors.accent }}
              >
                {active.label || "Shop now"}
              </Link>
            </div>
          ) : null}
        </div>

        <div className="relative flex items-center justify-center">
          {active.imageUrl ? (
            <img
              src={active.imageUrl}
              alt={active.title || "Homepage slide"}
              className="max-h-[210px] w-full object-contain drop-shadow-[0_18px_34px_rgba(0,0,0,0.18)] md:max-h-[250px] lg:max-h-[290px]"
            />
          ) : null}
        </div>
      </div>

      {slides.length > 1 ? (
        <>
          <button
            type="button"
            onClick={() => setIndex((current) => (current - 1 + slides.length) % slides.length)}
            className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full shadow-lg"
            style={{ background: "rgba(255,255,255,0.95)", color: "var(--color-ink)" }}
            aria-label="Previous slide"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setIndex((current) => (current + 1) % slides.length)}
            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full shadow-lg"
            style={{ background: "rgba(255,255,255,0.95)", color: "var(--color-ink)" }}
            aria-label="Next slide"
          >
            ›
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((slide, slideIndex) => (
              <button
                key={`${slide.title}-${slideIndex}`}
                type="button"
                onClick={() => setIndex(slideIndex)}
                className="h-2.5 rounded-full transition"
                style={{
                  width: slideIndex === index ? "2rem" : "0.625rem",
                  background: slideIndex === index ? "var(--home-accent-strong)" : "rgba(16,32,26,0.2)"
                }}
                aria-label={`Go to slide ${slideIndex + 1}`}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
