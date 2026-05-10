/**
 * whatsapp.js — Twilio WhatsApp webhook handler
 *
 * Endpoint: POST /whatsapp/incoming
 * Twilio sends inbound WhatsApp messages here.
 * We reply with TwiML (XML) which Twilio converts to a WhatsApp message.
 */

const express = require("express");
const twilio  = require("twilio");
const { chat, parseBookingTag, stripBookingTag, clearHistory } = require("./claude");
const { createBooking, buildConfirmationMessage } = require("./booking");

const router = express.Router();

// We use Twilio SDK only to SEND proactive messages (e.g. booking confirmation).
// Replies inside the webhook are done via TwiML XML response.
function getTwilioClient() {
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

/**
 * POST /whatsapp/incoming
 * Twilio calls this every time a customer sends a WhatsApp message.
 */
router.post("/incoming", async (req, res) => {
  const incomingMsg = (req.body.Body || "").trim();
  const senderId    = req.body.From || ""; // e.g. "whatsapp:+447700900000"

  console.log(`[whatsapp] Message from ${senderId}: ${incomingMsg}`);

  if (!incomingMsg) {
    return res.type("text/xml").send(twiml("Sorry, I didn't catch that. Could you try again?"));
  }

  try {
    // 1. Get Claude's reply
    const rawReply = await chat(senderId, incomingMsg);

    // 2. Check if Claude has collected all booking details
    const bookingData = parseBookingTag(rawReply);
    const cleanReply  = stripBookingTag(rawReply);

    if (bookingData) {
      // 3a. Fire off the booking to Make.com
      const result = await createBooking({ ...bookingData, channel: "whatsapp" });

      if (result.success) {
        // 3b. Clear conversation history — fresh start after booking
        clearHistory(senderId);

        // 3c. Send the clean reply first via TwiML, then a formatted confirmation via Twilio API
        res.type("text/xml").send(twiml(cleanReply));

        // Slight delay so the first message lands before the confirmation
        setTimeout(async () => {
          try {
            await sendWhatsApp(senderId, buildConfirmationMessage(bookingData));
          } catch (err) {
            console.error("[whatsapp] Failed to send confirmation message:", err.message);
          }
        }, 1500);
      } else {
        // Booking failed — tell the customer
        res.type("text/xml").send(twiml(`${cleanReply}\n\n⚠️ ${result.message}`));
      }
    } else {
      // 3b. Normal reply — no booking action needed
      res.type("text/xml").send(twiml(cleanReply));
    }
  } catch (err) {
    console.error("[whatsapp] Error processing message:", err);
    res.type("text/xml").send(
      twiml("Sorry, I'm having a little trouble right now. Please try again or call us on +44 161 832 4400 💙")
    );
  }
});

/**
 * Send a proactive WhatsApp message via Twilio (used for booking confirmations).
 */
async function sendWhatsApp(to, body) {
  const client = getTwilioClient();
  return client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to,
    body,
  });
}

/**
 * Wrap a text message in a TwiML <MessagingResponse>.
 */
function twiml(message) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`;
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

module.exports = router;
