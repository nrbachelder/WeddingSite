import "server-only";
import { google } from "googleapis";

/*
  Google Sheet layout
    Guests    (A:F): party_id | first | last | allowed_plus_one | max_party_size | email
    Responses (A:J): timestamp | party_id | guest_name | attending | meal | dietary | song_request | message | email | is_plus_one

  Without GOOGLE_* env vars (local dev) a small in-memory guest list is used and
  responses are only logged, so the RSVP flow can be tried without credentials.
*/

export type Guest = { first: string; last: string };
export type Party = { id: string; guests: Guest[]; allowPlusOne: boolean };

export type ResponseRow = {
  partyId: string;
  name: string;
  attending: boolean;
  meal: string;
  dietary: string;
  song: string;
  message: string;
  email: string;
  isPlusOne: boolean;
};

const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID } = process.env;
const configured = Boolean(GOOGLE_SERVICE_ACCOUNT_EMAIL && GOOGLE_PRIVATE_KEY && GOOGLE_SHEET_ID);

const mockRows = [
  ["p1", "Jane", "Doe", "FALSE", "2"],
  ["p1", "John", "Doe", "FALSE", "2"],
  ["p2", "Alex", "Smith", "TRUE", "2"],
];

function client() {
  const auth = new google.auth.JWT({
    email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    // Vercel stores the key with literal "\n"
    key: GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

let cache: { at: number; parties: Party[] } | null = null;

export async function getParties(): Promise<Party[]> {
  if (cache && Date.now() - cache.at < 60_000) return cache.parties;

  let rows: string[][] = mockRows;
  if (configured) {
    const res = await client().spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEET_ID, range: "Guests!A2:F" });
    rows = (res.data.values ?? []) as string[][];
  }

  const byId = new Map<string, Party>();
  for (const [id, first = "", last = "", plusOne = ""] of rows) {
    if (!id || !first) continue;
    const party = byId.get(id) ?? { id, guests: [], allowPlusOne: false };
    party.guests.push({ first: first.trim(), last: last.trim() });
    if (/^(true|yes|y|1)$/i.test(plusOne.trim())) party.allowPlusOne = true;
    byId.set(id, party);
  }
  const parties = [...byId.values()];
  cache = { at: Date.now(), parties };
  return parties;
}

export async function appendResponses(rows: ResponseRow[]) {
  const timestamp = new Date().toISOString();
  const values = rows.map((r) => [
    timestamp,
    r.partyId,
    r.name,
    r.attending ? "yes" : "no",
    r.meal,
    r.dietary,
    r.song,
    r.message,
    r.email,
    r.isPlusOne ? "yes" : "",
  ]);

  if (!configured) {
    console.log("[rsvp] mock append", values);
    return;
  }
  await client().spreadsheets.values.append({
    spreadsheetId: GOOGLE_SHEET_ID,
    range: "Responses!A:J",
    valueInputOption: "RAW",
    requestBody: { values },
  });
}

export const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
