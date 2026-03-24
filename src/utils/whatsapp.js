// WhatsApp Integration Utility
// Using CallMeBot free WhatsApp API for simulation
// Free tier: https://www.callmebot.com/blog/free-api-whatsapp-messages/
// Setup: User needs to add +34 644 59 86 74 to contacts and send "I allow callmebot to send me messages"

const CALLMEBOT_API = 'https://api.callmebot.com/whatsapp.php';

// Demo phone number (from requirements)
const DEMO_PHONE = '918617269309';
const DEMO_APIKEY = 'YOUR_CALLMEBOT_APIKEY'; // User needs to get this from CallMeBot

/**
 * Send a WhatsApp message via CallMeBot API (free)
 * Setup instructions:
 * 1. Save +34 644 59 86 74 in your phone contacts as "CallMeBot"
 * 2. Send "I allow callmebot to send me messages" to that number via WhatsApp
 * 3. You'll receive an API key
 * 4. Replace DEMO_APIKEY with your received key
 */
export const sendWhatsAppMessage = async (phone, message, apiKey = DEMO_APIKEY) => {
  try {
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    
    // CallMeBot API endpoint
    const url = `${CALLMEBOT_API}?phone=${cleanPhone}&text=${encodedMessage}&apikey=${apiKey}`;
    
    // In production, make this server-side to protect API key
    const response = await fetch(url, { method: 'GET', mode: 'no-cors' });
    
    console.log(`[WhatsApp] Message sent to ${cleanPhone}: ${message.substring(0, 50)}...`);
    return { success: true, phone: cleanPhone };
  } catch (error) {
    console.error('[WhatsApp] Send failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Format a customer issue notification message
 */
export const formatIssueNotification = (customer, issue) => {
  return `🔔 *FinAgent Support*\n\nHello ${customer.name}! We noticed you might need help with: *${issue.title}*\n\nOur AI assistant is here to help you 24/7. Please reply to this message and we'll resolve your issue immediately.\n\n_FinAgent Intelligent Finance_ ✨`;
};

/**
 * Format an AI bot response message
 */
export const formatBotMessage = (message) => {
  return `🤖 *FinAgent AI Bot*\n\n${message}\n\n_Powered by AI | Reply anytime for instant support_`;
};

/**
 * Format a human agent takeover message
 */
export const formatAgentTakeover = (agentName, message) => {
  return `👤 *${agentName} (Human Agent)*\n\n${message}\n\n_FinAgent Premium Support_`;
};

/**
 * Simulate WhatsApp webhook incoming message
 * In production, this would be handled by a real webhook from WhatsApp Business API
 */
export const simulateIncomingMessage = (phone, message) => {
  return {
    from: phone,
    message: message,
    timestamp: new Date().toISOString(),
    type: 'text',
    source: 'whatsapp'
  };
};

// WhatsApp API Integration Notes for Developer:
// 
// FREE OPTIONS:
// 1. CallMeBot (Recommended for demo):
//    - Free, no server needed
//    - Setup: https://www.callmebot.com/blog/free-api-whatsapp-messages/
//    - Limitation: One-way (send only), 50 msgs/day
//
// 2. UltraMsg (Free trial):
//    - Free trial with 100 msgs
//    - Two-way messaging
//    - https://ultramsg.com/
//
// 3. Fonnte (Free tier):
//    - Free tier available
//    - https://fonnte.com/
//
// For production, use:
// - WhatsApp Business API (Meta)
// - Twilio WhatsApp API
// - 360dialog
