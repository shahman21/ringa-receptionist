/**
 * booking.js — Appointment booking via Make.com → Calendly
 *
 * Flow:
 *  1. We POST booking details to a Make.com webhook URL.
 *  2. Make.com scenario receives the data and creates a Calendly event
 *     (or sends an email / Google Calendar invite if preferred).
 *  3. Make.com can also send its own confirmation email to the customer.
 */

const axios = require("axios");

/**
 * Send booking details to the Make.com webhook.
 *
 * @param {object} booking
 * @param {string} booking.name      - Customer full name
 * @param {string} booking.service   - Service requested
 * @param {string} booking.datetime  - Preferred date and time (e.g. "Tuesday 15 April at 2pm")
 * @param {string} booking.phone     - Customer phone number
 * @param {string} booking.email     - Customer email address
 * @param {string} [booking.channel] - Where the booking came from: "voice" | "whatsapp"
 *
 * @returns {Promise<{ success: boolean, message: string }>}
 */
async function createBooking(booking) {
  const webhookUrl = process.env.MAKE_WEBHOOK_URL;

  if (!webhookUrl || webhookUrl.includes("your-webhook-id")) {
    console.warn("[booking] MAKE_WEBHOOK_URL not configured — booking skipped.");
    return {
      success: false,
      message: "Booking system not yet configured. Please call us directly.",
    };
  }

  const payload = {
    salon:    "Glow Salon",
    channel:  booking.channel || "unknown",
    name:     booking.name,
    service:  booking.service,
    datetime: booking.datetime,
    phone:    booking.phone,
    email:    booking.email,
    bookedAt: new Date().toISOString(),
  };

  try {
    await axios.post(webhookUrl, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });

    console.log(`[booking] Sent to Make.com for ${booking.name} — ${booking.service} at ${booking.datetime}`);

    return {
      success: true,
      message: `Booking request sent for ${booking.name} — ${booking.service} on ${booking.datetime}.`,
    };
  } catch (err) {
    console.error("[booking] Make.com webhook error:", err.message);
    return {
      success: false,
      message: "We had trouble confirming your booking. Please call us on +44 161 832 4400.",
    };
  }
}

/**
 * Build a WhatsApp confirmation message to send after a successful booking.
 */
function buildConfirmationMessage(booking) {
  return [
    `✅ *Booking Confirmed — Glow Salon*`,
    ``,
    `Hi ${booking.name}! Here's your appointment summary:`,
    ``,
    `💇 *Service:* ${booking.service}`,
    `📅 *Date & Time:* ${booking.datetime}`,
    ``,
    `📍 47 Deansgate, Manchester, M3 2AY`,
    ``,
    `We'll send a reminder closer to the time. To cancel or reschedule, please give us at least 24 hours' notice.`,
    ``,
    `See you soon! 💫 — Ringa & the Glow Salon team`,
  ].join("\n");
}

module.exports = { createBooking, buildConfirmationMessage };
