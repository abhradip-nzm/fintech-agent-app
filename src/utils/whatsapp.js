// WhatsApp Integration — Whapi.Cloud
// Free tier: 150 msgs/day · No credit card needed
// Docs: https://whapi.cloud/docs

import { readWhapiToken } from './storage';

const WHAPI_BASE = 'https://gate.whapi.cloud';
const WHAPI_API  = `${WHAPI_BASE}/messages/text`;

/**
 * Send a WhatsApp text message via Whapi.Cloud
 * @param {string} phone   – recipient with country code, e.g. "+918617269309"
 * @param {string} message – plain-text body
 */
export const sendWhatsAppMessage = async (phone, message) => {
  try {
    // Whapi wants digits only — no "+" prefix
    const cleanPhone = phone.replace(/\D/g, '');
    const token = readWhapiToken();

    const response = await fetch(WHAPI_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to: cleanPhone, body: message }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`[WhatsApp] ✓ Sent to ${cleanPhone}`, data);
      return { success: true, phone: cleanPhone, messageId: data.id };
    } else {
      console.error('[WhatsApp] API error:', data);
      return { success: false, error: data?.message || 'Unknown error' };
    }
  } catch (err) {
    console.error('[WhatsApp] Network error:', err);
    return { success: false, error: err.message };
  }
};

/** Format an AI bot message for WhatsApp delivery */
export const formatBotMessage = (message) =>
  `🤖 *FinAgent AI Bot*\n\n${message}\n\n_Powered by AI | Reply anytime for instant support_`;

/** Format a human-agent message for WhatsApp delivery */
export const formatAgentTakeover = (agentName, message) =>
  `👤 *${agentName} (Human Agent)*\n\n${message}\n\n_FinAgent Premium Support_`;

/** Format an initial issue-notification message */
export const formatIssueNotification = (customer, issue) =>
  `🔔 *FinAgent Support*\n\nHello ${customer.name}! We noticed you need help with: *${issue.title}*\n\nOur AI assistant is here 24/7 — just reply and we'll resolve your issue immediately.\n\n_FinAgent Intelligent Finance_ ✨`;

/** Simulate an incoming WhatsApp message (used for demo) */
export const simulateIncomingMessage = (phone, message) => ({
  from: phone,
  message,
  timestamp: new Date().toISOString(),
  type: 'text',
  source: 'whatsapp',
});

/**
 * Fetch incoming messages (replies) from a customer's WhatsApp number via Whapi.Cloud
 * @param {string} phone  – customer phone, e.g. "+918617269309"
 * @param {number} count  – how many recent messages to fetch (default 30)
 * Returns: { success, messages: [{ id, message, timestamp }], error? }
 */
export const fetchIncomingMessages = async (phone, count = 30) => {
  try {
    const cleanPhone = phone.replace(/\D/g, '');
    // Whapi chat ID format: {digits}@s.whatsapp.net
    const chatId = `${cleanPhone}@s.whatsapp.net`;
    const url = `${WHAPI_BASE}/messages/list/${encodeURIComponent(chatId)}?count=${count}&offset=0`;
    const token = readWhapiToken();

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { success: false, messages: [], error: err?.message || `HTTP ${response.status}` };
    }

    const data = await response.json();
    // Filter only messages FROM the customer (not sent by us)
    const incoming = (data.messages || [])
      .filter(m => m.from_me === false && (m.type === 'text' || m.text))
      .map(m => ({
        id: m.id,
        message: m.body || m.text?.body || m.text || '',
        timestamp: m.timestamp ? new Date(m.timestamp * 1000).toISOString() : new Date().toISOString(),
        from: m.from,
      }))
      .filter(m => m.message.trim());

    console.log(`[WhatsApp] Fetched ${incoming.length} incoming messages for ${cleanPhone}`);
    return { success: true, messages: incoming };
  } catch (err) {
    console.error('[WhatsApp] fetchIncomingMessages error:', err);
    return { success: false, messages: [], error: err.message };
  }
};
