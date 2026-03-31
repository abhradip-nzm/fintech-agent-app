/**
 * Netlify Function: ivr-twilio
 * Handles all Twilio IVR webhook callbacks — returns TwiML.
 *
 * Steps handled via ?step= query param:
 *   welcome          → Language selection menu (DTMF 1=English, 2=Hindi)
 *   lang_selected    → Issue selection menu (DTMF 1-5)
 *   issue_selected   → Play initial triage message → gather speech
 *   triage_response  → Process SpeechResult → play response → loop or hangup
 *   status_callback  → Update call status in Blobs
 */

const { getStore } = require('@netlify/blobs');

function getIVRStore() {
  const siteID = process.env.NETLIFY_SITE_ID;
  const token  = process.env.NETLIFY_AUTH_TOKEN;
  if (siteID && token) return getStore({ name: 'ivr-sessions', siteID, token });
  return getStore('ivr-sessions');
}

const {
  getIVROpener,
  processIVRTriageMessage,
  getIssueTypeFromDigit,
  getInitialTriageState,
} = require('./shared-triage');

// Twilio voices
const VOICE = {
  en: { voice: 'Polly.Raveena', language: 'en-IN' },
  hi: { voice: 'Polly.Aditi',   language: 'hi-IN' },
};

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Escape & in URLs so they are valid XML attribute values. */
function xa(url) {
  return url.replace(/&/g, '&amp;');
}

function twiml(body) {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/xml' },
    body: `${XML_HEADER}\n<Response>${body}</Response>`,
  };
}

function say(text, lang = 'en') {
  const v = VOICE[lang] || VOICE.en;
  return `<Say voice="${v.voice}">${text}</Say>`;
}

/** Build a <Gather> block. action URL must already be XML-attribute-safe. */
function gather(action, lang, innerContent, opts = {}) {
  const v          = VOICE[lang] || VOICE.en;
  const numDigits  = opts.numDigits  ? `numDigits="${opts.numDigits}"` : '';
  const input      = opts.input || 'dtmf';
  const timeout    = opts.timeout || 10;
  // Only include speechTimeout when input includes speech
  const stAttr     = input.includes('speech') ? `speechTimeout="auto"` : '';
  return `<Gather input="${input}" ${numDigits} language="${v.language}" ${stAttr} timeout="${timeout}" action="${action}" method="POST">${innerContent}</Gather>`;
}

/** Build a webhook URL with proper XML-escaped query params. */
function buildActionUrl(base, params) {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&amp;');           // XML-safe separator
  return `${base}/ivr-twilio?${qs}`;
}

// ── Append transcript (parallel, max 3 s so we never block TwiML response) ───
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function appendTranscript(callSid, speaker, text, extraFields = {}) {
  try {
    const store   = getIVRStore();
    const session = await store.get(`call-${callSid}`, { type: 'json' });
    if (!session) return;
    const entry = { speaker, text, timestamp: new Date().toISOString() };
    await store.setJSON(`call-${callSid}`, {
      ...session,
      ...extraFields,
      entries: [...(session.entries || []), entry],
    });
  } catch (e) {
    console.error('[ivr-twilio] appendTranscript error:', e.message);
  }
}

/** Fire multiple transcript writes in parallel; cap total wait at 3 s. */
async function logTranscript(...tasks) {
  try {
    await Promise.race([
      Promise.all(tasks.map(([sid, speaker, text, extra]) =>
        appendTranscript(sid, speaker, text, extra)
      )),
      sleep(3000),
    ]);
  } catch (_) {}
}

