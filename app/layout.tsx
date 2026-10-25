import type { Metadata } from "next";
import { Cormorant_Garamond, Josefin_Sans } from "next/font/google";
import TabNav from "@/components/TabNav";
import { coupleFullNames, coupleNames, site } from "@/content/site";
import "./globals.css";

const josefin = Josefin_Sans({
  variable: "--font-josefin",
  subsets: ["latin"],
  weight: ["300", "400"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: coupleNames,
  description: `${coupleFullNames} · ${site.dateLabel} · Sarah P. Duke Gardens, ${site.location}`,
  // Keep the site out of search engines; guests get the link directly
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${josefin.variable} ${cormorant.variable} font-light antialiased`}>
        <header className="px-4 pt-10 pb-6 text-center sm:pt-14">
          <h1 className="text-2xl font-light uppercase text-ink tracking-[0.25em] sm:text-5xl sm:tracking-[0.3em]">{coupleNames}</h1>
          <p className="mt-3 font-serif text-lg italic text-muted">
            {site.dateLabel} · {site.location}
          </p>
          <div className="mt-8">
            <TabNav />
          </div>
        </header>
        <main className="pb-20">{children}</main>
        <footer className="pb-10 text-center font-serif italic text-muted">With love, {coupleFullNames}</footer>
      </body>
    </html>
  );
}
