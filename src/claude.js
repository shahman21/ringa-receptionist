/**
 * claude.js — Claude AI integration
 *
 * Used directly for WhatsApp conversations.
 * (For Vapi voice calls, Claude is invoked via Vapi's built-in Anthropic integration.)
 */

const Anthropic = require("@anthropic-ai/sdk");
const { buildSalonContext } = require("./salon-data");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Ringa, the friendly and professional AI receptionist for Glow Salon — a top-rated hair salon at 47 Deansgate, Manchester.

Your job is to:
1. Warmly greet customers and answer questions about the salon.
2. Help customers book appointments by collecting: their name, desired service, preferred date and time, mobile number, and email address.
3. Answer FAQs about opening hours, prices, services, parking, and policies.
4. Keep responses concise and conversational — this is WhatsApp, not email.
5. If you cannot answer something, apologise and offer to pass the message on to the team.

IMPORTANT BOOKING FLOW:
- When a customer wants to book, collect these details one or two at a time (not all at once).
- Once you have all 5 details (name, service, date/time, phone, email), confirm the booking summary back to them.
- End your message with exactly this tag on its own line so the system can trigger the booking:
  [BOOK_APPOINTMENT: name=<name> | service=<service> | datetime=<datetime> | phone=<phone> | email=<email>]

TONE:
- Warm, professional, and friendly — like a real salon receptionist.
- Use British English (e.g. "colour" not "color", "organised" not "organized").
- Keep messages short (2–4 sentences). WhatsApp readers skim.
- Use emojis sparingly (1–2 max per message).

${buildSalonContext()}
`;

// In-memory conversation store keyed by WhatsApp number.
// In production, replace with Redis or a database.
const conversationStore = new Map();

const MAX_HISTORY = 20; // keep last 20 messages per conversation

/**
 * Get or create conversation history for a WhatsApp sender.
 */
function getHistory(senderId) {
  if (!conversationStore.has(senderId)) {
    conversationStore.set(senderId, []);
  }
  return conversationStore.get(senderId);
}

/**
 * Clear conversation history (e.g. after a booking is confirmed).
 */
function clearHistory(senderId) {
  conversationStore.delete(senderId);
}

/**
 * Send a message to Claude and return the reply text.
 * @param {string} senderId   - WhatsApp number (used as conversation key)
 * @param {string} userMessage - The incoming message text
 * @returns {Promise<string>} - Claude's reply
 */
async function chat(senderId, userMessage) {
  const history = getHistory(senderId);

  // Append new user message
  history.push({ role: "user", content: userMessage });

  // Trim to max history window
  while (history.length > MAX_HISTORY) {
    history.shift();
  }

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: history,
  });

  const assistantMessage = response.content[0].text;

  // Append assistant reply to history
  history.push({ role: "assistant", content: assistantMessage });

  return assistantMessage;
}

/**
 * Parse the booking tag that Claude embeds when it has all details.
 * Returns a booking object or null if no tag found.
 */
function parseBookingTag(text) {
  const match = text.match(
    /\[BOOK_APPOINTMENT:\s*name=(.+?)\s*\|\s*service=(.+?)\s*\|\s*datetime=(.+?)\s*\|\s*phone=(.+?)\s*\|\s*email=(.+?)\]/i
  );
  if (!match) return null;

  return {
    name:     match[1].trim(),
    service:  match[2].trim(),
    datetime: match[3].trim(),
    phone:    match[4].trim(),
    email:    match[5].trim(),
  };
}

/**
 * Strip the [BOOK_APPOINTMENT: ...] tag from Claude's reply before sending to customer.
 */
function stripBookingTag(text) {
  return text.replace(/\[BOOK_APPOINTMENT:[^\]]+\]/gi, "").trim();
}

module.exports = { chat, parseBookingTag, stripBookingTag, clearHistory };
