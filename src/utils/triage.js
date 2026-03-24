/**
 * Rule-based triage engine for customer support conversations.
 *
 * Each issue type defines a conversation flow with:
 *   - initial: opening question + nextState
 *   - states:  map of stateName → { detect(msg), onMatch, onNoMatch }
 *
 * processTriageMessage(issueType, currentState, customerMessage)
 *   → { message, nextState, isTerminal }
 */

// ─── Detection helpers ─────────────────────────────────────────────────────
const has = (msg, ...terms) => terms.some(t => msg.toLowerCase().includes(t));
const matches = (msg, regex) => regex.test(msg.toLowerCase());
const hasRef   = msg => /\b[A-Z0-9]{8,24}\b/.test(msg);
const hasAmt   = msg => /₹?\s?\d[\d,]*/.test(msg);
const isPositive = msg => has(msg, 'yes', 'sure', 'ok', 'please', 'yeah', 'send', 'correct', 'right', 'done', 'fixed', 'working', 'thank', 'solved', 'resolved', 'great');
const isNegative = msg => has(msg, 'no', 'not', 'still', "doesn't", "didn't", "can't", 'cannot', 'nope', 'never');

// ─── Wallet top-up flow ────────────────────────────────────────────────────
const walletTopupFlow = {
  initial: {
    message: "Hello! I can see you reported a wallet top-up issue. Let me help you resolve this right away. 🙏\n\nCould you please share the *UPI Reference ID or Transaction ID* from your payment? You'll find it in:\n• Your UPI app (Google Pay / PhonePe / BHIM) → Transaction History\n• Your bank SMS alert",
    nextState: 'awaiting_ref',
  },
  states: {
    awaiting_ref: {
      detect: msg => hasRef(msg) || has(msg, 'ref', 'transaction', 'txn', 'utr', 'id', 'number'),
      onMatch: {
        message: "Thank you! I've located your transaction. ✅\n\nI can see the amount was received at our end but is pending in reconciliation. Could you also confirm:\n\n1️⃣ Was this paid via *UPI or Net Banking*?\n2️⃣ Which bank/app did you use?",
        nextState: 'awaiting_payment_mode',
      },
      onNoMatch: {
        message: "I need the UPI Reference ID or Transaction ID to trace your payment.\n\n📌 *How to find it:*\n• *Google Pay* → Tap transaction → Note 'UPI Ref No.'\n• *PhonePe* → History → Transaction ID\n• *Bank SMS* → Look for 12-digit UTR number\n\nPlease share it here.",
        nextState: 'awaiting_ref',
      },
    },
    awaiting_payment_mode: {
      detect: msg => has(msg, 'upi', 'net banking', 'neft', 'imps', 'phonepe', 'gpay', 'google pay', 'bhim', 'paytm', 'debit', 'card', 'bank'),
      onMatch: {
        message: "Perfect! All details confirmed. 🎉\n\n✅ *Action taken:* I've escalated this to our payments reconciliation team with HIGH priority.\n\n⏱ Expected credit time: *within 30 minutes*\n📱 You'll receive an SMS confirmation once done.\n\nWould you like me to also send a payment confirmation link on WhatsApp?",
        nextState: 'offer_confirmation',
      },
      onNoMatch: {
        message: "Thanks! Just one more detail — which payment method did you use?\n• UPI (Google Pay, PhonePe, BHIM)\n• Net Banking\n• Debit Card\n\nThis helps us route your case to the right team.",
        nextState: 'awaiting_payment_mode',
      },
    },
    offer_confirmation: {
      detect: msg => isPositive(msg),
      onMatch: {
        message: "✅ Confirmation link sent to your registered number!\n\n*Summary of resolution:*\n• Transaction traced & flagged for priority credit\n• Reconciliation team notified\n• You'll get SMS + WhatsApp update in 30 min\n\nIs there anything else I can help you with today?",
        nextState: 'closing',
      },
      onNoMatch: {
        message: "No problem! Your case has been escalated with the highest priority. Please expect your wallet credit within 30 minutes.\n\nIs there anything else I can help you with?",
        nextState: 'closing',
      },
    },
    closing: {
      detect: () => true,
      onMatch: {
        message: "You're welcome! 😊 I've noted your issue as resolved pending credit confirmation.\n\nFeel free to reach out anytime. Have a great day!",
        nextState: 'terminal',
      },
      onNoMatch: {
        message: "Feel free to reach out if you need anything else. Have a great day! 😊",
        nextState: 'terminal',
      },
    },
    terminal: { isTerminal: true },
  },
};

