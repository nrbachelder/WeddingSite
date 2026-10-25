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
  // TBD: set an ISO date (e.g. "2027-04-15") plus label to show the deadline and close the form after it
  rsvpDeadline: null as string | null,
  rsvpDeadlineLabel: "",

  // TBD: leave empty to hide the meal question on the RSVP form
  mealOptions: [] as string[],

  events: [
    {
      name: "Ceremony",
      time: "6:00 PM",
      venue: "Sarah P. Duke Gardens",
      address: "420 Anderson St, Durham, NC 27708",
      mapUrl: "https://maps.google.com/?q=Sarah+P.+Duke+Gardens,+420+Anderson+St,+Durham,+NC+27708",
    },
    {
      name: "Reception",
      time: "To follow",
      venue: "TODO Venue Name",
      address: "TODO Street, City, State",
      mapUrl: "https://maps.google.com/?q=TODO",
    },
  ],

  dressCode: "TODO — e.g. Garden formal. Expect grass, so block heels are your friend.",

  travel: {
    airport: "TODO — nearest airport and approximate drive time.",
    hotels: [
      {
        name: "TODO Hotel",
        note: "Room block under TODO through TODO date.",
        url: "https://example.com",
      },
    ],
    parking: "TODO — parking / shuttle details.",
  },

  registry: [{ name: "TODO Registry", url: "https://example.com" }],

  faq: [
    { q: "Can I bring a plus-one?", a: "Your invitation and RSVP will show who is included in your party." },
    { q: "Are kids welcome?", a: "TODO" },
    { q: "When should I RSVP by?", a: "RSVP deadline to come — we'll update this page soon." },
    { q: "Is the venue indoors or outdoors?", a: "TODO" },
  ],
};

export const coupleNames = `${site.couple.first.name} & ${site.couple.second.name}`;
export const coupleFullNames = `${site.couple.first.name} ${site.couple.first.last} & ${site.couple.second.name} ${site.couple.second.last}`;

/** True once the RSVP deadline (end of that day) has passed; never true while the deadline is TBD */
export const rsvpClosed = () =>
  site.rsvpDeadline !== null && new Date() > new Date(`${site.rsvpDeadline}T23:59:59`);
