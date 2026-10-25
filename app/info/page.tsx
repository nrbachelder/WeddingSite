import InfoGrid from "@/components/InfoGrid";

export default function Info() {
  return (
    <section className="px-4 pb-16 md:px-8">
      <p className="mx-auto mb-8 max-w-md text-center font-serif text-lg italic text-muted">
        Tap a hexagon for the details.
      </p>
      <InfoGrid />
    </section>
  );
}
