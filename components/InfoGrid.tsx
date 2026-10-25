"use client";

import { useState } from "react";
import { site } from "@/content/site";
import Countdown from "./Countdown";
import HoneycombGrid from "./HoneycombGrid";
import InfoModal, { type InfoSection } from "./InfoModal";

type InfoItem = {
  word: string;
  color: string;
  /** Short line shown when the hexagon is zoomed */
  teaser: string;
  /** Full info, shown in the popup */
  sections: InfoSection[];
};

const link = "underline decoration-current/40 underline-offset-4 hover:decoration-current";
const mapLink = `inline-block text-sm tracking-[0.15em] uppercase ${link}`;

function buildItems(): InfoItem[] {
  return [
    {
      word: "When",
      color: "var(--rose)",
      teaser: `${site.dateLabel}`,
      sections: [
        {
          heading: "Date",
          body: (
            <>
              <p className="text-2xl italic">{site.dateLabel}</p>
              <div className="text-base">
                <Countdown target={site.date} />
              </div>
            </>
          ),
        },
        ...site.events.map((e) => ({ heading: e.name, body: <p>{e.time}</p> })),
        {
          heading: "RSVP",
          body: (
            <p>
              {!site.rsvpOpen
                ? "Formal invitation to follow"
                : site.rsvpDeadlineLabel
                  ? `Kindly reply by ${site.rsvpDeadlineLabel}`
                  : "RSVP deadline to come"}
            </p>
          ),
        },
      ],
    },
    {
      word: "Where",
      color: "var(--lime)",
      teaser: site.events[0].venue,
      sections: site.events.map((e) => ({
        heading: e.name,
        body: (
          <>
            <p className="italic">{e.venue}</p>
            <p>{e.address}</p>
            <a href={e.mapUrl} target="_blank" rel="noreferrer" className={mapLink}>
              Map
            </a>
          </>
        ),
      })),
    },
    {
      word: "Travel",
      color: "var(--tangerine)",
      teaser: "Getting here & where to stay",
      sections: [
        { heading: "Getting there", body: <p>{site.travel.airport}</p> },
        {
          heading: "Where to stay",
          body: (
            <>
              {site.travel.hotels.map((h) => (
                <p key={h.name}>
                  <a href={h.url} target="_blank" rel="noreferrer" className={`italic ${link}`}>
                    {h.name}
                  </a>
                  <span className="block">{h.note}</span>
                </p>
              ))}
            </>
          ),
        },
        { heading: "Parking", body: <p>{site.travel.parking}</p> },
      ],
    },
    {
      word: "FAQ",
      color: "var(--olive)",
      teaser: "Attire, registry & more",
      sections: [
        { heading: "What should I wear?", body: <p>{site.dressCode}</p> },
        {
          heading: "Where are you registered?",
          body: (
            <>
              {site.registry.map((r) => (
                <a key={r.name} href={r.url} target="_blank" rel="noreferrer" className={`block italic ${link}`}>
                  {r.name}
                </a>
              ))}
            </>
          ),
        },
        ...site.faq.map((f) => ({ heading: f.q, body: <p>{f.a}</p> })),
      ],
    },
  ];
}

// When | Where over Travel | FAQ
const CLUSTER = [1, 2, 1];

export default function InfoGrid() {
  const items = buildItems();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <HoneycombGrid
        count={items.length}
        target={360}
        columns={CLUSTER}
        zoomOnScroll={false}
        className="band-info"
        tint={(i) => items[i].color}
        label={(i) => `${items[i].word}: open details`}
        onSelect={setOpen}
        renderTile={(i) => (
          <div className="info-tile">
            <div className="info-face info-summary">
              <p className="info-word">{items[i].word}</p>
            </div>
            <div className="info-face info-details">
              <p className="info-word">{items[i].word}</p>
              <p>{items[i].teaser}</p>
              <p className="info-hint">Tap for details</p>
            </div>
          </div>
        )}
      />
      {open !== null && (
        <InfoModal title={items[open].word} color={items[open].color} sections={items[open].sections} onClose={() => setOpen(null)} />
      )}
    </>
  );
}
