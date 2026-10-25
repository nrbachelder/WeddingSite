"use client";

import { useEffect, type ReactNode } from "react";

export type InfoSection = { heading: string; body: ReactNode };

type Props = {
  title: string;
  color: string;
  sections: InfoSection[];
  onClose: () => void;
};

export default function InfoModal({ title, color, sections, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-full w-full max-w-lg overflow-y-auto bg-paper text-[#111] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-8 pt-8 pb-6 text-center" style={{ background: color }}>
          <h2 className="font-serif text-5xl italic">{title}</h2>
        </div>
        <div className="divide-y divide-black/10 px-8 py-2">
          {sections.map((s) => (
            <section key={s.heading} className="py-5 text-center">
              <h3 className="mb-2 text-xs uppercase tracking-[0.3em]">{s.heading}</h3>
              <div className="space-y-1 font-serif text-lg leading-snug">{s.body}</div>
            </section>
          ))}
        </div>
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-3 text-3xl leading-none hover:opacity-60">
          ×
        </button>
      </div>
    </div>
  );
}
