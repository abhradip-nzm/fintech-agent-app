/**
 * Gemini-powered conversational chat for Agently AI.
 *
 * Replaces the rule-based triage engine when a Gemini API key is configured.
 * Falls back to triage.js when no key is present.
 *
 * Uses gemini-1.5-flash for low latency on WhatsApp / in-app chat.
 */

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// ─── System prompt builder ────────────────────────────────────────────────────
const buildSystemPrompt = (customer, openIssues) => {
  const firstName = customer?.name?.split(' ')[0] || 'the customer';
  const issueBlock = openIssues.length
    ? openIssues
        .map((i, n) => `${n + 1}. [${(i.severity || 'normal').toUpperCase()}] ${i.title}: ${i.description || ''}`)
        .join('\n')
    : 'None logged.';

  return `
You are Riya, a warm and empathetic customer support agent at Agently, a fintech payments platform. You are chatting with customers on WhatsApp and in-app chat.

YOUR PERSONALITY:
- Sound like a real, caring human — never robotic or scripted
- Be concise: 2–3 sentences per reply max (WhatsApp style)
- Use the customer's first name (${firstName}) occasionally, not every message
- Show genuine empathy: "Oh no, that's frustrating — let me fix this right now"
- Be proactive: tell them what you ARE doing, not just asking more questions
- Match their language automatically (English, Hindi, Indonesian, Mandarin, etc.)
- Light formatting only: *bold* for reference IDs or action items. 1 emoji max per reply
- NEVER say "As an AI", "I'm a bot", or "I cannot"

CUSTOMER PROFILE:
Name: ${customer?.name || 'Customer'}
Account: ${customer?.accountNumber || 'N/A'}
Balance: Rs. ${(customer?.balance || 0).toLocaleString('en-IN')}
KYC Status: ${customer?.kycStatus || 'unknown'}
Tier: ${customer?.tier || 'Standard'}
Phone: ${customer?.phone || 'N/A'}

OPEN ISSUES:
${issueBlock}

RESOLUTION KNOWLEDGE — use this to resolve issues, skip any steps already covered in chat:

WALLET TOP-UP: Confirm the amount. Ask for the UPI Reference ID / Transaction ID (from Google Pay, PhonePe, or bank SMS) if not already shared. Tell them it's pending reconciliation. Escalate to the team — wallet credited within 30 minutes. Send an SMS confirmation.

PAYMENT FAILURE: Ask which app (GPay / PhonePe / BHIM etc.) and what error appeared. Clear the transaction block. Ask them to force-close the app and retry. If still failing, escalate to Level 2 Payments Team — 20-minute callback.

KYC INCOMPLETE: Check if Aadhaar and PAN were uploaded. Guide: Settings → KYC Verification → Upload Documents. Common causes: name mismatch, blurry photo. Initiate priority manual review — 2–4 hours completion, SMS notification on approval.

LOGIN ISSUE: Clear active sessions and reset OTP cooldown. If OTP not received, offer WhatsApp or email OTP. If still failing, escalate to Technical Support immediately.

GENERAL / OTHER: Gather context (what happened, when, any error message). Log a support case. Confirm specialist follow-up within 1 hour.

HUMAN HANDOFF:
If you cannot resolve after 3 attempts, OR the customer explicitly asks for a human agent, end your reply with exactly:
"Connecting you to a human specialist right away. 🙏"
The system will detect this phrase and route the customer automatically.
`.trim();
};

// ─── Conversation history builder ────────────────────────────────────────────
/**
 * Maps the app's message array to Gemini's contents format.
 * Merges consecutive same-role messages and ensures the array starts with 'user'.
 */
const buildContents = (messages) => {
  const result = [];

  for (const msg of messages.slice(-24)) { // last 24 messages for context
    if (!msg.message) continue;
    const role = msg.sender === 'customer' ? 'user' : 'model';
    const last = result[result.length - 1];
    if (last && last.role === role) {
      last.parts[0].text += '\n' + msg.message;
    } else {
      result.push({ role, parts: [{ text: msg.message }] });
    }
  }

  // Gemini requires contents to start with 'user'
  while (result.length > 0 && result[0].role === 'model') result.shift();

  return result;
};

// ─── Core API call ────────────────────────────────────────────────────────────
const callGemini = async (geminiKey, systemPrompt, contents, maxTokens = 256) => {
  const res = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(geminiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: {
        temperature:     0.75,
        maxOutputTokens: maxTokens,
        topP:            0.9,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini HTTP ${res.status}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error('Gemini returned an empty response');
  return text;
};

// ─── Public API ───────────────────────────────────────────────────────────────

/** The phrase Gemini will include when routing to a human agent */
export const GEMINI_ROUTE_PHRASE = 'connecting you to a human specialist';

/**
 * Generate a reply to the customer's latest message.
 * `messages` should include the customer's latest message as the last entry.
 *
 * @param {string}   geminiKey  Gemini API key
 * @param {object}   customer   Full customer record
 * @param {object[]} messages   Full conversation history (including latest customer msg)
 * @returns {Promise<string>}   The AI reply text
 */
export const generateChatReply = async (geminiKey, customer, messages) => {
  const openIssues = customer?.issues?.filter(i => i.status !== 'resolved') || [];
  const systemPrompt = buildSystemPrompt(customer, openIssues);
  const contents     = buildContents(messages);

  // Need at least one user message to respond to
  if (contents.length === 0 || contents[contents.length - 1].role !== 'user') {
    throw new Error('No customer message to respond to');
  }

  return callGemini(geminiKey, systemPrompt, contents);
};

/**
 * Generate the opening greeting for a new conversation.
 * Does NOT use chat history (there is none yet).
 *
 * @param {string} geminiKey
 * @param {object} customer
 * @returns {Promise<string>}
 */
export const generateChatOpener = async (geminiKey, customer) => {
  const openIssues  = customer?.issues?.filter(i => i.status !== 'resolved') || [];
  const firstName   = customer?.name?.split(' ')[0] || 'there';
  const primaryIssue = openIssues[0];
  const systemPrompt = buildSystemPrompt(customer, openIssues);

  const openerInstruction = primaryIssue
    ? `Write a warm, natural 1–2 sentence WhatsApp opening message to ${firstName} about their ${primaryIssue.title} issue. Reference the issue briefly so they know you've already looked at their account. Do not ask which language to use — just write naturally in English.`
    : `Write a warm, natural 1–2 sentence WhatsApp opening message greeting ${firstName} and letting them know you're here to help with their account. Do not ask which language to use.`;

  return callGemini(geminiKey, systemPrompt, [
    { role: 'user', parts: [{ text: openerInstruction }] },
  ], 128);
};
