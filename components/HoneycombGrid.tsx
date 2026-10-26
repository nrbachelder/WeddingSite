"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { hapticTick } from "@/lib/haptics";
import { buildLayout, introLayout, mobileIntroLayout, windingLayout } from "@/lib/honeycomb";
import { fillerTint } from "@/lib/timeline";

// Desktop: scroll distance that advances the zoom by one tile while the grid is pinned
const SCROLL_PER_TILE = 70;

/*
  How a tile reacts to the zoomed tile, by center distance in units of d (the distance between
  touching neighbors). Tiles touch along the line between centers when inradius sum == distance,
  and a hex's inradius is d/2 at scale 1. So with zoom Z, ring 1 needs (Z + s1) / 2 <= push1:
  1.35 + 0.78 = 2.13 <= 2.16. Outer rings shrink and move less, so they keep clear of ring 1.
*/
function fisheye(dist: number) {
  if (dist < 1.3) return { s: 0.78, push: 1.08 };
  if (dist < 2.3) return { s: 0.9, push: 1.03 };
  return { s: 0.95, push: 1 };
}

const sameOrder = (i: number) => i;

type Props = {
  count: number;
  /** Preferred desktop hex width in px */
  target: number;
  /** Sprinkle decorative color tiles evenly through the grid */
  withFillers?: boolean;
  /** Fixed cluster shape instead of a wrapping grid, e.g. [1, 2, 1] */
  columns?: number[];
  /**
    Our Story: start as a compact photo honeycomb that unfolds on the first scroll/tap into a
    path down the page (a zigzag on phones, rows winding back and forth on desktop),
    each photo with an outline caption box
  */
  timeline?: boolean;
  /** Timeline: where photo i sits in the intro honeycomb's reading order (default: i) */
  introOrder?: (i: number) => number;
  /** Caption shown in the zoomed photo's caption box */
  renderCaption?: (i: number) => ReactNode;
  className?: string;
  tint: (i: number) => string;
  label?: (i: number) => string;
  renderTile: (i: number, w: number) => ReactNode;
  /** Makes tiles buttons; otherwise a tap just zooms the tile */
  onSelect?: (i: number) => void;
  /** Zoom one tile at a time as the page scrolls; when false, tiles only zoom on hover/focus */
  zoomOnScroll?: boolean;
};

