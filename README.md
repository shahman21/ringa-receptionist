# Ringa — AI Receptionist for Glow Salon

Ringa is a fully automated AI receptionist that answers phone calls and WhatsApp messages for Glow Salon in Manchester. She books appointments, answers FAQs, and sends confirmation messages — all without a human lifting a finger.

| Channel | Technology |
|---------|-----------|
| Voice calls | Vapi (speech → AI → speech) |
| WhatsApp messages | Twilio |
| AI brain | Claude (Anthropic) |
| Appointment booking | Make.com → Calendly |
| Backend server | Node.js / Express |

---

## What Ringa can do

- **Answer phone calls** and have a natural conversation
- **Book appointments** by collecting name, service, date/time, phone, and email
- **Answer FAQs** — opening hours, prices, services, parking, policies
- **Reply to WhatsApp messages** intelligently
- **Send a WhatsApp booking confirmation** after every appointment is made

---

## Before you start — what you'll need

You'll need free (or trial) accounts on four services. Each takes about 5 minutes to sign up.

| Service | What it's for | Sign-up link |
|---------|--------------|-------------|
| **Anthropic** | Claude AI (the brain) | https://console.anthropic.com |
| **Vapi** | AI phone calls | https://vapi.ai |
| **Twilio** | WhatsApp messaging | https://twilio.com |
| **Make.com** | Connects booking to Calendly | https://make.com |
| **Calendly** | Appointment calendar | https://calendly.com |
| **Render / Railway / Heroku** | Hosting the server | https://render.com (recommended — free tier) |

---

## Step 1 — Get your API keys

### 1a. Anthropic (Claude)

1. Go to https://console.anthropic.com/keys
2. Click **Create Key**
3. Copy the key — it starts with `sk-ant-`
4. Save it — you'll need it later

### 1b. Vapi

1. Go to https://dashboard.vapi.ai
2. Click your name (top right) → **API Keys**
3. Create a new key and copy it

### 1c. Twilio (WhatsApp)

1. Log in to https://console.twilio.com
2. On the dashboard you'll see **Account SID** and **Auth Token** — copy both
3. Go to **Messaging → Senders → WhatsApp Senders**
4. During testing you can use Twilio's free Sandbox number (`+1 415 523 8886`)
5. For production, apply for a WhatsApp Business number

> **Twilio Sandbox quick-start:** In the Twilio console, go to **Messaging → Try it out → Send a WhatsApp message** and follow the instructions to join the sandbox. Send `join <your-keyword>` from your phone to activate it.

### 1d. Make.com → Calendly booking webhook

1. Sign up at https://make.com
2. Click **Create a new scenario**
3. Add a **Webhooks → Custom Webhook** module as the trigger
4. Copy the webhook URL (looks like `https://hook.eu1.make.com/abc123`)
5. Add a **Calendly → Create Invitee** action (or **Google Calendar → Create Event** if you prefer)
6. Map the fields: name, email, date/time
7. Click **Save** and **Activate** the scenario
8. Copy the webhook URL — you'll need it later

---

## Step 2 — Set up the project locally

You'll need **Node.js** installed. Check with:
```
node --version
```
If it's not installed, download it from https://nodejs.org (choose the LTS version).

### Clone / download the project

If you downloaded this as a ZIP, unzip it. Then open **Terminal** (Mac) or **Command Prompt** (Windows) and navigate to the folder:

```bash
cd ringa-receptionist
```

### Install dependencies

```bash
npm install
```

### Create your `.env` file

Copy the example file:

```bash
cp .env.example .env
```

Open `.env` in any text editor (Notepad, TextEdit, VS Code) and fill in all the values:

```
PORT=3000
SERVER_URL=https://your-render-app.onrender.com   ← fill in after Step 3

ANTHROPIC_API_KEY=sk-ant-...
VAPI_API_KEY=...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
MAKE_WEBHOOK_URL=https://hook.eu1.make.com/...
```

Save the file.

---

## Step 3 — Deploy the server

We recommend **Render** (free tier, no credit card needed for basic use).

### Deploy to Render

