# FinAgent AI Platform

A modern React application for fintech agentic workflows — featuring an AI Agent Marketplace with two intelligent agents.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm 8+

### Install & Run

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm start

# App opens at http://localhost:3000
```

---

## 📱 WhatsApp Integration Setup (Free)

This project uses **CallMeBot** — a free WhatsApp API for simulating message delivery.

### Steps to activate your WhatsApp number (+91 8617269309):

1. **Save this number** in your phone contacts: `+34 644 59 86 74` (name it "CallMeBot")
2. **Send this exact message** to that number via WhatsApp:
   ```
   I allow callmebot to send me messages
   ```
3. **Wait for the reply** — you'll receive your personal API key (e.g., `1234567`)
4. **Add your API key** to `src/utils/whatsapp.js`:
   ```js
   const DEMO_APIKEY = 'YOUR_API_KEY_HERE'; // Replace this
   ```
5. **Restart the app** — messages will now deliver to your WhatsApp!

> **Free tier limits**: ~50 messages/day, send-only (one-way). Perfect for demos.

---

## 📁 Project Structure

```
src/
├── App.js                          # Main router
├── index.js                        # Entry point
├── styles/
│   └── global.css                  # Global design tokens & animations
├── context/
│   └── AppContext.js               # Global state (customers, conversations)
├── data/
│   └── mockData.js                 # Mock customers, issues, conversations
├── utils/
│   └── whatsapp.js                 # WhatsApp API integration (CallMeBot)
├── components/
│   ├── Layout.js                   # Page layout wrapper
│   ├── Sidebar.js                  # Navigation sidebar
│   └── UI.js                       # Reusable UI components
└── pages/
    ├── home/
    │   ├── HomePage.js             # Landing page with agent cards
    │   └── HomePage.css            # Landing page styles
    └── engagement/
        ├── dashboard/
        │   └── Dashboard.js        # Analytics dashboard
        ├── customers/
        │   └── Customers.js        # Customer directory
        ├── issues/
        │   └── Issues.js           # Issues management table
        └── chat/
            ├── ChatList.js         # All conversations list
            └── ChatPage.js         # Individual chat + customer profile
```

---

## 🤖 Features Checklist

### Homepage — AI Agent Marketplace
- [x] Beautiful animated landing page (dark blue theme)
- [x] Particle network background animation
- [x] **Card 1: Customer Onboarding & Underwriting** → redirects to https://claims-ai.netlify.app/
- [x] **Card 2: Smart Customer Engagement & Chatbot** → enters the app
- [x] Statistics bar with key metrics
- [x] Fully responsive design

### Smart Customer Engagement Module
- [x] **Dashboard** — Real-time analytics, charts, issue summary, at-risk customers
- [x] **Customer Directory** — All customers with search, filter, tier, KYC, balance, issues
- [x] **Issues Management** — Full table view with status, severity, category filters; one-click resolve
- [x] **Chat List** — All WhatsApp conversations overview
- [x] **Chat Page** — Full conversation interface with:
  - [x] Message history (customer / AI bot / human agent)
  - [x] AI Mode: auto-responds to customer messages
  - [x] Human Mode: agent takes over conversation
  - [x] Toggle between AI and Human agent mode
  - [x] Customer profile panel (balance, KYC, tier)
  - [x] Transactions history panel
  - [x] Issue management (mark resolved inline)
  - [x] "Simulate Customer Reply" button for demo
  - [x] WhatsApp delivery via CallMeBot API
  - [x] Delivery status notifications

### WhatsApp Integration
- [x] CallMeBot free API integration
- [x] Messages formatted for WhatsApp (bot vs human agent style)
- [x] Demo number configured: +91 8617269309
- [x] Delivery status shown in UI

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 |
| Routing | React Router v6 |
| Charts | Recharts |
| State | React Context API |
| Styling | CSS Variables + Inline styles |
| Fonts | Syne (display) + DM Sans (body) |
| WhatsApp | CallMeBot Free API |
| Icons | SVG inline |

---

## 🔧 Upgrading WhatsApp Integration

For production, replace CallMeBot with:

| Service | Free Tier | Two-way | Notes |
|---------|-----------|---------|-------|
| **CallMeBot** | ✅ 50/day | ❌ Send-only | Best for demos |
| **UltraMsg** | ✅ 100 trial | ✅ Yes | Good for POC |
| **Fonnte** | ✅ Free tier | ✅ Yes | Popular in India |
| **Meta WhatsApp Business API** | ❌ Paid | ✅ Yes | Production-grade |
| **Twilio WhatsApp** | ✅ Trial | ✅ Yes | Easy to set up |

---

## 📊 Mock Data

The app includes **6 mock customers** with realistic data:
- Arjun Sharma (Gold) — UPI payment failure
- Priya Patel (Silver) — Wallet top-up stuck
- Rahul Mehta (Platinum) — No issues
- Sneha Gupta (Bronze) — KYC pending + login issue
- Vikram Singh (Gold) — International transfer blocked
- Anjali Reddy (Platinum) — No issues

Each customer has: transactions, issue history, and pre-loaded WhatsApp conversations.

---

## 🚢 Production Deployment

```bash
npm run build
# Deploy the /build folder to Netlify, Vercel, or any static host
```

---

Built with ❤️ for modern fintech operations.
