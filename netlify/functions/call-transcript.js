/**
 * Netlify Function: call-transcript
 * Frontend polls this to get the live IVR call transcript.
 *
 * GET /.netlify/functions/call-transcript?callSid=CA...
 * Returns: { callSid, status, language, issueType, triageState, entries[] }
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
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  const params  = event.queryStringParameters || {};
  const callSid = params.callSid || '';

  if (!callSid) {
    return {
      statusCode: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'callSid is required' }),
    };
  }

  try {
    const store   = getIVRStore();
    const session = await store.get(`call-${callSid}`, { type: 'json' });

    if (!session) {
      return {
        statusCode: 404,
        headers: { ...CORS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Session not found', callSid }),
      };
    }

    // Return only what the frontend needs (never return raw credentials)
    const safe = {
      callSid:      session.callSid,
      provider:     session.provider,
      customerId:   session.customerId,
      customerPhone: session.customerPhone,
      status:       session.status,
      language:     session.language,
      issueType:    session.issueType,
      triageState:  session.triageState,
      startedAt:    session.startedAt,
      entries:      session.entries || [],
    };

    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify(safe),
    };
  } catch (err) {
    console.error('[call-transcript] Error:', err);
    return {
      statusCode: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to read transcript', detail: err.message }),
    };
  }
};
