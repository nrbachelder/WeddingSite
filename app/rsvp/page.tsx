import RsvpForm from "@/components/RsvpForm";
import { site } from "@/content/site";

export default function Rsvp() {
  return (
    <section className="px-4">
      {site.rsvpUrl ? <RsvpButton url={site.rsvpUrl} /> : site.rsvpOpen ? <RsvpForm /> : <RsvpSoon />}
    </section>
  );
}

// RSVP instructions plus a button that opens the RSVPify form in a new tab
function RsvpButton({ url }: { url: string }) {
  const steps = [
    `RSVPs open ${site.rsvpOpensLabel}. Your party will receive a formal invitation before then.`,
    "Tap the RSVP button below to open our RSVP page.",
    "Enter the first and last name of anyone in your party, as it appears on your invitation.",
    "You can then reply for everyone in your party at once.",
  ];
  return (
    <div className="mx-auto mt-6 mb-16 flex max-w-lg flex-col items-center rounded border-[1.5px] border-ink px-8 py-12 text-center">
      <h2 className="font-serif text-4xl italic">How to RSVP</h2>
      <ol className="mt-8 space-y-5 font-serif text-lg leading-snug">
        {steps.map((step, k) => (
          <li key={k}>
            <span className="mb-1 block font-sans text-xs tracking-[0.3em] text-magenta">{String(k + 1).padStart(2, "0")}</span>
            {step}
          </li>
        ))}
      </ol>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mt-10 rounded border-[1.5px] border-ink px-14 py-4 text-sm tracking-[0.35em] text-ink uppercase transition-colors duration-200 hover:bg-ink hover:text-paper focus-visible:bg-ink focus-visible:text-paper focus-visible:outline-none"
      >
        RSVP
      </a>
      {site.rsvpDeadlineLabel && <p className="mt-6 font-serif text-lg italic">Kindly reply by {site.rsvpDeadlineLabel}</p>}
    </div>
  );
}

// Save-the-date version of the tab, used when there's no RSVPify link and site.rsvpOpen is off
function RsvpSoon() {
  return (
    <div className="mx-auto mt-6 mb-16 flex max-w-lg flex-col items-center rounded border-[1.5px] border-ink px-8 py-12 text-center">
      <h2 className="font-serif text-4xl italic">RSVP coming soon</h2>
      <p className="mt-5 font-serif text-lg leading-relaxed">
        A formal invitation will follow. Once it arrives, you can RSVP right here.
      </p>
      <p className="mt-8 text-sm uppercase tracking-[0.25em]">
        {site.dateLabel} · {site.location}
      </p>
    </div>
  );
}
