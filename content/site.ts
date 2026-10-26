// Single source of truth for wedding details. Replace every "TODO" value.

export const site = {
  couple: {
    first: { name: "Nick", last: "Bachelder" },
    second: { name: "Emma", last: "Livingston" },
  },
  // ISO date-time of the ceremony, in local venue time
  date: "2027-05-30T18:00:00",
  dateLabel: "May 30, 2027",
  location: "Durham, North Carolina",
  // Save-the-date mode: the RSVP tab shows a "coming soon" page and the RSVP API is off.
  // Flip to true when the invitations go out to bring back the full RSVP form.
  rsvpOpen: false,
  // RSVPify form, opened by the RSVP button on the RSVP tab (takes priority over the built-in form
  // and "coming soon"). Set to null to go back to the "coming soon" page.
  rsvpUrl: "https://nickandemma-wedding.rsvpify.com" as string | null,
  // When RSVPs open on RSVPify, shown in the RSVP instructions
  rsvpOpensLabel: "January 1, 2027",
  // TBD: set an ISO date (e.g. "2027-04-15") plus label to show the deadline and close the form after it
  rsvpDeadline: null as string | null,
  rsvpDeadlineLabel: "",

  // TBD: leave empty to hide the meal question on the RSVP form
  mealOptions: [] as string[],

  // Ceremony and reception are one event at the same venue
  events: [
    {
      name: "Ceremony & Reception",
      time: "6:00 – 11:00 PM",
      venue: "Sarah P. Duke Gardens",
      address: "420 Anderson St, Durham, NC 27708",
      mapUrl: "https://maps.google.com/?q=Sarah+P.+Duke+Gardens,+420+Anderson+St,+Durham,+NC+27708",
    },
  ],
  // TBD: the evening's schedule; null shows "to come"
  schedule: null as string | null,

  dressCode: "Garden formal.",

  contactEmail: "emmajanelivingston@gmail.com",

  travel: {
    airport: "Fly into Raleigh-Durham International Airport (RDU), about a 25-minute drive from Duke Gardens.",
    // TBD: there will be a room block; add { name, note, url } entries once it's set up
    hotels: [] as { name: string; note: string; url: string }[],
    // TBD: null shows "to come"
    parking: null as string | null,
  },

  // TBD: add { name, url } entries once the registry is set up
  registry: [] as { name: string; url: string }[],

  faq: [
    { q: "Can I bring a plus-one?", a: "Your invitation and RSVP will show who is included in your party." },
    { q: "Are kids welcome?", a: "We love your little ones, but our celebration will be adults only." },
    {
      q: "Is the ceremony indoors or outdoors?",
      a: "Outdoors in the gardens, weather permitting. If it rains, we'll move inside.",
    },
    {
      q: "What about food and dietary needs?",
      a: "There's a spot on the RSVP to share any dietary needs, and we'll make sure they're taken care of.",
    },
  ],
};

export const coupleNames = `${site.couple.first.name} & ${site.couple.second.name}`;
export const coupleFullNames = `${site.couple.first.name} ${site.couple.first.last} & ${site.couple.second.name} ${site.couple.second.last}`;

/** True once the RSVP deadline (end of that day) has passed; never true while the deadline is TBD */
export const rsvpClosed = () =>
  site.rsvpDeadline !== null && new Date() > new Date(`${site.rsvpDeadline}T23:59:59`);
