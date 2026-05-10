/**
 * vapi.js — Vapi voice webhook handler
 *
 * Vapi calls these endpoints during a live call:
 *
 *  POST /vapi/webhook   — General call lifecycle events (call-started, call-ended, etc.)
 *  POST /vapi/tool      — Tool/function calls made by the assistant during a call
 *
 * The AI (Claude) is configured directly in the Vapi assistant — Vapi handles
 * the speech-to-text → Claude → text-to-speech pipeline automatically.
 * We only need to handle tool calls (e.g. book_appointment).
 */

const express  = require("express");
const twilio   = require("twilio");
const { createBooking, buildConfirmationMessage } = require("./booking");

const router = express.Router();

// ── General call lifecycle webhook ────────────────────────────────────────────

/**
 * POST /vapi/webhook
 * Receives call events: call-started, call-ended, transcript, etc.
 */
router.post("/webhook", (req, res) => {
  const event = req.body?.message?.type || req.body?.type || "unknown";
  console.log(`[vapi] Event: ${event}`);

  // Log the final transcript when a call ends
  if (event === "end-of-call-report" || event === "call-ended") {
    const transcript = req.body?.message?.transcript || req.body?.transcript;
    if (transcript) {
      console.log(`[vapi] Transcript:\n${transcript}`);
    }
  }

  res.json({ received: true });
});

// ── Tool call handler ─────────────────────────────────────────────────────────

/**
 * POST /vapi/tool
 * Vapi calls this when the assistant invokes a tool (function call).
 * We process the call and return the result as JSON.
 */
router.post("/tool", async (req, res) => {
  const body = req.body;

  // Vapi tool call format
  const toolCallList = body?.message?.toolCallList || [];

  if (!toolCallList.length) {
    return res.json({ results: [] });
  }

  const results = [];

  for (const toolCall of toolCallList) {
    const fnName = toolCall?.function?.name;
    let args = {};

    try {
      args = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } catch {
      args = {};
    }

    console.log(`[vapi] Tool call: ${fnName}`, args);

    let result = "Sorry, I couldn't complete that action.";

    if (fnName === "book_appointment") {
      result = await handleBookAppointment(args, body?.message?.call);
    } else if (fnName === "get_availability") {
      result = handleGetAvailability(args);
    }

    results.push({
      toolCallId: toolCall.id,
      result,
    });
  }

  res.json({ results });
});

// ── Tool implementations ───────────────────────────────────────────────────────

/**
 * book_appointment tool — called by Vapi/Claude when it has collected all details.
 */
async function handleBookAppointment(args, callMeta) {
  const { name, service, datetime, phone, email } = args;

  const booking = await createBooking({
    name:     name     || "Guest",
    service:  service  || "haircut",
    datetime: datetime || "to be confirmed",
    phone:    phone    || (callMeta?.customer?.number || "not provided"),
    email:    email    || "not provided",
    channel:  "voice",
  });

  // If customer gave a mobile, send WhatsApp confirmation
  const customerPhone = phone || callMeta?.customer?.number;
  if (booking.success && customerPhone) {
    setTimeout(() => {
      sendWhatsAppConfirmation(customerPhone, { name, service, datetime, phone, email });
    }, 2000);
  }

  if (booking.success) {
    return (
      `Great news! I've sent a booking request for ${name} — ${service} on ${datetime}. ` +
      `You'll receive a confirmation shortly. Is there anything else I can help you with?`
    );
  } else {
    return (
      `I'm sorry, I wasn't able to complete the booking right now. ` +
      `Please call us on 0161 832 4400 and our team will get you booked in. ` +
      `Apologies for the inconvenience!`
    );
  }
}

/**
 * get_availability tool — placeholder; in a real integration you'd query Calendly's API.
 */
function handleGetAvailability({ date } = {}) {
  // Placeholder — real implementation would call Calendly's availability API.
  return (
    `We have availability throughout the week. Popular slots are morning appointments ` +
    `(9am–12pm) and early afternoon (1pm–3pm). Would you like me to book a specific time for you?`
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function sendWhatsAppConfirmation(rawPhone, bookingData) {
  // Normalise to E.164 if needed
  let phone = rawPhone.replace(/\s+/g, "");
  if (!phone.startsWith("+")) phone = `+${phone}`;
  const to = `whatsapp:${phone}`;

  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to,
      body: buildConfirmationMessage(bookingData),
    });
    console.log(`[vapi] Sent WhatsApp confirmation to ${to}`);
  } catch (err) {
    console.error(`[vapi] Could not send WhatsApp confirmation to ${to}:`, err.message);
  }
}

module.exports = router;
