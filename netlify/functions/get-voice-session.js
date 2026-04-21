/**
 * get-voice-session.js — ElevenLabs Conversational AI signed URL generator.
 *
 * Keeps ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID on the server so they
 * are never exposed to the browser.  Returns a short-lived signed WebSocket
 * URL that the frontend passes directly to @11labs/client.
 *
 * Environment variables required (Netlify → Site settings → Env vars):
 *   ELEVENLABS_API_KEY   — your ElevenLabs API key  (xi-api-key)
 *   ELEVENLABS_AGENT_ID  — the Conversational AI agent ID
 *
 * Local development (.env):
 *   ELEVENLABS_API_KEY=sk_...
 *   ELEVENLABS_AGENT_ID=agent_01j...
 */

exports.handler = async (event) => {
  const CORS = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey  = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;

  if (!apiKey || !agentId) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({
        error: 'ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID must be set in environment variables.',
      }),
    };
  }

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${encodeURIComponent(agentId)}`,
      { headers: { 'xi-api-key': apiKey } },
    );

    if (!res.ok) {
      const body = await res.text();
      console.error('[get-voice-session] ElevenLabs error:', res.status, body);
      return {
        statusCode: res.status,
        headers: CORS,
        body: JSON.stringify({ error: `ElevenLabs API error: ${res.status}` }),
      };
    }

    const data = await res.json();
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ signedUrl: data.signed_url }),
    };
  } catch (err) {
    console.error('[get-voice-session] Unexpected error:', err);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: err.message || 'Internal server error' }),
    };
  }
};