// ─── Payment failure flow ──────────────────────────────────────────────────
const paymentFailureFlow = {
  initial: {
    message: "I can see your payment was declined. Let me investigate and resolve this immediately.\n\nTo start, which *UPI app or payment method* were you using?\n(Google Pay / PhonePe / BHIM / Net Banking / Debit Card)",
    nextState: 'awaiting_app',
  },
  states: {
    awaiting_app: {
      detect: msg => has(msg, 'gpay', 'google pay', 'phonepe', 'bhim', 'paytm', 'upi', 'net banking', 'debit', 'card'),
      onMatch: {
        message: "Got it! Now, what *error message* did you see?\n\n• 'Transaction Limit Exceeded'\n• 'Insufficient Funds'\n• 'Bank Server Error / PSP Declined'\n• 'Wrong UPI PIN'\n• Something else?",
        nextState: 'awaiting_error',
      },
      onNoMatch: {
        message: "Could you let me know the payment method? This helps me check the right system.\n\n• Google Pay / PhonePe / BHIM / Paytm\n• Net Banking\n• Debit / Credit Card\n• Any other UPI app",
        nextState: 'awaiting_app',
      },
    },
    awaiting_error: {
      detect: msg => has(msg, 'limit', 'exceeded', 'insufficient', 'funds', 'server', 'error', 'declined', 'pin', 'wrong', 'failed', 'timeout', 'pending'),
      onMatch: {
        message: "Understood. Based on this error, here's what I've done:\n\n✅ *Immediate Actions:*\n• Daily UPI limit temporarily lifted for 1 hour\n• Transaction lock cleared from your account\n• Merchant reference preserved for retry\n\n⚡ Please retry the payment now — it should go through. Should I stay on the line while you try?",
        nextState: 'awaiting_retry_confirm',
      },
      onNoMatch: {
        message: "I've checked your account. The most likely cause is a temporary bank-side restriction.\n\n✅ I've cleared the transaction block. Please try these steps:\n1. Force-close your UPI app and reopen\n2. Wait 2 minutes\n3. Retry the payment\n\nDid the retry work?",
        nextState: 'awaiting_retry_result',
      },
    },
    awaiting_retry_confirm: {
      detect: msg => isPositive(msg) || has(msg, 'ok', 'trying', 'retry', 'will', 'let me'),
      onMatch: {
        message: "Great! I'm monitoring your account in real-time.\n\n*After retrying, please let me know:*\n• ✅ 'It worked!' — I'll close the case\n• ❌ 'Still failing' — I'll escalate to senior team\n\nTake your time. 👍",
        nextState: 'awaiting_retry_result',
      },
      onNoMatch: {
        message: "No worries! I've escalated your case to our senior payments team. They'll review and call you within 30 minutes.\n\nIs there anything else I can help with?",
        nextState: 'closing',
      },
    },
    awaiting_retry_result: {
      detect: msg => isPositive(msg) || has(msg, 'worked', 'success', 'done', 'through', 'went'),
      onMatch: {
        message: "Excellent! 🎉 Glad the payment went through!\n\nI've updated your case as *Resolved*. A summary has been sent to your registered email.\n\nIs there anything else I can help with today?",
        nextState: 'closing',
      },
      onNoMatch: {
        message: "I'm sorry the issue persists! 🚨 I've immediately escalated this to our *Level 2 Payments Team* with the highest priority.\n\n📞 *Expected callback:* within 20 minutes\n📧 Reference ID generated: #PAY-{timestamp}\n\nYou're in safe hands. Anything else I can note?",
        nextState: 'closing',
      },
    },
    closing: {
      detect: () => true,
      onMatch: {
        message: "Thank you for your patience! 😊 Your case is being handled. Feel free to reach out anytime.",
        nextState: 'terminal',
      },
      onNoMatch: {
        message: "Thank you for your patience! 😊 Feel free to reach out if you need anything else. Have a great day!",
        nextState: 'terminal',
      },
    },
    terminal: { isTerminal: true },
  },
};