// ── Main handler ───────────────────────────────────────────────────────────
exports.handler = async (event) => {
  const params  = event.queryStringParameters || {};
  const body    = new URLSearchParams(event.body || '');
  const step    = params.step || 'welcome';
  const callSid = params.callSid || body.get('CallSid') || '';
  const lang    = params.lang || 'en';
  const issue   = params.issue || '';
  const state   = params.triageState || '';
  const base    = params.webhookBase || `https://${event.headers.host}/.netlify/functions`;

  // ── status_callback ──────────────────────────────────────────────────────
  if (step === 'status_callback') {
    const callStatus = body.get('CallStatus') || '';
    try {
      const store = getIVRStore();
      const session = await store.get(`call-${callSid}`, { type: 'json' });
      if (session) {
        const statusMap = {
          'completed': 'completed', 'failed': 'failed', 'busy': 'failed',
          'no-answer': 'failed', 'canceled': 'failed',
          'in-progress': 'in-progress', 'ringing': 'ringing',
        };
        await store.setJSON(`call-${callSid}`, {
          ...session,
          status: statusMap[callStatus] || callStatus,
        });
      }
    } catch (e) { console.error('[status_callback]', e.message); }
    return { statusCode: 204, body: '' };
  }

  // ── welcome ──────────────────────────────────────────────────────────────
  if (step === 'welcome') {
    const twilioCallSid = body.get('CallSid') || callSid;
    const welcomeMsg = 'Welcome to FinAgent AI Support. For English press 1. Hindi ke liye 2 dabaen.';

    // Await so Blobs write completes before returning TwiML (capped at 3 s)
    await logTranscript(
      [twilioCallSid, 'bot', welcomeMsg, { status: 'in-progress' }],
    );

    const langUrl = buildActionUrl(base, {
      step: 'lang_selected', callSid: twilioCallSid, webhookBase: base,
    });

    const prompt = say('Welcome to FinAgent AI Support.', 'en') +
                   say('For English, press 1. Hindi ke liye, 2 dabaen.', 'en');

    return twiml(
      gather(langUrl, 'en', prompt, { numDigits: '1', input: 'dtmf', timeout: 10 }) +
      say('We did not receive your input. Please call again. Goodbye.') +
      '<Hangup/>'
    );
  }

  // ── lang_selected ─────────────────────────────────────────────────────────
  if (step === 'lang_selected') {
    const digit   = body.get('Digits') || '1';
    const selLang = digit === '2' ? 'hi' : 'en';

    const issueMenu = selLang === 'hi'
      ? 'Apni samasya chunen. Wallet top-up ke liye 1 dabaen. Payment failure ke liye 2. KYC verification ke liye 3. Login issue ke liye 4. General support ke liye 5 dabaen.'
      : 'Please select your issue. Press 1 for Wallet top-up. Press 2 for Payment failure. Press 3 for KYC verification. Press 4 for Login issues. Press 5 for General support.';

    await logTranscript(
      [callSid, 'customer', `Language selected: ${selLang === 'hi' ? 'Hindi' : 'English'}`, { language: selLang }],
      [callSid, 'bot', issueMenu],
    );

    const issueUrl = buildActionUrl(base, {
      step: 'issue_selected', lang: selLang, callSid, webhookBase: base,
    });

    return twiml(
      gather(issueUrl, selLang, say(issueMenu, selLang), { numDigits: '1', input: 'dtmf', timeout: 15 }) +
      say(issueMenu, selLang) +
      gather(issueUrl, selLang, '', { numDigits: '1', input: 'dtmf', timeout: 10 }) +
      '<Hangup/>'
    );
  }

  // ── issue_selected ────────────────────────────────────────────────────────
  if (step === 'issue_selected') {
    const digit     = body.get('Digits') || '5';
    const issueType = getIssueTypeFromDigit(digit);
    const initState = getInitialTriageState(issueType);
    const opener    = getIVROpener(issueType, lang);

    const promptMsg = lang === 'hi'
      ? 'Beep ke baad apni samasya bataen.'
      : 'Please describe your issue after the beep.';

    const responseUrl = buildActionUrl(base, {
      step: 'triage_response', lang, issue: issueType,
      triageState: initState, callSid, webhookBase: base,
    });

    await logTranscript(
      [callSid, 'customer', `Issue selected: ${issueType.replace('_', ' ')}`, { issueType, triageState: initState }],
      [callSid, 'bot', opener],
    );

    return twiml(
      say(opener, lang) +
      say(promptMsg, lang) +
      gather(responseUrl, lang, '', { input: 'speech dtmf', timeout: 10 }) +
      say(lang === 'hi' ? 'Aapki awaaz nahi suni. Kripya dobara call karein.' : 'We could not hear you. Please call again.') +
      '<Hangup/>'
    );
  }

  // ── triage_response ───────────────────────────────────────────────────────
  if (step === 'triage_response') {
    const speechResult = body.get('SpeechResult') || body.get('Digits') || '';
    const issueType    = issue;
    const currentState = state;

    if (!speechResult.trim()) {
      const retry = lang === 'hi'
        ? 'Aapki awaaz nahi suni. Kripya phir se bolein.'
        : 'We did not hear you. Please try again.';
      const retryUrl = buildActionUrl(base, {
        step: 'triage_response', lang, issue: issueType,
        triageState: currentState, callSid, webhookBase: base,
      });
      await logTranscript([callSid, 'customer', '(no speech detected)'], [callSid, 'bot', retry]);
      return twiml(
        say(retry, lang) +
        gather(retryUrl, lang, '', { input: 'speech dtmf', timeout: 10 }) +
        '<Hangup/>'
      );
    }

    const result = processIVRTriageMessage(issueType, currentState, speechResult, lang);

    if (result.isTerminal || result.nextState === 'terminal') {
      const bye = lang === 'hi'
        ? 'Dhanyavaad. Aapka din shubh ho. Alvida.'
        : 'Thank you for calling FinAgent. Have a great day. Goodbye.';
      await logTranscript(
        [callSid, 'customer', speechResult],
        [callSid, 'bot', result.message, { triageState: result.nextState }],
        [callSid, 'system', 'Call completed', { status: 'completed' }],
      );
      return twiml(say(result.message, lang) + say(bye, lang) + '<Hangup/>');
    }

    const followUp = lang === 'hi' ? 'Beep ke baad jawab dein.' : 'Please respond after the beep.';
    const nextUrl  = buildActionUrl(base, {
      step: 'triage_response', lang, issue: issueType,
      triageState: result.nextState, callSid, webhookBase: base,
    });

    await logTranscript(
      [callSid, 'customer', speechResult],
      [callSid, 'bot', result.message, { triageState: result.nextState }],
    );

    return twiml(
      say(result.message, lang) +
      say(followUp, lang) +
      gather(nextUrl, lang, '', { input: 'speech dtmf', timeout: 10 }) +
      say(lang === 'hi' ? 'Aapki awaaz nahi suni. Alvida.' : 'We could not hear you. Goodbye.') +
      '<Hangup/>'
    );
  }

  // Fallback
  return twiml(say('An error occurred. Please call again. Goodbye.') + '<Hangup/>');
};
