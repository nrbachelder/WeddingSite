import Honeycomb from "@/components/Honeycomb";
import { timeline } from "@/lib/timeline";

export default function OurStory() {
  return (
    <section className="px-4 pb-[40vh] md:px-8">
      <p className="mx-auto mb-8 max-w-md text-center font-serif text-lg italic text-muted">
        Scroll through our story &mdash; tap a photo to read more.
      </p>
      <Honeycomb moments={timeline} />
    </section>
  );
}