// ─── KYC incomplete flow ───────────────────────────────────────────────────
const kycFlow = {
  initial: {
    message: "I see your KYC verification is pending. This is important for unlocking your full account benefits! Let me guide you through it. 🆔\n\nHave you already submitted your documents (Aadhaar / PAN card)?",
    nextState: 'awaiting_doc_status',
  },
  states: {
    awaiting_doc_status: {
      detect: msg => isPositive(msg) || has(msg, 'yes', 'submitted', 'uploaded', 'sent', 'done', 'already'),
      onMatch: {
        message: "Great! Let me check the status of your submission.\n\n🔍 *Checking...*\n\nI can see your documents were received. The Aadhaar verification step is pending.\n\nCould you confirm:\n1. Is the *name on your Aadhaar* exactly the same as your account registration name?\n2. Is the *photo on your Aadhaar* clear and visible?",
        nextState: 'awaiting_aadhaar_check',
      },
      onNoMatch: {
        message: "No worries! Let me guide you step by step.\n\n📋 *Documents needed:*\n1. *Aadhaar Card* (front + back photo)\n2. *PAN Card* (front photo)\n3. *Selfie* (clear, well-lit, no glasses)\n\nYou can upload them in the app: Settings → KYC Verification → Upload Documents\n\nHave you done this step?",
        nextState: 'awaiting_doc_status',
      },
    },
    awaiting_aadhaar_check: {
      detect: msg => isPositive(msg) || has(msg, 'yes', 'same', 'clear', 'correct', 'match'),
      onMatch: {
        message: "Perfect! Everything looks good on your end. ✅\n\nI've flagged your KYC for *manual review by our compliance team*. This typically takes 2-4 hours.\n\n🔔 You'll receive an SMS + App notification once verified.\n\n*Benefits unlocked after KYC:*\n• Higher transaction limits\n• International transfers\n• Premium account features\n\nAnything else I can help with?",
        nextState: 'closing',
      },
      onNoMatch: {
        message: "That might be causing the delay. A mismatch in name or unclear photo is the most common reason KYC fails.\n\n✅ *Quick fixes:*\n• Re-upload your Aadhaar with better lighting\n• Ensure the name matches exactly (no abbreviations)\n• Make sure both sides of Aadhaar are uploaded\n\nOnce re-uploaded, I'll manually expedite your verification. Can you try re-uploading now?",
        nextState: 'awaiting_reupload',
      },
    },
    awaiting_reupload: {
      detect: msg => isPositive(msg) || has(msg, 'done', 'uploaded', 'sent', 'submitted', 'ok'),
      onMatch: {
        message: "✅ New documents received! I've marked your KYC for *priority review*.\n\nExpected completion: *within 2 hours*\n\nYou'll get an SMS once your KYC is approved. Is there anything else I can help with?",
        nextState: 'closing',
      },
      onNoMatch: {
        message: "Take your time! Whenever you've re-uploaded the documents, just let me know and I'll expedite the review.\n\nAny other questions in the meantime?",
        nextState: 'awaiting_reupload',
      },
    },
    closing: {
      detect: () => true,
      onMatch: {
        message: "You're welcome! 😊 Your KYC verification is in progress. Have a great day!",
        nextState: 'terminal',
      },
      onNoMatch: {
        message: "Happy to help! Feel free to reach out anytime. Have a wonderful day! 😊",
        nextState: 'terminal',
      },
    },
    terminal: { isTerminal: true },
  },
};

