"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { newestFirst, tintFor, type Moment } from "@/lib/timeline";
import HoneycombGrid from "./HoneycombGrid";
import Lightbox from "./Lightbox";

export default function Honeycomb({ moments: source }: { moments: Moment[] }) {
  const [open, setOpen] = useState<number | null>(null);
  // The timeline runs oldest to newest (indices below refer to this order); the intro honeycomb
  // still opens with the newest photo first
  const moments = useMemo(() => newestFirst(source).reverse(), [source]);
  const introOrder = useCallback((i: number) => moments.length - 1 - i, [moments.length]);

  return (
    <>
      <HoneycombGrid
        count={moments.length}
        target={215}
        timeline
        introOrder={introOrder}
        renderCaption={(i) => (
          <>
            {moments[i].date && <span className="text-[0.62rem] uppercase tracking-[0.18em]">{moments[i].date}</span>}
            <span className="font-serif text-base leading-tight italic">{moments[i].title}</span>
          </>
        )}
        tint={(i) => tintFor(i + 3)}
        label={(i) => `${moments[i].date}: ${moments[i].title}. Open photo.`}
        onSelect={setOpen}
        renderTile={(i, w) => {
          const m = moments[i];
          return m.image ? (
            <Image
              src={m.image}
              alt={m.alt ?? m.title}
              fill
              loading="eager"
              sizes={`(max-width: 767px) 50vw, ${Math.ceil(w * 1.3)}px`}
              className="object-cover"
              style={{ objectPosition: m.focal ?? "50% 50%" }}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center px-10 font-serif text-lg italic text-paper">
              {m.title}
            </span>
          );
        }}
      />

      {open !== null && <Lightbox moments={moments} index={open} onChange={setOpen} onClose={() => setOpen(null)} />}
    </>
  );
}
