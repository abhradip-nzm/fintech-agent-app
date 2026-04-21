/**
 * ElevenLabs Conversational AI helpers.
 *
 * HOW IT WORKS
 * ────────────
 * The ElevenLabs agent has `allow_override` disabled, so we cannot replace
 * the system prompt at runtime via `overrides`.  Instead we use
 * `dynamicVariables` — the agent's static system prompt in the ElevenLabs
 * dashboard contains {{placeholder}} tokens which ElevenLabs fills at
 * call-start time with the values we pass here.  No override permission
 * needed.
 *
 * AGENT SYSTEM PROMPT (paste this into ElevenLabs → your agent → System prompt)
 * ──────────────────────────────────────────────────────────────────────────────
 * See ELEVENLABS_AGENT_PROMPT.txt at the project root.
 */

// ─── Format helpers ───────────────────────────────────────────────────────────
const ISSUE_LABELS = {
  wallet_topup:    'wallet top-up',
  payment_failure: 'payment failure',
  kyc_incomplete:  'KYC verification',
  login_issue:     'login problem',
  general:         'account query',
};

const formatIssues = (issues = []) => {
  const open = issues.filter(i => i.status !== 'resolved');
  if (!open.length) return 'None.';
  return open.map((issue, i) =>
    `${i + 1}. [${(issue.severity || 'normal').toUpperCase()}] ${issue.title}: ${issue.description || ''}`
  ).join('\n');
};

const formatHistory = (messages = []) => {
  if (!messages.length) return 'No prior chat history.';
  return messages.slice(-15).map(m => {
    const time = new Date(m.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const who  = m.sender === 'customer' ? 'Customer'
               : m.sender === 'ai_bot'   ? 'Agently AI Bot'
               : (m.senderName || 'Human Agent');
    return `[${time}] ${who}: ${m.message}`;
  }).join('\n');
};

// ─── Dynamic variables ────────────────────────────────────────────────────────
/**
 * Build the dynamicVariables payload for Conversation.startSession().
 * These fill {{placeholder}} tokens in the agent's system prompt.
 *
 * @param {object}   customer  Full customer record from AppContext
 * @param {object[]} messages  Current conversation messages
 * @returns {Record<string, string>}
 */
export const buildDynamicVariables = (customer, messages = []) => {
  const openIssues   = customer?.issues?.filter(i => i.status !== 'resolved') || [];
  const primaryIssue = openIssues[0];
  const primaryLabel = primaryIssue
    ? (ISSUE_LABELS[primaryIssue.category] || primaryIssue.title || 'recent issue')
    : 'their inquiry';

  return {
    customer_name:    customer?.name    || 'Customer',
    customer_first:   customer?.name?.split(' ')[0] || 'Customer',
    account_number:   customer?.accountNumber || 'N/A',
    balance:          `Rs. ${(customer?.balance || 0).toLocaleString('en-IN')}`,
    kyc_status:       customer?.kycStatus || 'unknown',
    tier:             customer?.tier || 'Standard',
    phone:            customer?.phone || 'N/A',
    primary_issue:    primaryLabel,
    open_issues:      formatIssues(customer?.issues),
    chat_history:     formatHistory(messages),
  };
};

// ─── Session config ───────────────────────────────────────────────────────────
/**
 * Returns the right session config for @11labs/client:
 *
 *   Netlify deployed / netlify dev  →  { signedUrl }  (API key stays server-side)
 *   Local npm start                 →  { signedUrl }  (fetched directly from ElevenLabs
 *                                                       using REACT_APP_ELEVENLABS_API_KEY)
 *   Public agent fallback           →  { agentId, connectionType: 'webrtc' }
 *
 * @returns {Promise<{ signedUrl: string } | { agentId: string, connectionType: string }>}
 */
export const getSessionConfig = async () => {
  const reactAgentId = process.env.REACT_APP_ELEVENLABS_AGENT_ID;
  const reactApiKey  = process.env.REACT_APP_ELEVENLABS_API_KEY;

  // 1. Netlify function (deployed / netlify dev) — keeps API key server-side
  try {
    const res = await fetch('/.netlify/functions/get-voice-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const data = await res.json();
      if (res.ok && data.signedUrl) return { signedUrl: data.signedUrl };
      throw new Error(data.error || `Server error ${res.status}`);
    }
    // Non-JSON → Netlify function not running → fall through
  } catch (err) {
    if (err.message && !err.message.includes('JSON') && !err.message.includes('fetch')) throw err;
  }

  // 2. Client-side signed URL using REACT_APP_ vars (local dev, private agent)
  if (reactApiKey && reactAgentId) {
    try {
      const res = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${encodeURIComponent(reactAgentId)}`,
        { headers: { 'xi-api-key': reactApiKey } },
      );
      if (res.ok) {
        const data = await res.json();
        if (data.signed_url) return { signedUrl: data.signed_url };
      }
    } catch (_) { /* CORS on some browsers — fall through */ }
  }

  // 3. Public agent fallback (agentId only, no auth)
  if (reactAgentId) return { agentId: reactAgentId, connectionType: 'webrtc' };

  throw new Error('ElevenLabs not configured. Add REACT_APP_ELEVENLABS_AGENT_ID to your .env file.');
};

// ─── Routing phrase ───────────────────────────────────────────────────────────
export const ROUTE_PHRASE = 'a human agent will call you shortly';