// ─── Login issue flow ──────────────────────────────────────────────────────
const loginFlow = {
  initial: {
    message: "I see you're having trouble logging in. Let me help you regain access right away! 🔑\n\nWhat exactly happens when you try to log in?\n\n• OTP not received\n• OTP received but shows 'Invalid'\n• App crashes after OTP\n• Fingerprint / Face ID not working\n• Something else?",
    nextState: 'awaiting_error_type',
  },
  states: {
    awaiting_error_type: {
      detect: msg => has(msg, 'otp', 'invalid', 'crash', 'fingerprint', 'face', 'session', 'expired', 'password', 'locked', 'not received', 'blank', 'loading'),
      onMatch: {
        message: "Got it! Here's what I'm doing to fix this:\n\n✅ *Immediate Actions:*\n• Cleared your active sessions\n• Reset the OTP cooldown timer\n• Verified your registered number: {phone}\n\n*Please follow these steps now:*\n1. Close the app completely\n2. Ensure your phone time is set to *Automatic*\n3. Open the app and request a fresh OTP\n\nDid you receive the new OTP?",
        nextState: 'awaiting_otp_status',
      },
      onNoMatch: {
        message: "I'd like to understand the exact error to give you the right fix.\n\nCould you describe what you see on screen? For example:\n• Is there an error message? What does it say?\n• Does the OTP arrive but fail?\n• Does the app just show a loading screen?",
        nextState: 'awaiting_error_type',
      },
    },
    awaiting_otp_status: {
      detect: msg => has(msg, 'received', 'got', 'yes', 'came', 'arrived', 'otp'),
      onMatch: {
        message: "Great! Please enter the OTP within 60 seconds — I've extended your session window.\n\n*If it fails again, try:*\n• Use the 'Resend via Call' option\n• Clear app cache: Settings → Apps → FinAgent → Clear Cache\n\nDid login work?",
        nextState: 'awaiting_login_result',
      },
      onNoMatch: {
        message: "OTP not received? Let me check...\n\n🔍 Your registered number on file: {phone}\n\n*Possible reasons:*\n• Network congestion (try after 2 min)\n• DND (Do Not Disturb) enabled on your number\n• SIM in slot 2 (OTPs may go to slot 1)\n\nI can also send the OTP via *WhatsApp* or *email*. Which would you prefer?",
        nextState: 'awaiting_otp_alt',
      },
    },
    awaiting_otp_alt: {
      detect: msg => has(msg, 'whatsapp', 'email', 'call', 'yes', 'please', 'ok'),
      onMatch: {
        message: "✅ Alternative OTP sent! Please check your WhatsApp / email now.\n\nOnce you log in successfully, let me know. I'll note that SMS delivery has an issue on your number and flag it for network team review.",
        nextState: 'awaiting_login_result',
      },
      onNoMatch: {
        message: "Let me try another approach. I'm generating a *secure login link* and sending it to your registered email. Please check your inbox and click the link to access your account.\n\nIs there anything else I can try to help?",
        nextState: 'awaiting_login_result',
      },
    },
    awaiting_login_result: {
      detect: msg => isPositive(msg) || has(msg, 'worked', 'in', 'logged', 'success', 'done', 'access'),
      onMatch: {
        message: "Wonderful! 🎉 Glad you're back in!\n\nI've made a note to monitor your account for any further login anomalies for the next 24 hours.\n\n*Tip:* Enable *Biometric Login* in Settings for faster access next time!\n\nIs there anything else I can help with?",
        nextState: 'closing',
      },
      onNoMatch: {
        message: "I'm escalating this to our *Technical Support Team* right away. 🚨\n\nA senior engineer will contact you within 15 minutes to resolve this remotely.\n\n📞 *Escalation ID:* #TEC-{timestamp}\nPlease keep this ID for reference.\n\nAnything else I can note for the team?",
        nextState: 'closing',
      },
    },
    closing: {
      detect: () => true,
      onMatch: {
        message: "You're welcome! 😊 Your access has been restored. Have a great day!",
        nextState: 'terminal',
      },
      onNoMatch: {
        message: "Your case is being handled by our team. Feel free to check back anytime. Take care! 😊",
        nextState: 'terminal',
      },
    },
    terminal: { isTerminal: true },
  },
};

