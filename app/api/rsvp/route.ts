import { NextResponse } from "next/server";
import { rsvpClosed, site } from "@/content/site";
import { appendResponses, getParties, normalize, type ResponseRow } from "@/lib/sheets";
import { rateLimited } from "@/lib/rateLimit";

export type RsvpPayload = {
  partyId: string;
  guests: { name: string; attending: boolean; meal?: string }[];
  plusOne?: { name: string; meal?: string } | null;
  dietary?: string;
  song?: string;
  message?: string;
  email?: string;
  website?: string; // honeypot
};

const clip = (s: unknown, max = 500) => (typeof s === "string" ? s.trim().slice(0, max) : "");

export async function POST(req: Request) {
  if (rateLimited(req, 10)) return NextResponse.json({ error: "Too many tries — please wait a minute." }, { status: 429 });
  if (!site.rsvpOpen) return NextResponse.json({ error: "RSVPs aren't open yet." }, { status: 403 });
  if (rsvpClosed()) {
    return NextResponse.json({ error: "RSVPs are closed." }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as RsvpPayload | null;
  if (!body || !Array.isArray(body.guests)) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  // Bots fill the hidden field; pretend success
  if (body.website) return NextResponse.json({ ok: true });

  const party = (await getParties()).find((p) => p.id === body.partyId);
  if (!party) return NextResponse.json({ error: "Invalid party." }, { status: 400 });

  const allowed = new Set(party.guests.map((g) => normalize(`${g.first} ${g.last}`)));
  if (body.guests.length === 0 || body.guests.some((g) => !allowed.has(normalize(clip(g.name))))) {
    return NextResponse.json({ error: "Guest names don't match the invitation." }, { status: 400 });
  }
  if (body.plusOne && !party.allowPlusOne) {
    return NextResponse.json({ error: "This invitation doesn't include a plus-one." }, { status: 400 });
  }

  const shared = {
    partyId: party.id,
    dietary: clip(body.dietary),
    song: clip(body.song, 200),
    message: clip(body.message, 2000),
    email: clip(body.email, 200),
  };
  const rows: ResponseRow[] = body.guests.map((g) => ({
    ...shared,
    name: clip(g.name, 100),
    attending: Boolean(g.attending),
    meal: clip(g.meal, 100),
    isPlusOne: false,
  }));
  if (body.plusOne && clip(body.plusOne.name)) {
    rows.push({ ...shared, name: clip(body.plusOne.name, 100), attending: true, meal: clip(body.plusOne.meal, 100), isPlusOne: true });
  }

  await appendResponses(rows);
  return NextResponse.json({ ok: true });
}
