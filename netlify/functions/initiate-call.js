/**
 * Netlify Function: initiate-call
 * Triggers an outbound IVR call via Twilio or Exotel.
 * Stores session config in Netlify Blobs for webhook retrieval.
 *
 * POST /.netlify/functions/initiate-call
 * Body: { provider, customerPhone, customerId, config, geminiKey, baseUrl }
 */

const { getStore } = require('@netlify/blobs');

function getIVRStore() {
  const siteID = process.env.NETLIFY_SITE_ID;
  const token  = process.env.NETLIFY_AUTH_TOKEN;
  if (siteID && token) return getStore({ name: 'ivr-sessions', siteID, token });
  return getStore('ivr-sessions');
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { provider, customerPhone, customerId, config, geminiKey, baseUrl } = body;

  if (!provider || !customerPhone || !config || !baseUrl) {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: 'Missing required fields: provider, customerPhone, config, baseUrl' }),
    };
  }

  const webhookBase = `${baseUrl}/.netlify/functions`;

  try {
    let callSid;

    if (provider === 'twilio') {
      callSid = await initiateTwilioCall(customerPhone, config, webhookBase);
    } else if (provider === 'exotel') {
      callSid = await initiateExotelCall(customerPhone, config, webhookBase);
    } else {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: `Unknown provider: ${provider}` }) };
    }

    // Store session in Netlify Blobs so webhook functions can read config
    const store = getIVRStore();
    const sessionData = {
      callSid,
      provider,
      customerId,
      customerPhone,
      config,
      geminiKey,
      webhookBase,
      status: 'initiated',
      language: null,
      issueType: null,
      triageState: null,
      entries: [
        {
          speaker: 'system',
          text: `IVR call initiated via ${provider === 'twilio' ? 'Twilio' : 'Exotel'} to ${customerPhone}`,
          timestamp: new Date().toISOString(),
        },
      ],
      startedAt: new Date().toISOString(),
    };
    await store.setJSON(`call-${callSid}`, sessionData);

    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, callSid }),
    };
  } catch (err) {
    console.error('[initiate-call] Error:', err);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: err.message || 'Failed to initiate call' }),
    };
  }
};

// ── Twilio outbound call ──────────────────────────────────────────────────
async function initiateTwilioCall(customerPhone, config, webhookBase) {
  const { accountSid, authToken, phoneNumber } = config;
  if (!accountSid || !authToken || !phoneNumber) {
    throw new Error('Twilio config missing: accountSid, authToken, or phoneNumber');
  }

  const cleanPhone = customerPhone.replace(/\s/g, '');
  const webhookUrl = `${webhookBase}/ivr-twilio?step=welcome`;

  const formData = new URLSearchParams({
    From: phoneNumber,
    To: cleanPhone,
    Url: webhookUrl,
    StatusCallback: `${webhookBase}/ivr-twilio?step=status_callback`,
    StatusCallbackMethod: 'POST',
  });

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    },
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Twilio error ${res.status}`);
  }
  return data.sid; // CallSid
}

// ── Exotel outbound call ──────────────────────────────────────────────────
async function initiateExotelCall(customerPhone, config, webhookBase) {
  const { accountSid, apiKey, apiToken, subdomain, exophone } = config;
  if (!accountSid || !apiKey || !apiToken || !subdomain) {
    throw new Error('Exotel config missing: accountSid, apiKey, apiToken, or subdomain');
  }
  if (!exophone) {
    throw new Error('Exotel exophone (virtual number) not configured');
  }

  const cleanPhone = customerPhone.replace(/\s/g, '');
  const webhookUrl = `${webhookBase}/ivr-exotel?step=welcome`;

  const formData = new URLSearchParams({
    From: exophone,
    To: cleanPhone,
    Url: webhookUrl,
    StatusCallback: `${webhookBase}/ivr-exotel?step=status_callback`,
    CallType: 'trans',
  });

  const res = await fetch(
    `https://${subdomain}/v1/Accounts/${accountSid}/Calls/connect.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${apiKey}:${apiToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    },
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error((data.RestException && data.RestException.Message) || `Exotel error ${res.status}`);
  }
  return data.Call && data.Call.Sid ? data.Call.Sid : `exo-${Date.now()}`;
}
