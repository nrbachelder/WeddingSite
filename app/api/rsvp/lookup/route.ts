import { NextResponse } from "next/server";
import { site } from "@/content/site";
import { getParties, normalize } from "@/lib/sheets";
import { rateLimited } from "@/lib/rateLimit";

export async function GET(req: Request) {
  if (rateLimited(req)) return NextResponse.json({ error: "Too many tries — please wait a minute." }, { status: 429 });
  if (!site.rsvpOpen) return NextResponse.json({ error: "RSVPs aren't open yet." }, { status: 403 });

  const name = normalize(new URL(req.url).searchParams.get("name") ?? "");
  if (name.split(" ").length < 2) {
    return NextResponse.json({ error: "Please enter your first and last name." }, { status: 400 });
  }

  const parties = await getParties();
  const party = parties.find((p) => p.guests.some((g) => normalize(`${g.first} ${g.last}`) === name));
  if (!party) {
    return NextResponse.json(
      { error: "We couldn't find that name. Try the spelling on your invitation, or reach out to us." },
      { status: 404 },
    );
  }

  // Only ever return the matched party, never the full guest list
  return NextResponse.json({
    partyId: party.id,
    guests: party.guests.map((g) => `${g.first} ${g.last}`),
    allowPlusOne: party.allowPlusOne,
  });
}
