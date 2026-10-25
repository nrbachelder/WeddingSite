"use client";

import Image from "next/image";
import { useEffect } from "react";
import type { Moment } from "@/lib/timeline";

type Props = {
  moments: Moment[];
  index: number;
  onChange: (i: number) => void;
  onClose: () => void;
};

export default function Lightbox({ moments, index, onChange, onClose }: Props) {
  const m = moments[index];
  const prev = () => onChange((index - 1 + moments.length) % moments.length);
  const next = () => onChange((index + 1) % moments.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={m.title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-plum/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-full w-full max-w-3xl flex-col overflow-hidden bg-paper shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-[4/3] w-full shrink bg-[#f3ebe8]">
          {m.image ? (
            <Image src={m.image} alt={m.alt ?? m.title} fill sizes="768px" className="object-contain" />
          ) : (
            <span className="flex h-full items-center justify-center font-serif text-2xl italic text-ink/50">Photo coming soon</span>
          )}
        </div>
        <div className="px-6 py-5 sm:px-8">
          <p className="text-xs uppercase tracking-[0.2em] text-ink">{m.date}</p>
          <h2 className="mt-1 font-serif text-3xl italic text-ink">{m.title}</h2>
          <p className="mt-2 font-serif text-lg leading-relaxed text-ink">{m.caption}</p>
          <div className="mt-4 flex items-center justify-between text-sm tracking-[0.2em] text-muted">
            <button onClick={prev} className="hover:text-ink">← PREV</button>
            <span>
              {index + 1} / {moments.length}
            </span>
            <button onClick={next} className="hover:text-ink">NEXT →</button>
          </div>
        </div>
        <button onClick={onClose} aria-label="Close" className="absolute right-3 top-2 text-3xl leading-none text-ink/70 hover:text-ink">
          ×
        </button>
      </div>
    </div>
  );
}
