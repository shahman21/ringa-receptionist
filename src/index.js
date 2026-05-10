/**
 * index.js — Ringa Receptionist server
 *
 * Starts an Express server that handles:
 *  • Vapi voice webhooks  → /vapi/webhook & /vapi/tool
 *  • Twilio WhatsApp      → /whatsapp/incoming
 *  • Health check         → /health
 */

require("dotenv").config();

const express    = require("express");
const bodyParser = require("body-parser");
const vapiRouter = require("./vapi");
const whatsappRouter = require("./whatsapp");

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ─────────────────────────────────────────────────────────────────
// Twilio sends URL-encoded bodies; Vapi sends JSON.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use("/vapi",      vapiRouter);
app.use("/whatsapp",  whatsappRouter);

app.get("/health", (req, res) => {
  res.json({
    status:    "ok",
    assistant: "Ringa — Glow Salon AI Receptionist",
    uptime:    Math.floor(process.uptime()) + "s",
    timestamp: new Date().toISOString(),
  });
});

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║   Ringa — Glow Salon AI Receptionist             ║
║   Server running on port ${String(PORT).padEnd(22)}║
║                                                  ║
║   Vapi webhook:   /vapi/webhook                  ║
║   Vapi tool:      /vapi/tool                     ║
║   WhatsApp:       /whatsapp/incoming             ║
║   Health check:   /health                        ║
╚══════════════════════════════════════════════════╝
  `.trim());

  // Warn about missing env vars
  const required = [
    "ANTHROPIC_API_KEY",
    "VAPI_API_KEY",
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_WHATSAPP_FROM",
    "MAKE_WEBHOOK_URL",
    "SERVER_URL",
  ];
  const missing = required.filter((k) => !process.env[k] || process.env[k].includes("your-"));
  if (missing.length) {
    console.warn(`\n⚠️  Missing or placeholder env vars: ${missing.join(", ")}`);
    console.warn("   Copy .env.example → .env and fill in your keys.\n");
  }
});