// ─── General / fallback flow ───────────────────────────────────────────────
const generalFlow = {
  initial: {
    message: "Hello! 👋 I'm Agently AI, your dedicated support assistant.\n\nI'm here to help you with:\n• 💳 Payment issues\n• 👛 Wallet top-ups\n• 🆔 KYC verification\n• 🔑 Login problems\n• 📊 Account queries\n\nCould you please describe what you're facing? I'll resolve it right away!",
    nextState: 'awaiting_issue',
  },
  states: {
    awaiting_issue: {
      detect: msg => msg.trim().length > 3,
      onMatch: {
        message: "Thank you for sharing that. I'm checking your account details right now...\n\n🔍 *Reviewing:* Transaction history, account status, open tickets...\n\nCould you provide more context? For example:\n• When did this happen?\n• What error or message did you see?\n• Have you tried any troubleshooting steps?",
        nextState: 'gathering_context',
      },
      onNoMatch: {
        message: "Could you please describe your issue in a little more detail? This helps me provide the most accurate solution. 🙏",
        nextState: 'awaiting_issue',
      },
    },
    gathering_context: {
      detect: msg => msg.trim().length > 5,
      onMatch: {
        message: "Thank you! I have all the details I need.\n\n✅ *Actions taken:*\n• Case logged with ID #SUP-{timestamp}\n• Your account flagged for priority review\n• Specialist team notified\n\n📱 *Next steps:* Our team will contact you within 1 hour with a resolution.\n\nIs there anything else you'd like to add?",
        nextState: 'closing',
      },
      onNoMatch: {
        message: "I understand. Let me connect you with the right specialist who can look into this further. Please hold on for a moment.",
        nextState: 'closing',
      },
    },
    closing: {
      detect: () => true,
      onMatch: {
        message: "You're welcome! 😊 Your case is being handled. Feel free to reach out anytime. Have a great day!",
        nextState: 'terminal',
      },
      onNoMatch: {
        message: "Thank you for reaching out! Our team is on it. Have a wonderful day! 😊",
        nextState: 'terminal',
      },
    },
    terminal: { isTerminal: true },
  },
};

// ─── Flow registry ─────────────────────────────────────────────────────────
const FLOWS = {
  wallet_topup:    walletTopupFlow,
  payment_failure: paymentFailureFlow,
  kyc_incomplete:  kycFlow,
  login_issue:     loginFlow,
  general:         generalFlow,
};

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Get the initial greeting for an issue type.
 * @param {string} issueType
 * @returns {{ message: string, nextState: string }}
 */
export const getTriageOpener = (issueType) => {
  const flow = FLOWS[issueType] || FLOWS.general;
  return { message: flow.initial.message, nextState: flow.initial.nextState };
};

/**
 * Process a customer message through the triage engine.
 * @param {string} issueType     - e.g. 'wallet_topup'
 * @param {string} currentState  - current state name
 * @param {string} customerMsg   - raw customer message text
 * @param {object} ctx           - optional context variables (phone, timestamp)
 * @returns {{ message: string, nextState: string, isTerminal: boolean }}
 */
export const processTriageMessage = (issueType, currentState, customerMsg, ctx = {}) => {
  const flow  = FLOWS[issueType] || FLOWS.general;
  const state = flow.states[currentState];

  if (!state) {
    // Unknown state — fall back to general closing
    return { message: "Thank you! Is there anything else I can help you with?", nextState: 'terminal', isTerminal: false };
  }

  if (state.isTerminal) {
    return { message: "Thank you for reaching out! Feel free to contact us anytime. 😊", nextState: 'terminal', isTerminal: true };
  }

  const matched = state.detect ? state.detect(customerMsg) : true;
  const outcome = matched ? state.onMatch : state.onNoMatch;
  const isTerminal = outcome.nextState === 'terminal';

  // Substitute context variables
  const message = outcome.message
    .replace('{phone}', ctx.phone || 'your registered number')
    .replace('{timestamp}', String(Date.now()).slice(-6))
    .replace('{amount}', ctx.amount || '');

  return { message, nextState: outcome.nextState, isTerminal };
};

/**
 * Get the best-matching issue type for a customer (first open issue).
 * @param {object} customer
 * @returns {string}
 */
export const getCustomerIssueType = (customer) => {
  const openIssue = customer?.issues?.find(i => i.status !== 'resolved');
  return openIssue?.type || 'general';
};
