/**
 * setup-vapi.js — Creates (or updates) the Ringa assistant on Vapi
 *
 * Run once:  npm run setup:vapi
 *
 * This script will:
 *  1. Create the Ringa assistant with Claude as the AI model.
 *  2. Print the assistant ID — copy it into your .env as VAPI_ASSISTANT_ID.
 *  3. If VAPI_ASSISTANT_ID is already set, it updates the existing assistant.
 *
 * After creating the assistant, go to https://dashboard.vapi.ai → Phone Numbers
 * and assign a phone number to this assistant.
 */

require("dotenv").config();

const axios = require("axios");
const { buildSalonContext } = require("../src/salon-data");

const VAPI_BASE = "https://api.vapi.ai";

const systemPrompt = `You are Ringa, the friendly and professional AI receptionist for Glow Salon — a top-rated hair salon at 47 Deansgate, Manchester.

You speak to customers who are calling the salon on the phone. Your job is to:
1. Greet callers warmly and find out how you can help.
2. Answer questions about services, prices, opening hours, location, and policies.
3. Book appointments by collecting the customer's: full name, desired service, preferred date and time, mobile number, and email address.
4. Confirm the appointment details back to the customer before booking.
5. Keep the conversation natural and concise — this is a phone call.

BOOKING FLOW:
- Ask for one or two details at a time, naturally.
- Once you have all 5 details, say something like "Let me confirm that for you…" then summarise the appointment and ask them to confirm.
- Once they confirm, call the book_appointment function.
- After booking, tell them a WhatsApp confirmation will be sent to their mobile.

TONE:
- Warm, professional, and upbeat — like a great salon receptionist.
- Use British English.
- Be concise — avoid long speeches. Phone callers are busy.

${buildSalonContext()}
`;

const assistantConfig = {
  name: "Ringa — Glow Salon",

  firstMessage:
    "Hello! You've reached Glow Salon in Manchester. I'm Ringa, your AI receptionist. How can I help you today?",

  model: {
    provider: "anthropic",
    model: "claude-sonnet-4-6",
    temperature: 0.7,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "book_appointment",
          description:
            "Book an appointment for the customer. Call this ONLY after confirming all details with the customer.",
          parameters: {
            type: "object",
            required: ["name", "service", "datetime", "phone"],
            properties: {
              name: {
                type: "string",
                description: "Customer's full name",
              },
              service: {
                type: "string",
                description:
                  "The service they want, e.g. 'Women's Cut & Blow Dry', 'Full Head Highlights'",
              },
              datetime: {
                type: "string",
                description:
                  "Preferred appointment date and time as a human-readable string, e.g. 'Tuesday 15 April at 2pm'",
              },
              phone: {
                type: "string",
                description: "Customer's mobile number (for WhatsApp confirmation)",
              },
              email: {
                type: "string",
                description: "Customer's email address (optional but preferred)",
              },
            },
          },
        },
        server: {
          url: `${process.env.SERVER_URL}/vapi/tool`,
        },
      },
      {
        type: "function",
        function: {
          name: "get_availability",
          description: "Check general availability at the salon for a given date.",
          parameters: {
            type: "object",
            properties: {
              date: {
                type: "string",
                description: "Date to check availability for, e.g. 'next Tuesday' or '15 April'",
              },
            },
          },
        },
        server: {
          url: `${process.env.SERVER_URL}/vapi/tool`,
        },
      },
    ],
  },

  voice: {
    provider: "11labs",
    voiceId: "rachel",        // Warm, British-friendly female voice
    stability: 0.5,
    similarityBoost: 0.75,
  },

  transcriber: {
    provider: "deepgram",
    model: "nova-2",
    language: "en-GB",
  },

  // Send call lifecycle events to our server
  serverUrl: `${process.env.SERVER_URL}/vapi/webhook`,

  endCallMessage: "Thank you for calling Glow Salon. Have a lovely day — goodbye!",

  silenceTimeoutSeconds: 30,
  maxDurationSeconds: 600, // 10 minute max call

  backgroundDenoisingEnabled: true,
};

async function main() {
  const apiKey = process.env.VAPI_API_KEY;
  if (!apiKey || apiKey.length < 10) {
    console.error("❌ VAPI_API_KEY is missing. Add it to your .env file.");
    process.exit(1);
  }

  const serverUrl = process.env.SERVER_URL;
  if (!serverUrl || serverUrl.includes("your-server-url")) {
    console.error("❌ SERVER_URL is missing or still a placeholder. Set your public server URL in .env.");
    process.exit(1);
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  const existingId = process.env.VAPI_ASSISTANT_ID;

  try {
    let response;

    if (existingId) {
      console.log(`🔄 Updating existing Vapi assistant: ${existingId}`);
      response = await axios.patch(
        `${VAPI_BASE}/assistant/${existingId}`,
        assistantConfig,
        { headers }
      );
      console.log("✅ Assistant updated successfully.");
    } else {
      console.log("🚀 Creating new Vapi assistant...");
      response = await axios.post(`${VAPI_BASE}/assistant`, assistantConfig, { headers });
      console.log("✅ Assistant created successfully.");
    }

    const assistant = response.data;
    console.log("\n─────────────────────────────────────────");
    console.log(`Assistant Name: ${assistant.name}`);
    console.log(`Assistant ID:   ${assistant.id}`);
    console.log("─────────────────────────────────────────");
    console.log("\n📋 Next steps:");
    console.log(`   1. Add this to your .env file:`);
    console.log(`      VAPI_ASSISTANT_ID=${assistant.id}`);
    console.log("   2. Go to https://dashboard.vapi.ai → Phone Numbers");
    console.log("   3. Buy or import a phone number and assign it to this assistant.");
    console.log("   4. Call the number to test Ringa!\n");
  } catch (err) {
    const detail = err.response?.data || err.message;
    console.error("❌ Vapi API error:", JSON.stringify(detail, null, 2));
    process.exit(1);
  }
}

main();
