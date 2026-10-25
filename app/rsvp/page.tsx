import RsvpForm from "@/components/RsvpForm";
import { site } from "@/content/site";

export default function Rsvp() {
  return <section className="px-4">{site.rsvpOpen ? <RsvpForm /> : <RsvpSoon />}</section>;
}

// Save-the-date version of the tab, until site.rsvpOpen is turned on
function RsvpSoon() {
  return (
    <div className="mx-auto mt-6 mb-16 flex max-w-lg flex-col items-center rounded border-[1.5px] border-magenta px-8 py-12 text-center">
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
