"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function ChevronIcon({ direction = "left" }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 ${direction === "right" ? "rotate-180" : ""}`}
      aria-hidden="true"
    >
      <path d="M12.5 4.5 7 10l5.5 5.5" />
    </svg>
  );
}

function resolveSlideColors(slide = {}) {
  return {
    background:
      slide.backgroundColor ||
      "linear-gradient(135deg, color-mix(in srgb, var(--white) 97%, var(--secondary)) 0%, color-mix(in srgb, var(--background) 94%, var(--white)) 52%, color-mix(in srgb, var(--secondary) 58%, var(--white)) 100%)",
    color: slide.textColor || "var(--black)",
    accent: slide.accentColor || "var(--primary)"
  };
}

export function HomeHeroSlider({ slides = [] }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState("right");

  useEffect(() => {
    if (slides.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setDirection("right");
      setIndex((current) => (current + 1) % slides.length);
    }, 10000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) return null;

  const active = slides[index];
  const colors = resolveSlideColors(active);

  return (
    <section
      className="relative overflow-hidden rounded-[30px] border"
      style={{
        background: colors.background,
        color: colors.color,
        borderColor: "var(--color-line)",
        boxShadow: "0 20px 44px color-mix(in srgb, var(--text) 9%, transparent)",
        transition: "background 600ms ease, color 400ms ease"
      }}
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-[-10%] w-[28%] rounded-full blur-3xl"
        style={{ background: "color-mix(in srgb, var(--accent) 8%, transparent)" }}
      />
      <div
        className="pointer-events-none absolute inset-y-[-18%] right-[-8%] w-[30%] rounded-full blur-3xl"
        style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)" }}
      />

      <div
        key={`slide-${index}`}
        className="grid min-h-[270px] gap-6 p-5 md:min-h-[300px] md:grid-cols-[minmax(0,1fr)_320px] md:px-10 md:pb-6 lg:min-h-[320px] lg:grid-cols-[minmax(0,1fr)_380px] lg:px-12"
        style={{
          animation:
            direction === "right"
              ? "heroSlideFromRight 900ms cubic-bezier(0.22, 1, 0.36, 1)"
              : "heroSlideFromLeft 900ms cubic-bezier(0.22, 1, 0.36, 1)"
        }}
      >
        <div
          className="relative z-[2] flex max-w-[550px] flex-col justify-center"
        >
          {active.eyebrow ? (
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.22em]"
              style={{ color: "color-mix(in srgb, var(--primary) 82%, var(--text))" }}
            >
              {active.eyebrow}
            </div>
          ) : null}

          <h1 className="mt-3 text-[30px] font-black leading-[1.02] tracking-[-0.045em] md:text-[38px] lg:text-[46px]">
            {active.title}
          </h1>

          {active.subtitle ? (
            <p
              className="mt-4 max-w-[30rem] text-[15px] leading-6 md:text-[17px]"
              style={{ color: "color-mix(in srgb, var(--text) 80%, var(--white))" }}
            >
              {active.subtitle}
            </p>
          ) : null}

          {active.href ? (
            <div className="mt-5">
              <Link
                href={active.href}
                className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold transition hover:-translate-y-0.5"
                style={{
                  background: "var(--black)",
                  color: "var(--white)",
                  boxShadow: "0 12px 22px color-mix(in srgb, var(--black) 14%, transparent)"
                }}
              >
                {active.label || "Shop now"}
              </Link>
            </div>
          ) : null}
        </div>

        <div
          className="relative z-[2] hidden items-center justify-center md:flex"
        >
          <div
            className="w-full max-w-[320px] overflow-hidden rounded-[26px] border bg-white p-3 shadow-[0_20px_36px_rgba(15,23,42,0.12)] lg:max-w-[360px]"
            style={{ borderColor: "color-mix(in srgb, var(--text) 8%, transparent)" }}
          >
            <div
              className="aspect-[1.1/0.9] overflow-hidden rounded-[20px]"
              style={{ background: "color-mix(in srgb, var(--secondary) 68%, var(--white))" }}
            >
              {active.imageUrl ? (
                <img
                  src={active.imageUrl}
                  alt={active.title || "Hero slide"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm font-semibold">
                  {active.title}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {slides.length > 1 ? (
        <>
          <button
            type="button"
            onClick={() => {
              setDirection("left");
              setIndex((current) => (current - 1 + slides.length) % slides.length);
            }}
            className="absolute left-1 top-1/2 z-[4] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border transition hover:scale-[1.03] md:left-1.5"
            style={{
              background: "color-mix(in srgb, var(--white) 95%, transparent)",
              borderColor: "color-mix(in srgb, var(--text) 10%, transparent)",
              color: "var(--primary)",
              boxShadow: "0 10px 20px color-mix(in srgb, var(--text) 9%, transparent)"
            }}
            aria-label="Previous slide"
          >
            <ChevronIcon direction="left" />
          </button>

          <button
            type="button"
            onClick={() => {
              setDirection("right");
              setIndex((current) => (current + 1) % slides.length);
            }}
            className="absolute right-1 top-1/2 z-[4] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border transition hover:scale-[1.03] md:right-1.5"
            style={{
              background: "color-mix(in srgb, var(--white) 95%, transparent)",
              borderColor: "color-mix(in srgb, var(--text) 10%, transparent)",
              color: "var(--primary)",
              boxShadow: "0 10px 20px color-mix(in srgb, var(--text) 9%, transparent)"
            }}
            aria-label="Next slide"
          >
            <ChevronIcon direction="right" />
          </button>

          <div className="absolute bottom-2 left-1/2 z-[4] flex -translate-x-1/2 items-center gap-2.5">
            {slides.map((slide, slideIndex) => (
              <button
                key={`${slide.title}-${slideIndex}`}
                type="button"
                onClick={() => {
                  setDirection(slideIndex > index ? "right" : "left");
                  setIndex(slideIndex);
                }}
                className="h-2.5 rounded-full border transition"
                style={{
                  width: slideIndex === index ? "0.85rem" : "0.65rem",
                  background:
                    slideIndex === index
                      ? "var(--text)"
                      : "color-mix(in srgb, var(--white) 96%, transparent)",
                  borderColor:
                    slideIndex === index
                      ? "var(--text)"
                      : "color-mix(in srgb, var(--text) 22%, transparent)"
                }}
                aria-label={`Go to slide ${slideIndex + 1}`}
              />
            ))}
          </div>
        </>
      ) : null}

      <style jsx>{`
        @keyframes heroSlideFromRight {
          0% {
            transform: translateX(56px);
          }
          100% {
            transform: translateX(0);
          }
        }

        @keyframes heroSlideFromLeft {
          0% {
            transform: translateX(-56px);
          }
          100% {
            transform: translateX(0);
          }
        }
      `}</style>
    </section>
  );
}
