"use client";

import { useEffect, useState } from "react";

export default function Countdown({ target }: { target: string }) {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setDays(Math.ceil((new Date(target).getTime() - Date.now()) / 86_400_000));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [target]);

  if (days === null) return <div className="h-[3em]" />;
  if (days <= 0) return <p className="font-serif text-[1.6em] italic">We&rsquo;re married!</p>;
  return (
    <div>
      <p className="text-[2.6em] leading-none font-light">{days}</p>
      <p className="mt-2 text-[0.6em] uppercase tracking-[0.3em] opacity-80">{days === 1 ? "day to go" : "days to go"}</p>
    </div>
  );
}
