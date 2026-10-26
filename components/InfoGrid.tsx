"use client";

import { useState, type ReactNode } from "react";
import { site } from "@/content/site";
import Countdown from "./Countdown";
import HoneycombGrid from "./HoneycombGrid";
import InfoModal, { type InfoSection } from "./InfoModal";

type InfoItem = {
  word: string;
  color: string;
  /** Short line shown on the hexagon under its word */
  teaser: ReactNode;
  /** Full info, shown in the popup */
  sections: InfoSection[];
};

const link = "underline decoration-current/40 underline-offset-4 hover:decoration-current";
const mapLink = `inline-block text-sm tracking-[0.15em] uppercase ${link}`;

// Placeholder for details that aren't set yet
const soon = (text: string) => <p className="italic">{text}</p>;
const rsvpLine = `RSVPs open ${site.rsvpOpensLabel} on the RSVP tab. ${
  site.rsvpDeadlineLabel ? `Kindly reply by ${site.rsvpDeadlineLabel}.` : "The reply-by date is to come."
}`;
const email = (
  <a href={`mailto:${site.contactEmail}`} className={link}>
    {site.contactEmail}
  </a>
);

function buildItems(): InfoItem[] {
  return [
    {
      word: "When",
      color: "var(--rose)",
      teaser: (
        <>
          {site.dateLabel}
          <br />
          {site.events[0].time}
        </>
      ),
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
        { heading: "Schedule", body: site.schedule ? <p>{site.schedule}</p> : soon("Full schedule to come.") },
        { heading: "RSVP", body: <p>{site.rsvpOpen || site.rsvpUrl ? rsvpLine : "Formal invitation to follow"}</p> },
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
          body: site.travel.hotels.length ? (
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
          ) : (
            soon("We’ll have a hotel room block — details to come.")
          ),
        },
        { heading: "Parking", body: site.travel.parking ? <p>{site.travel.parking}</p> : soon("Parking details to come.") },
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
          body: site.registry.length ? (
            <>
              {site.registry.map((r) => (
                <a key={r.name} href={r.url} target="_blank" rel="noreferrer" className={`block italic ${link}`}>
                  {r.name}
                </a>
              ))}
            </>
          ) : (
            soon("Registry details to come.")
          ),
        },
        { heading: "When should I RSVP?", body: <p>{rsvpLine}</p> },
        ...site.faq.map((f) => ({ heading: f.q, body: <p>{f.a}</p> })),
        { heading: "Other questions?", body: <p>Reach out to Emma at {email}.</p> },
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
