/**
 * Glow Salon — all static data used by Ringa (the AI receptionist).
 * Edit this file to customise the salon details, services, and prices.
 */

const SALON = {
  name: "Glow Salon",
  tagline: "Manchester's favourite hair salon",
  address: "47 Deansgate, Manchester, M3 2AY",
  phone: "+44 161 832 4400",
  email: "hello@glowsalon.co.uk",
  website: "www.glowsalon.co.uk",
  instagram: "@glowsalonmcr",

  hours: {
    Monday:    "9:00 AM – 6:00 PM",
    Tuesday:   "9:00 AM – 6:00 PM",
    Wednesday: "9:00 AM – 7:00 PM",
    Thursday:  "9:00 AM – 7:00 PM",
    Friday:    "9:00 AM – 7:00 PM",
    Saturday:  "8:30 AM – 6:00 PM",
    Sunday:    "Closed",
  },

  services: [
    // ── Cuts ──────────────────────────────────────────────────────────────────
    { name: "Women's Cut & Blow Dry",      duration: "60 min",  price: "£45–£65"  },
    { name: "Men's Cut & Style",           duration: "30 min",  price: "£25–£35"  },
    { name: "Children's Cut (under 12)",   duration: "30 min",  price: "£20"      },
    { name: "Dry Cut / Trim",              duration: "30 min",  price: "£30"      },

    // ── Colour ────────────────────────────────────────────────────────────────
    { name: "Full Head Colour",            duration: "90 min",  price: "£70–£95"  },
    { name: "Half Head Highlights",        duration: "90 min",  price: "£65–£85"  },
    { name: "Full Head Highlights/Balayage", duration: "120 min", price: "£95–£140" },
    { name: "Toner / Gloss",              duration: "45 min",  price: "£30–£40"  },
    { name: "Root Touch-Up",              duration: "60 min",  price: "£50–£60"  },

    // ── Treatments ────────────────────────────────────────────────────────────
    { name: "Keratin Smoothing Treatment", duration: "120 min", price: "£120–£150" },
    { name: "Deep Conditioning Treatment", duration: "30 min",  price: "£20–£25"  },
    { name: "Scalp Treatment",             duration: "30 min",  price: "£25"      },

    // ── Styling ───────────────────────────────────────────────────────────────
    { name: "Blow Dry",                    duration: "45 min",  price: "£30–£40"  },
    { name: "Occasion / Wedding Styling",  duration: "60 min",  price: "£60–£90"  },
    { name: "Hair-Up",                     duration: "60 min",  price: "£50–£70"  },
  ],

  faqs: [
    {
      q: "Do I need to book in advance?",
      a: "We recommend booking at least a few days ahead, especially for colour services. Walk-ins are welcome for cuts when we have availability.",
    },
    {
      q: "How do I cancel or reschedule?",
      a: "You can cancel or reschedule up to 24 hours before your appointment at no charge. Just reply to your confirmation message or call us.",
    },
    {
      q: "Do you do a patch test before colour?",
      a: "Yes! If it's your first colour with us (or it's been more than 12 months), we'll do a quick patch test 48 hours before your appointment.",
    },
    {
      q: "Is parking nearby?",
      a: "Yes — there's a NCP car park on Deansgate (5-minute walk) and on-street parking available on nearby side streets.",
    },
    {
      q: "Do you offer gift vouchers?",
      a: "Absolutely! Gift vouchers are available in-store or on our website for any amount. They make a lovely present.",
    },
    {
      q: "What products do you use?",
      a: "We use Wella Professionals colour and L'Oréal Professionnel treatments. We also stock a range of professional products for home use.",
    },
    {
      q: "Do you offer student discount?",
      a: "Yes — 10% off on Mondays and Tuesdays with a valid student ID.",
    },
  ],

  bookingNote: "Appointments can be booked via our online booking link or by speaking with our team.",
};

/**
 * Build a concise system-prompt context block so Ringa always has salon info.
 */
function buildSalonContext() {
  const hoursText = Object.entries(SALON.hours)
    .map(([day, hrs]) => `  ${day}: ${hrs}`)
    .join("\n");

  const servicesText = SALON.services
    .map((s) => `  • ${s.name} — ${s.duration} — ${s.price}`)
    .join("\n");

  const faqText = SALON.faqs
    .map((f) => `  Q: ${f.q}\n  A: ${f.a}`)
    .join("\n\n");

  return `
SALON INFORMATION
=================
Name:     ${SALON.name}
Address:  ${SALON.address}
Phone:    ${SALON.phone}
Email:    ${SALON.email}
Website:  ${SALON.website}
Instagram:${SALON.instagram}

OPENING HOURS
${hoursText}

SERVICES & PRICES
${servicesText}

FREQUENTLY ASKED QUESTIONS
${faqText}
`.trim();
}

module.exports = { SALON, buildSalonContext };
