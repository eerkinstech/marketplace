"use client";

import Link from "next/link";
import { useAccessToken } from "@/lib/auth/use-access-token";

export default function AdminSlidersPage() {
  const { error: authError } = useAccessToken(
    "Login with an admin account to manage homepage sliders."
  );

  return (
    <section className="container page-section stack">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9a6b36]">Admin Panel</div>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-slate-900">Sliders</h1>
        <p className="mt-2 text-slate-600">
          Homepage sliders and banners are now managed from the collections editor.
        </p>
      </div>

      {authError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          {authError}
        </div>
      ) : null}

      <div className="rounded-[28px] border border-black/6 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <h2 className="text-2xl font-black text-slate-900">Use Collections For Homepage Content</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Create hero sliders, split banners, product rows, and category rows from `Admin / Collections`. This keeps the entire homepage structure in one place.
        </p>
        <Link href="/admin/collections" className="mt-6 inline-flex rounded-2xl bg-[#111111] px-5 py-3 text-sm font-semibold text-white">
          Open Collections
        </Link>
      </div>
    </section>
  );
}