1. Go to https://render.com and sign up with your GitHub account
2. Click **New → Web Service**
3. Connect your GitHub repo (or upload the folder)
4. Set these settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
5. Click **Advanced** → **Add Environment Variables** and paste all your `.env` values
6. Click **Create Web Service**
7. Wait ~2 minutes. Copy your app URL (e.g. `https://ringa-receptionist.onrender.com`)
8. Go back to your `.env` and set `SERVER_URL` to this URL
9. Re-deploy (or update the environment variable in Render's dashboard)

> **Test the server:** Open `https://your-app.onrender.com/health` in your browser. You should see `{"status":"ok",...}`.

---

## Step 4 — Create the Vapi voice assistant

Run this once from your local terminal (with your `.env` filled in):

```bash
npm run setup:vapi
```

You'll see output like:

```
✅ Assistant created successfully.
─────────────────────────────────
Assistant ID: asst_abc123xyz
─────────────────────────────────
```

Copy the **Assistant ID** and add it to your `.env`:

```
VAPI_ASSISTANT_ID=asst_abc123xyz
```

### Assign a phone number to Ringa

1. Go to https://dashboard.vapi.ai → **Phone Numbers**
2. Click **Buy Number** (choose a UK number if you want)
3. Select your new assistant (**Ringa — Glow Salon**) from the dropdown
4. Save

That's it — calling that number will connect to Ringa!

---

## Step 5 — Connect Twilio WhatsApp

1. Go to https://console.twilio.com → **Messaging → Settings → WhatsApp Sandbox** (or your number settings if you have a real WhatsApp number)
2. Find the field **"When a message comes in"**
3. Set it to: `https://your-app.onrender.com/whatsapp/incoming`
4. Method: **HTTP POST**
5. Save

Now send a WhatsApp message to your Twilio number and Ringa will reply!

---

## Step 6 — Test everything

### Test the health check
```
https://your-app.onrender.com/health
```

### Test WhatsApp
Send a WhatsApp to your Twilio number with a message like:
> "Hi, what are your opening hours?"

You should get a reply from Ringa within a few seconds.

### Test voice
Call your Vapi phone number. Ringa will answer and you can have a conversation.

### Test a booking
During a conversation (voice or WhatsApp), say something like:
> "I'd like to book a haircut for next Friday"

Ringa will collect your details and send a booking request to Make.com.

---

## Customising the salon

Edit `src/salon-data.js` to change:
- Salon name, address, phone number
- Opening hours
- Services and prices
- FAQs

No need to change anything else — all other files pull their data from `salon-data.js`.

---

## Running locally (for development)

If you want to test on your own computer first, install **ngrok** to create a temporary public URL:

```bash
# Install ngrok: https://ngrok.com/download
ngrok http 3000
```

Copy the `https://` URL it gives you (e.g. `https://abc123.ngrok-free.app`) and use it as your `SERVER_URL` in `.env`.

Then start the server:

```bash
npm run dev
```

---

## Project structure

```
ringa-receptionist/
├── src/
│   ├── index.js        — Express server entry point
│   ├── vapi.js         — Vapi voice call webhooks & tool handling
│   ├── whatsapp.js     — Twilio WhatsApp webhook handler
│   ├── claude.js       — Claude AI conversation logic (used for WhatsApp)
│   ├── booking.js      — Make.com webhook & confirmation messages
│   └── salon-data.js   — All salon info (edit this to customise)
├── scripts/
│   └── setup-vapi.js   — Creates the Vapi assistant (run once)
├── .env.example        — Template for your environment variables
├── package.json
└── README.md
```

---

## Architecture overview

```
Customer calls  →  Vapi (STT)  →  Claude  →  Vapi (TTS)  →  Customer hears reply
                                     │
                        (if booking) └──→  /vapi/tool  →  Make.com  →  Calendly
                                                            │
                                                     WhatsApp confirmation
                                                     (via Twilio)

Customer WhatsApps  →  Twilio  →  /whatsapp/incoming  →  Claude  →  TwiML reply
                                                              │
                                               (if booking) └──→  Make.com  →  Calendly
```

---

## Common issues

| Problem | Fix |
|---------|-----|
| "Missing env vars" warning on startup | Fill in all values in `.env` |
| WhatsApp messages get no reply | Check Twilio webhook URL is correct and your server is running |
| Vapi calls don't connect | Make sure you assigned the phone number to the assistant in Vapi dashboard |
| Booking doesn't go through | Check `MAKE_WEBHOOK_URL` in `.env` and that your Make.com scenario is active |
| Server returns 503 on Render | Free tier sleeps after 15 min of inactivity — first request wakes it up (takes ~30s) |

---

## Support

For API-specific issues:
- **Vapi docs:** https://docs.vapi.ai
- **Twilio docs:** https://www.twilio.com/docs/whatsapp
- **Anthropic docs:** https://docs.anthropic.com
- **Make.com docs:** https://www.make.com/en/help