/*
  One tile is zoomed at a time, like hover:
  - Desktop: the grid pins in the middle of the screen and scrolling steps through tiles in order.
    The timeline isn't pinned: the row crossing the middle of the screen is stepped through along
    the path as it scrolls past.
  - Mobile: the tile nearest the middle of the screen is zoomed.
  A haptic tick plays each time the zoomed tile changes. Hover/tap still zooms a tile directly.
  With zoomOnScroll={false} none of that happens and only hover/focus zooms.
*/
export default function HoneycombGrid({
  count,
  target,
  withFillers = false,
  columns,
  timeline = false,
  introOrder = sameOrder,
  renderCaption,
  className = "",
  tint,
  label,
  renderTile,
  onSelect,
  zoomOnScroll = true,
}: Props) {
  const outer = useRef<HTMLDivElement>(null);
  // top: where the grid starts on the page, so the desktop intro fits the first screen
  const [size, setSize] = useState({ width: 0, vh: 900, top: 0 });
  const [mobile, setMobile] = useState(false);
  const [focused, setFocused] = useState<number | null>(zoomOnScroll ? 0 : null);
  const [hovered, setHovered] = useState<number | null>(null);
  // Filler colors are shuffled per visit; picked after mount so server and client HTML match
  const [seed, setSeed] = useState(0);
  const band = useRef<HTMLDivElement>(null);
  const [introDone, setIntroDone] = useState(false);
  // The tap that unfolds the intro shouldn't also open a photo
  const swallowClick = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => {
      // A resize can still be queued when the grid unmounts (e.g. switching tabs)
      const el = outer.current;
      if (!el) return;
      setMobile(mq.matches);
      const width = el.clientWidth;
      const vh = window.innerHeight;
      const top = el.getBoundingClientRect().top + window.scrollY;
      setSize((s) => (s.width === width && s.vh === vh && s.top === top ? s : { width, vh, top }));
    };
    update();
    setSeed(Math.floor(Math.random() * 2 ** 31));
    const ro = new ResizeObserver(update);
    ro.observe(outer.current!);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const intro = timeline && !introDone;
  const path = useMemo(() => windingLayout(count, size.width || 1200, size.vh), [count, size.width, size.vh]);
  const { cells, w, height } = useMemo(() => {
    if (timeline) {
      if (!intro || mobile) return path;
      // Desktop intro: photo i takes slot introOrder(i) of the honeycomb
      const g = introLayout(count, size.width || 1200, Math.max(300, size.vh - size.top - 24));
      const cells = Array.from({ length: count }, (_, i) => ({ ...g.cells[introOrder(i)], i }));
      return { cells, w: g.w, height: Math.max(...g.cells.map((c) => c.y)) + g.w * 0.866 };
    }
    return buildLayout(count, size.width || 1200, size.vh - 140, target, withFillers, columns, seed);
  }, [timeline, intro, mobile, path, count, size, target, withFillers, columns, seed, introOrder]);
  const pinned = zoomOnScroll && !timeline;
  const mobileIntro = useMemo(() => mobileIntroLayout(count), [count]);

  // Leave the intro on the first real scroll, and bring it back whenever the page returns to the
  // very top. (A tap-unfold at the top fires no scroll event, so it stays unfolded until scrolled.)
  useEffect(() => {
    if (!timeline) return;
    const onScroll = () => {
      if (window.scrollY > 8) setIntroDone(true);
      else if (window.scrollY <= 2) setIntroDone(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [timeline]);
  // Tiles take 750ms to glide between the intro and the zigzag, and offset* reads their in-between
  // spots, so the zoom is laid out again once they arrive
  const [settled, setSettled] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setSettled((n) => n + 1), 800);
    return () => clearTimeout(t);
  }, [intro]);
  const span = mobile || !pinned ? 0 : SCROLL_PER_TILE * (count - 1);
  const stickTop = Math.max(16, (size.vh - height) / 2);

  useEffect(() => {
    if (!zoomOnScroll) return;
    let frame = 0;
    let prev = -1;
    const measure = () => {
      frame = 0;
      // How far the pinned grid has been scrolled through
      const progress = span > 0 ? Math.min(1, Math.max(0, (stickTop - outer.current!.getBoundingClientRect().top) / span)) : 0;
      if (intro) {
        // Nothing is zoomed while the intro honeycomb is showing
        prev = -1;
        setFocused(null);
        return;
      }
      let next = 0;
      if (mobile) {
        const mid = window.innerHeight / 2;
        let best = Infinity;
        outer.current?.querySelectorAll<HTMLElement>("[data-i]").forEach((el) => {
          const r = el.getBoundingClientRect();
          const d = Math.abs(r.top + r.height / 2 - mid);
          if (d < best) {
            best = d;
            next = Number(el.dataset.i);
          }
        });
      } else if (timeline) {
        // A scan line sweeps the path top to bottom as the page scrolls top to bottom, so the first
        // photo is zoomed right after the intro unfolds and the last one at the bottom of the page.
        // Each row is stepped through in path order as the line crosses it. The line runs a quarter
        // row ahead (eased in from the top) so a row's last photo is reached before it scrolls off.
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const line = (scrollable > 0 ? window.scrollY / scrollable : 0) * height;
        const scan = (line + Math.min(line, path.pitch / 4)) / path.pitch;
        const rows = Math.ceil(count / path.perRow);
        const row = Math.min(rows - 1, Math.max(0, Math.floor(scan)));
        const frac = Math.min(0.999, Math.max(0, scan - row));
        const inRow = Math.min(path.perRow, count - row * path.perRow);
        next = row * path.perRow + Math.floor(frac * inRow);
      } else if (span > 0) {
        next = Math.min(count - 1, Math.floor(progress * count));
      }
      if (next !== prev) {
        // No tick on first paint, only when scrolling moves the zoom
        if (prev !== -1) hapticTick();
        prev = next;
        setFocused(next);
        setHovered(null);
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    // After the intro unfolds, re-measure once tiles have reached their new spots
    const settle = setTimeout(measure, 750);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(settle);
      window.removeEventListener("scroll", onScroll);
    };
  }, [zoomOnScroll, mobile, timeline, span, stickTop, count, height, intro, path.pitch, path.perRow]);

  const active = hovered ?? focused;
  const Tile = (onSelect ? "button" : "div") as "button";

  // Grow the active tile and shrink/push the rest away from it. Uses offset* geometry, which
  // ignores transforms, so it works for every layout (desktop grid, timeline, Info cluster).
  useLayoutEffect(() => {
    // Skip tiles hidden at this screen size
    const all = [...(band.current?.querySelectorAll<HTMLElement>(".slot, .mcap") ?? [])];
    all.forEach((el) => ["--tx", "--ty", "--s"].forEach((p) => el.style.removeProperty(p)));
    const visible = all.filter((el) => el.offsetParent !== null);
    // Caption boxes never resize; they only follow their photo's push so they stay with it
    // (phones: vertically only, since each label keeps to its column beside the photo)
    const slots = visible.filter((el) => el.classList.contains("slot"));
    const labels = visible.filter((el) => el.classList.contains("mcap"));
    const pushed = new Map<string, { tx: string; ty: string }>();
    const center = (el: HTMLElement) => [el.offsetLeft + el.offsetWidth / 2, el.offsetTop + el.offsetHeight / 2];
    const target = active === null ? null : band.current?.querySelector<HTMLElement>(`.slot[data-i="${active}"]`);
    if (!target) return;
    const zoom = Number(getComputedStyle(band.current!).getPropertyValue("--zoom")) || 1.35;
    const [x0, y0] = center(target);
    const d = Math.min(target.offsetWidth, target.offsetHeight);
    // Keep the grown tile on screen. Mobile tiles sit against the screen edge, so they stay inside
    // the grid; desktop tiles may grow into the page padding but not past the window edge.
    const half = (target.offsetWidth * zoom) / 2;
    const rect = band.current!.getBoundingClientRect();
    const minX = mobile ? 0 : 4 - rect.left;
    const maxX = mobile ? rect.width : window.innerWidth - 4 - rect.left;
    const shift = Math.max(0, minX - (x0 - half)) - Math.max(0, x0 + half - maxX);
    const ax = x0 + shift;
    const ay = y0;
    slots.forEach((el) => {
      if (el === target) {
        el.style.setProperty("--tx", `${shift}px`);
        el.style.setProperty("--ty", "0px");
        pushed.set(el.dataset.i!, { tx: `${shift}px`, ty: "0px" });
        el.style.setProperty("--s", String(zoom));
        return;
      }
      const [x, y] = center(el);
      const dist = Math.hypot(x - ax, y - ay) || 1;
      const { s, push } = fisheye(dist / d);
      // Near tiles also get a hard minimum distance, in case the edge shift moved the zoomed tile toward them
      const clear = dist / d < 1.3 ? ((zoom + s) / 2 + 0.02) * d : 0;
      const k = Math.max(dist * push, clear) / dist - 1;
      el.style.setProperty("--tx", `${(x - ax) * k}px`);
      el.style.setProperty("--ty", `${(y - ay) * k}px`);
      if (el.dataset.i !== undefined) pushed.set(el.dataset.i, { tx: `${(x - ax) * k}px`, ty: `${(y - ay) * k}px` });
      el.style.setProperty("--s", String(s));
    });
    labels.forEach((el) => {
      const p = pushed.get(el.dataset.cap ?? "");
      if (!p) return;
      el.style.setProperty("--ty", p.ty);
      if (!mobile) el.style.setProperty("--tx", p.tx);
    });
  }, [active, cells, mobile, size, settled]);

  return (
    <div ref={outer} className="relative" style={{ height: mobile ? undefined : height + span }}>
      <div
        className={pinned ? "md:sticky" : ""}
        style={{ top: stickTop }}
      >
        <div
          ref={band}
          className={`band ${timeline ? "band-timeline" : ""} ${intro ? "band-intro" : ""} ${className}`}
          data-active={active !== null ? "" : undefined}
          style={
            {
              "--w": `${w}px`,
              "--band-h": `${height}px`,
              "--n": count,
              "--irows": mobileIntro.rows,
              visibility: size.width ? "visible" : "hidden",
            } as CSSProperties
          }
          onMouseLeave={() => setHovered(null)}
          onPointerDownCapture={() => {
            if (!intro) return;
            swallowClick.current = true;
            setIntroDone(true);
          }}
        >
          {cells.map((cell) => {
            const pos = { "--x": `${cell.x}px`, "--y": `${cell.y}px` };
            if (cell.kind === "filler") {
              return (
                <div key={`f-${cell.k}`} aria-hidden className="slot filler" style={{ ...pos, background: cell.tint } as CSSProperties} />
              );
            }

            const { i } = cell;
            // Each photo's thin outline matches its caption box's color
            const ring = fillerTint(i, seed);
            const vars = {
              ...pos,
              "--i": i,
              "--odd": i % 2,
              "--mx": cell.mx,
              "--my": cell.my,
              "--ix": mobileIntro.photos[introOrder(i)]?.ix,
              "--iy": mobileIntro.photos[introOrder(i)]?.iy,
              "--tile": tint(i),
              "--ring": ring,
            } as CSSProperties;
            const isActive = active === i ? "is-active" : "";
            // Captions stay open once the scroll has reached their photo, and close again above it
            const isShown = timeline && !intro && focused !== null && i <= focused ? "is-shown" : "";
            return (
              <div key={i} className="contents">
                <Tile
                  data-i={i}
                  type={onSelect ? "button" : undefined}
                  tabIndex={onSelect ? undefined : 0}
                  aria-label={onSelect ? label?.(i) : undefined}
                  className={`slot hex ${isActive}`}
                  style={vars}
                  onMouseMove={() => hovered !== i && setHovered(i)}
                  onFocus={() => setHovered(i)}
                  onBlur={() => setHovered(null)}
                  onClick={() => {
                    if (swallowClick.current) {
                      swallowClick.current = false;
                      return;
                    }
                    if (onSelect) onSelect(i);
                    else setHovered(i);
                  }}
                >
                  {renderTile(i, path.w)}
                </Tile>
                {timeline && renderCaption && (
                  <div
                    data-cap={i}
                    aria-hidden
                    className={`mcap ${i % 2 ? "lane-b" : "lane-a"} ${isActive} ${isShown}`}
                    style={{ ...pos, "--i": i, "--odd": i % 2, "--tint": ring } as CSSProperties}
                    onClick={() => {
                      if (swallowClick.current) {
                        swallowClick.current = false;
                        return;
                      }
                      onSelect?.(i);
                    }}
                  >
                    {renderCaption(i)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
