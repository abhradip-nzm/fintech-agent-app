/**
 * Netlify Function: ivr-exotel
 * Handles all Exotel IVR webhook callbacks — returns ExoML.
 *
 * Steps handled via ?step= query param:
 *   welcome           → Language selection (DTMF 1=English, 2=Hindi)
 *   lang_selected     → Issue selection (DTMF 1-5)
 *   issue_selected    → Play initial triage message → Record customer voice
 *   triage_recording  → Download recording → Gemini transcription → Triage → loop or hangup
 *   status_callback   → Update call status in Blobs
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

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>';

function exoml(body) {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/xml' },
    body: `${XML_HEADER}\n<Response>${body}</Response>`,
  };
}

// ── Append transcript entry ────────────────────────────────────────────────
async function appendTranscript(callSid, speaker, text, extraFields = {}) {
  try {
    const store = getIVRStore();
    const session = await store.get(`call-${callSid}`, { type: 'json' });
    if (!session) return;
    const entry = { speaker, text, timestamp: new Date().toISOString() };
    await store.setJSON(`call-${callSid}`, {
      ...session,
      ...extraFields,
      entries: [...(session.entries || []), entry],
    });
  } catch (e) {
    console.error('[ivr-exotel] appendTranscript error:', e.message);
  }
}

// ── Gemini audio transcription ────────────────────────────────────────────
async function transcribeWithGemini(audioUrl, geminiKey, authHeader) {
  try {
    // Download the recording
    const audioRes = await fetch(audioUrl, {
      headers: authHeader ? { Authorization: authHeader } : {},
    });
    if (!audioRes.ok) throw new Error(`Audio download failed: ${audioRes.status}`);
    const audioBuffer = await audioRes.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    // Detect MIME type from URL
    const mimeType = audioUrl.includes('.mp3') ? 'audio/mp3' : 'audio/wav';

    // Send to Gemini
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: mimeType, data: audioBase64 } },
              { text: 'Transcribe this customer support voice message accurately. Return ONLY the transcription text, nothing else. If the speech is in Hindi, transcribe in Hindi script.' },
            ],
          }],
          generationConfig: { maxOutputTokens: 256 },
        }),
      },
    );
    const geminiData = await geminiRes.json();
    const transcript = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return transcript.trim();
  } catch (err) {
    console.error('[Gemini transcribe] error:', err.message);
    return '';
  }
}

// ── Main handler ───────────────────────────────────────────────────────────
exports.handler = async (event) => {
  const params  = event.queryStringParameters || {};
  const body    = new URLSearchParams(event.body || '');
  const step    = params.step || 'welcome';
  // Exotel uses 'CallSid' or 'sid' in the body
  const callSid = params.callSid || body.get('CallSid') || body.get('sid') || '';
  const lang    = params.lang    || 'en';
  const issue   = params.issue   || '';
  const state   = params.triageState || '';

  const base = params.webhookBase || `https://${event.headers.host}/.netlify/functions`;

  // ── status_callback ──────────────────────────────────────────────────────
  if (step === 'status_callback') {
    const callStatus = body.get('Status') || body.get('CallStatus') || '';
    try {
      const store = getIVRStore();
      const session = await store.get(`call-${callSid}`, { type: 'json' });
      if (session) {
        await store.setJSON(`call-${callSid}`, {
          ...session,
          status: callStatus === 'completed' ? 'completed' : callStatus.toLowerCase().includes('fail') ? 'failed' : callStatus,
        });
      }
    } catch (_) {}
    return { statusCode: 204, body: '' };
  }

  // ── welcome ───────────────────────────────────────────────────────────────
  if (step === 'welcome') {
    const exoCallSid = body.get('CallSid') || body.get('sid') || callSid;
    try {
      const store = getIVRStore();
      const session = await store.get(`call-${exoCallSid}`, { type: 'json' });
      if (session) await store.setJSON(`call-${exoCallSid}`, { ...session, status: 'in-progress' });
    } catch (_) {}

    const welcomeMsg = 'Welcome to FinAgent AI Support. For English, press 1. Hindi ke liye, 2 dabaen.';
    await appendTranscript(exoCallSid, 'bot', welcomeMsg, { status: 'in-progress' });

    const langUrl = `${base}/ivr-exotel?step=lang_selected&callSid=${exoCallSid}&webhookBase=${encodeURIComponent(base)}`;

    return exoml(`
      <Gather action="${langUrl}" method="POST" numDigits="1" timeout="10" finishOnKey="#">
        <Say>${welcomeMsg}</Say>
      </Gather>
      <Say>We did not receive your input. Please call again.</Say>
      <Hangup/>
    `);
  }

  // ── lang_selected ─────────────────────────────────────────────────────────
  if (step === 'lang_selected') {
    const digit   = body.get('digits') || body.get('Digits') || '1';
    const selLang = digit === '2' ? 'hi' : 'en';

    const issueMenu = selLang === 'hi'
      ? 'Apni samasya chunen. Wallet top-up ke liye 1 dabaen. Payment failure ke liye 2. KYC verification ke liye 3. Login issue ke liye 4. General support ke liye 5 dabaen.'
      : 'Please select your issue. Press 1 for Wallet top-up. Press 2 for Payment failure. Press 3 for KYC verification. Press 4 for Login issues. Press 5 for General support.';

    await appendTranscript(callSid, 'customer', `Language selected: ${selLang === 'hi' ? 'Hindi' : 'English'}`, { language: selLang });
    await appendTranscript(callSid, 'bot', issueMenu);

    const issueUrl = `${base}/ivr-exotel?step=issue_selected&lang=${selLang}&callSid=${callSid}&webhookBase=${encodeURIComponent(base)}`;

    return exoml(`
      <Gather action="${issueUrl}" method="POST" numDigits="1" timeout="15" finishOnKey="#">
        <Say>${issueMenu}</Say>
      </Gather>
      <Say>${issueMenu}</Say>
      <Gather action="${issueUrl}" method="POST" numDigits="1" timeout="10" finishOnKey="#">
      </Gather>
    `);
  }

  // ── issue_selected ─────────────────────────────────────────────────────────
  if (step === 'issue_selected') {
    const digit     = body.get('digits') || body.get('Digits') || '5';
    const issueType = getIssueTypeFromDigit(digit);
    const initState = getInitialTriageState(issueType);
    const opener    = getIVROpener(issueType, lang);

    await appendTranscript(callSid, 'customer', `Issue selected: ${issueType.replace('_', ' ')}`, { issueType, triageState: initState });
    await appendTranscript(callSid, 'bot', opener);

    const promptMsg = lang === 'hi'
      ? 'Beep ke baad apni samasya bataen. Khatam hone par star key dabaen.'
      : 'Please describe your issue after the beep. Press star key when done.';

    const recordUrl = `${base}/ivr-exotel?step=triage_recording&lang=${lang}&issue=${issueType}&triageState=${initState}&callSid=${callSid}&webhookBase=${encodeURIComponent(base)}`;

    return exoml(`
      <Say>${opener}</Say>
      <Say>${promptMsg}</Say>
      <Record action="${recordUrl}" method="POST" maxLength="30" playBeep="true" finishOnKey="*"/>
      <Say>We could not record your voice. Please call again.</Say>
      <Hangup/>
    `);
  }

  // ── triage_recording ──────────────────────────────────────────────────────
  if (step === 'triage_recording') {
    const recordingUrl = body.get('RecordingUrl') || '';
    const issueType    = issue;
    const currentState = state;

    // Get session to retrieve Gemini key and Exotel auth
    let geminiKey  = '';
    let exotelAuth = '';
    try {
      const store = getIVRStore();
      const session = await store.get(`call-${callSid}`, { type: 'json' });
      if (session) {
        geminiKey = session.geminiKey || '';
        if (session.config && session.config.apiKey && session.config.apiToken) {
          exotelAuth = `Basic ${Buffer.from(`${session.config.apiKey}:${session.config.apiToken}`).toString('base64')}`;
        }
      }
    } catch (_) {}

    let customerSpeech = '';
    if (recordingUrl && geminiKey) {
      customerSpeech = await transcribeWithGemini(recordingUrl, geminiKey, exotelAuth);
    }

    if (!customerSpeech) {
      const retry = lang === 'hi' ? 'Aapki awaaz nahi suni. Kripya phir bolein.' : 'We could not hear you clearly. Please try again.';
      await appendTranscript(callSid, 'customer', '(no speech detected)');
      await appendTranscript(callSid, 'bot', retry);

      const retryUrl = `${base}/ivr-exotel?step=triage_recording&lang=${lang}&issue=${issueType}&triageState=${currentState}&callSid=${callSid}&webhookBase=${encodeURIComponent(base)}`;
      return exoml(`
        <Say>${retry}</Say>
        <Record action="${retryUrl}" method="POST" maxLength="30" playBeep="true" finishOnKey="*"/>
        <Hangup/>
      `);
    }

    await appendTranscript(callSid, 'customer', customerSpeech);

    const result = processIVRTriageMessage(issueType, currentState, customerSpeech, lang);
    await appendTranscript(callSid, 'bot', result.message, { triageState: result.nextState });

    if (result.isTerminal || result.nextState === 'terminal') {
      const bye = lang === 'hi'
        ? 'Dhanyavaad. Aapka din shubh ho. Alvida.'
        : 'Thank you for calling FinAgent. Have a great day. Goodbye.';
      await appendTranscript(callSid, 'system', 'Call completed', { status: 'completed' });
      return exoml(`<Say>${result.message}</Say><Say>${bye}</Say><Hangup/>`);
    }

    const followUp = lang === 'hi' ? 'Beep ke baad jawab dein.' : 'Please respond after the beep.';
    const nextUrl  = `${base}/ivr-exotel?step=triage_recording&lang=${lang}&issue=${issueType}&triageState=${result.nextState}&callSid=${callSid}&webhookBase=${encodeURIComponent(base)}`;

    return exoml(`
      <Say>${result.message}</Say>
      <Say>${followUp}</Say>
      <Record action="${nextUrl}" method="POST" maxLength="30" playBeep="true" finishOnKey="*"/>
      <Say>We could not hear you. Goodbye.</Say>
      <Hangup/>
    `);
  }

  // Fallback
  return exoml('<Say>An error occurred. Please call again. Goodbye.</Say><Hangup/>');
};
