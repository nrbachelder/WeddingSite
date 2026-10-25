"use client";

import { useState, type FormEvent } from "react";
import { rsvpClosed, site } from "@/content/site";

type Party = { partyId: string; guests: string[]; allowPlusOne: boolean };
type GuestAnswer = { name: string; attending: boolean | null; meal: string };

const input =
  "w-full border-b border-ink/30 bg-transparent px-1 py-2 font-serif text-lg outline-none placeholder:text-ink/40 focus:border-magenta";
const label = "mb-1 block text-xs uppercase tracking-[0.2em] text-muted";
const primary =
  "border border-plum px-8 py-3 text-sm uppercase tracking-[0.25em] text-ink transition-colors hover:bg-plum hover:text-paper disabled:opacity-40";

function MealSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  if (site.mealOptions.length === 0) return null;
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={`${input} mt-2 text-base`} required>
      <option value="">Meal choice…</option>
      {site.mealOptions.map((m) => (
        <option key={m}>{m}</option>
      ))}
    </select>
  );
}

export default function RsvpForm() {
  const [name, setName] = useState("");
  const [party, setParty] = useState<Party | null>(null);
  const [answers, setAnswers] = useState<GuestAnswer[]>([]);
  const [plusOne, setPlusOne] = useState({ bringing: false, name: "", meal: "" });
  const [extra, setExtra] = useState({ dietary: "", song: "", message: "", email: "", website: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<"yes" | "no" | null>(null);

  async function lookup(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await fetch(`/api/rsvp/lookup?name=${encodeURIComponent(name)}`);
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error);
    setParty(data);
    setAnswers(data.guests.map((g: string) => ({ name: g, attending: null, meal: "" })));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (answers.some((a) => a.attending === null)) return setError("Please let us know for each guest.");
    setError("");
    setBusy(true);
    const res = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partyId: party!.partyId,
        guests: answers,
        plusOne: plusOne.bringing ? { name: plusOne.name, meal: plusOne.meal } : null,
        ...extra,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error);
    setDone(answers.some((a) => a.attending) ? "yes" : "no");
  }

  const update = (i: number, patch: Partial<GuestAnswer>) =>
    setAnswers((prev) => prev.map((a, j) => (j === i ? { ...a, ...patch } : a)));

  if (rsvpClosed()) {
    return <p className="text-center font-serif text-xl italic">RSVPs closed on {site.rsvpDeadlineLabel}. Please reach out to us directly.</p>;
  }

  if (done) {
    return (
      <div className="text-center">
        <p className="font-serif text-3xl italic">{done === "yes" ? "We can't wait to celebrate with you!" : "We'll miss you!"}</p>
        <p className="mt-3 font-serif text-lg text-muted">
          Your response has been recorded. Need to change it? Just submit again{site.rsvpDeadlineLabel && ` before ${site.rsvpDeadlineLabel}`}.
        </p>
      </div>
    );
  }

  if (!party) {
    return (
      <form onSubmit={lookup} className="mx-auto max-w-md text-center">
        <p className="mb-8 font-serif text-lg text-muted">
          Please enter the first and last name of one member of your party.
          {site.rsvpDeadlineLabel && ` Kindly reply by ${site.rsvpDeadlineLabel}.`}
        </p>
        <input
          className={`${input} text-center`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="First and last name"
          autoComplete="name"
          minLength={3}
          required
        />
        {error && <p className="mt-4 font-serif text-magenta">{error}</p>}
        <button type="submit" disabled={busy} className={`${primary} mt-8`}>
          {busy ? "Searching…" : "Find my invitation"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-lg space-y-8">
      <div className="space-y-6">
        {answers.map((a, i) => (
          <fieldset key={a.name} className="border-b border-ink/10 pb-6">
            <legend className="mb-3 font-serif text-2xl italic text-ink">{a.name}</legend>
            <div className="flex gap-3">
              {[
                { v: true, t: "Joyfully accepts" },
                { v: false, t: "Regretfully declines" },
              ].map((o) => (
                <button
                  key={o.t}
                  type="button"
                  aria-pressed={a.attending === o.v}
                  onClick={() => update(i, { attending: o.v })}
                  className={`flex-1 border px-3 py-2 text-xs uppercase tracking-[0.15em] transition-colors ${
                    a.attending === o.v ? "border-plum bg-plum text-paper" : "border-ink/30 hover:border-magenta"
                  }`}
                >
                  {o.t}
                </button>
              ))}
            </div>
            {a.attending && <MealSelect value={a.meal} onChange={(meal) => update(i, { meal })} />}
          </fieldset>
        ))}

        {party.allowPlusOne && (
          <fieldset className="border-b border-ink/10 pb-6">
            <label className="flex items-center gap-3 font-serif text-xl">
              <input
                type="checkbox"
                checked={plusOne.bringing}
                onChange={(e) => setPlusOne({ ...plusOne, bringing: e.target.checked })}
                className="h-4 w-4 accent-magenta"
              />
              I&rsquo;m bringing a guest
            </label>
            {plusOne.bringing && (
              <>
                <input
                  className={`${input} mt-3`}
                  placeholder="Guest's full name"
                  value={plusOne.name}
                  onChange={(e) => setPlusOne({ ...plusOne, name: e.target.value })}
                  required
                />
                <MealSelect value={plusOne.meal} onChange={(meal) => setPlusOne({ ...plusOne, meal })} />
              </>
            )}
          </fieldset>
        )}
      </div>

      {answers.some((a) => a.attending) && (
        <>
          <div>
            <label className={label} htmlFor="dietary">Dietary restrictions or allergies</label>
            <input id="dietary" className={input} value={extra.dietary} onChange={(e) => setExtra({ ...extra, dietary: e.target.value })} />
          </div>
          <div>
            <label className={label} htmlFor="song">A song that will get you on the dance floor</label>
            <input id="song" className={input} value={extra.song} onChange={(e) => setExtra({ ...extra, song: e.target.value })} />
          </div>
        </>
      )}
      <div>
        <label className={label} htmlFor="email">Email (for updates)</label>
        <input id="email" type="email" className={input} value={extra.email} onChange={(e) => setExtra({ ...extra, email: e.target.value })} />
      </div>
      <div>
        <label className={label} htmlFor="message">A note for the couple</label>
        <textarea id="message" rows={3} className={input} value={extra.message} onChange={(e) => setExtra({ ...extra, message: e.target.value })} />
      </div>
      {/* Honeypot: hidden from people, tempting to bots */}
      <input
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute left-[-9999px]"
        value={extra.website}
        onChange={(e) => setExtra({ ...extra, website: e.target.value })}
        name="website"
      />

      {error && <p className="text-center font-serif text-magenta">{error}</p>}
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => setParty(null)} className="text-sm tracking-[0.2em] text-muted hover:text-ink">
          ← NOT YOU?
        </button>
        <button type="submit" disabled={busy} className={primary}>
          {busy ? "Sending…" : "Send RSVP"}
        </button>
      </div>
    </form>
  );
}
