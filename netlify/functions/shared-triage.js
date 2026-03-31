/**
 * Self-contained triage engine for Netlify IVR Functions.
 * IVR-optimised messages (no markdown, no emojis, TTS-friendly).
 */

// ── Detection helpers ─────────────────────────────────────────────────────
const has = (msg, ...terms) => terms.some(t => msg.toLowerCase().includes(t));
const hasRef = msg => /\b[A-Z0-9]{8,24}\b/.test(msg);

const isPositive = msg => has(msg,
  'yes','sure','ok','please','yeah','done','fixed','working','thank','solved','resolved','great','correct','right',
  'हाँ','हां','ठीक','हो गया','सही','धन्यवाद',
  'ya','iya','baik','sudah','benar','terima kasih','berhasil',
);
const isNegative = msg => has(msg,
  'no','not','still',"doesn't","didn't","can't",'cannot','nope','never',
  'नहीं','अभी भी','नही',
  'tidak','belum','masih','gagal',
);

// ── IVR messages — TTS-friendly, no markdown/emojis ──────────────────────
const IVR = {
  wallet_topup: {
    initial: {
      en: "I can see you have a wallet top-up issue. Please say your UPI Reference ID or Transaction ID. You can find it in your Google Pay, PhonePe, or bank SMS.",
      hi: "मुझे पता चला है कि आपका वॉलेट टॉप-अप नहीं हुआ है। कृपया अपना UPI रेफरेंस ID या ट्रांजेक्शन ID बोलें। आप इसे अपने Google Pay, PhonePe या बैंक SMS में पा सकते हैं।",
    },
    awaiting_ref: {
      onMatch: {
        en: "Thank you. I have located your transaction. It looks like the amount was received but is pending reconciliation. Was this paid via UPI or Net Banking? And which bank or app did you use?",
        hi: "धन्यवाद। मैंने आपका ट्रांजेक्शन ढूंढ लिया है। राशि मिल गई है लेकिन reconciliation pending है। क्या यह UPI या Net Banking से किया था? और किस बैंक या ऐप का उपयोग किया?",
      },
      onNoMatch: {
        en: "I need your UPI Reference ID or Transaction ID to trace the payment. Please say the 12-digit number from your Google Pay, PhonePe, or bank SMS.",
        hi: "मुझे आपका UPI रेफरेंस ID या ट्रांजेक्शन ID चाहिए। कृपया अपने Google Pay, PhonePe या बैंक SMS से 12 अंकों का नंबर बोलें।",
      },
    },
    awaiting_payment_mode: {
      onMatch: {
        en: "Perfect. All details confirmed. I have escalated this to our payments reconciliation team with high priority. Your wallet should be credited within 30 minutes. You will receive an SMS once done. Would you like a WhatsApp confirmation link as well?",
        hi: "बिल्कुल सही। सभी विवरण कन्फर्म हो गए। मैंने इसे हमारी payments reconciliation टीम को high priority के साथ भेज दिया है। 30 मिनट के भीतर आपका वॉलेट क्रेडिट होगा। क्या आप WhatsApp पर confirmation link भी चाहते हैं?",
      },
      onNoMatch: {
        en: "Which payment method did you use? Please say UPI, Net Banking, or Debit Card.",
        hi: "आपने किस payment method का उपयोग किया? कृपया UPI, Net Banking या Debit Card बोलें।",
      },
    },
    offer_confirmation: {
      onMatch: {
        en: "Great. Confirmation link sent to your registered number. Your transaction has been traced and the reconciliation team is notified. You will receive an update within 30 minutes. Is there anything else I can help you with?",
        hi: "बढ़िया। Confirmation link आपके registered number पर भेज दिया गया है। Reconciliation टीम को सूचित किया गया है। 30 मिनट में update मिलेगा। क्या मैं और कोई सहायता कर सकता हूँ?",
      },
      onNoMatch: {
        en: "No problem. Your case has been escalated with highest priority. Please expect your wallet credit within 30 minutes. Is there anything else?",
        hi: "कोई बात नहीं। आपका केस सर्वोच्च प्राथमिकता से escalate कर दिया गया है। 30 मिनट में वॉलेट क्रेडिट होगा। क्या और कोई सहायता चाहिए?",
      },
    },
    closing: {
      onMatch: {
        en: "You are welcome. Your issue has been noted as resolved. Feel free to call anytime. Have a great day.",
        hi: "आपका स्वागत है। आपकी समस्या resolved नोट की गई है। कभी भी call करें। आपका दिन शुभ हो।",
      },
      onNoMatch: {
        en: "Feel free to call if you need anything else. Have a great day.",
        hi: "अगर कुछ और चाहिए तो call करें। आपका दिन शुभ हो।",
      },
    },
  },

  payment_failure: {
    initial: {
      en: "I see your payment was declined. Let me help you right away. Which UPI app or payment method were you using? For example, Google Pay, PhonePe, Net Banking, or Debit Card.",
      hi: "मुझे पता चला है कि आपका भुगतान decline हो गया। मैं अभी मदद करता हूँ। आप कौन सा UPI ऐप या payment method उपयोग कर रहे थे? जैसे Google Pay, PhonePe, Net Banking या Debit Card।",
    },
    awaiting_app: {
      onMatch: {
        en: "Got it. What error message did you see? For example, Transaction Limit Exceeded, Insufficient Funds, Bank Server Error, or Wrong UPI PIN?",
        hi: "समझ गया। आपने कौन सा error message देखा? जैसे Transaction Limit Exceeded, Insufficient Funds, Bank Server Error या Wrong UPI PIN?",
      },
      onNoMatch: {
        en: "Could you tell me which payment app or method you used? Please say Google Pay, PhonePe, Net Banking, or Debit Card.",
        hi: "क्या आप बता सकते हैं किस payment app या method का उपयोग किया? Google Pay, PhonePe, Net Banking या Debit Card बोलें।",
      },
    },
    awaiting_error: {
      onMatch: {
        en: "Understood. I have immediately lifted your daily UPI limit for one hour and cleared the transaction lock on your account. Please retry the payment now. It should go through. Should I stay on the line while you try?",
        hi: "समझ गया। मैंने आपकी daily UPI limit 1 घंटे के लिए हटा दी है और account का transaction lock clear कर दिया है। कृपया अभी payment retry करें। यह हो जानी चाहिए। क्या मैं line पर रहूँ?",
      },
      onNoMatch: {
        en: "I have checked your account. It seems like a temporary bank-side restriction. I have cleared the transaction block. Please force close your UPI app, wait 2 minutes, and retry the payment. Did that work?",
        hi: "मैंने आपका account जाँचा। यह bank की temporary restriction लगती है। मैंने transaction block हटा दिया है। UPI ऐप force close करें, 2 मिनट रुकें, फिर retry करें। क्या काम किया?",
      },
    },
    awaiting_retry_confirm: {
      onMatch: {
        en: "Great. I am monitoring your account in real time. After retrying please say it worked if successful, or still failing if not.",
        hi: "बढ़िया। मैं आपका account real-time में monitor कर रहा हूँ। Retry करने के बाद बताएं कि काम किया या नहीं।",
      },
      onNoMatch: {
        en: "No worries. I have escalated your case to our senior payments team. They will review and call you within 30 minutes.",
        hi: "चिंता न करें। आपका केस senior payments team को भेज दिया गया है। वे 30 मिनट में call करेंगे।",
      },
    },
    awaiting_retry_result: {
      onMatch: {
        en: "Excellent. Glad the payment went through. Your case is marked as resolved. Is there anything else?",
        hi: "बहुत बढ़िया। Payment हो गई। आपका केस resolved mark कर दिया गया है। क्या और कोई सहायता चाहिए?",
      },
      onNoMatch: {
        en: "I am sorry the issue persists. I have escalated this to our Level 2 Payments Team immediately with highest priority. A senior engineer will call you within 20 minutes.",
        hi: "खेद है कि समस्या अभी भी है। मैंने इसे तुरंत Level 2 Payments Team को escalate कर दिया है। Senior engineer 20 मिनट में call करेगा।",
      },
    },
    closing: {
      onMatch: {
        en: "Thank you for your patience. Your case is being handled. Feel free to call anytime.",
        hi: "आपके धैर्य के लिए धन्यवाद। आपका केस handle हो रहा है। कभी भी call करें।",
      },
      onNoMatch: {
        en: "Thank you for calling. Our team is on it. Have a great day.",
        hi: "Call करने के लिए धन्यवाद। हमारी टीम इस पर काम कर रही है। आपका दिन शुभ हो।",
      },
    },
  },

  kyc_incomplete: {
    initial: {
      en: "I see your KYC verification is pending. This is important to unlock your full account benefits. Have you already submitted your Aadhaar and PAN card documents?",
      hi: "मुझे दिख रहा है कि आपका KYC verification pending है। यह आपके account के पूरे फायदे unlock करने के लिए ज़रूरी है। क्या आपने Aadhaar और PAN card documents submit किए हैं?",
    },
    awaiting_doc_status: {
      onMatch: {
        en: "Great. Let me check your submission status. I can see your documents were received but Aadhaar verification is pending. Is the name on your Aadhaar exactly the same as your account name? And is your Aadhaar photo clear?",
        hi: "बढ़िया। मैं आपकी submission status जाँच रहा हूँ। Documents मिल गए हैं लेकिन Aadhaar verification pending है। क्या आपके Aadhaar पर नाम account नाम से बिल्कुल मेल खाता है? और Aadhaar की फ़ोटो साफ़ है?",
      },
      onNoMatch: {
        en: "No worries. You will need to upload your Aadhaar card front and back, your PAN card front, and a clear selfie. You can do this in the app under Settings, then KYC Verification, then Upload Documents. Have you done this step?",
        hi: "कोई बात नहीं। आपको Aadhaar card के आगे और पीछे, PAN card का आगे, और एक साफ़ selfie upload करना होगा। ऐप में Settings, फिर KYC Verification, फिर Upload Documents में जाएं। क्या आपने यह step किया है?",
      },
    },
    awaiting_aadhaar_check: {
      onMatch: {
        en: "Perfect. Everything looks good. I have flagged your KYC for manual review by our compliance team. This typically takes 2 to 4 hours. You will receive an SMS and app notification once verified.",
        hi: "बिल्कुल सही। सब ठीक दिख रहा है। मैंने आपका KYC compliance team की manual review के लिए flag कर दिया है। इसमें 2 से 4 घंटे लग सकते हैं। Verify होने पर SMS और app notification मिलेगा।",
      },
      onNoMatch: {
        en: "A name mismatch or unclear photo is the most common reason for KYC failure. Please re-upload your Aadhaar with better lighting, ensure the name matches exactly, and make sure both sides are uploaded. Can you try re-uploading now?",
        hi: "नाम में अंतर या अस्पष्ट फ़ोटो KYC fail होने का सबसे आम कारण है। कृपया बेहतर रोशनी में Aadhaar re-upload करें, नाम बिल्कुल मेल खाए, और दोनों तरफ upload हों। क्या आप अभी re-upload कर सकते हैं?",
      },
    },
    awaiting_reupload: {
      onMatch: {
        en: "New documents received. I have marked your KYC for priority review. Expected completion is within 2 hours. You will get an SMS once approved. Is there anything else?",
        hi: "नए documents मिल गए। आपका KYC priority review के लिए mark कर दिया गया है। 2 घंटे में complete होगा। Approve होने पर SMS मिलेगा। क्या और कोई सहायता चाहिए?",
      },
      onNoMatch: {
        en: "Take your time. Whenever you have re-uploaded the documents, please call back and I will expedite the review.",
        hi: "समय लें। जब भी documents re-upload कर लें, call करें और मैं review जल्दी करूँगा।",
      },
    },
    closing: {
      onMatch: {
        en: "You are welcome. Your KYC verification is in progress. Have a great day.",
        hi: "आपका स्वागत है। आपका KYC verification progress में है। आपका दिन शुभ हो।",
      },
      onNoMatch: {
        en: "Happy to help. Feel free to call anytime. Have a wonderful day.",
        hi: "मदद करके खुशी हुई। कभी भी call करें। आपका दिन अच्छा हो।",
      },
    },
  },

  login_issue: {
    initial: {
      en: "I see you are having trouble logging in. Let me help you right away. What happens when you try to log in? Is the OTP not received, is it received but shows invalid, does the app crash, or is biometric login not working?",
      hi: "मुझे पता चला है कि आपको login में परेशानी हो रही है। मैं अभी मदद करता हूँ। Login करने पर क्या हो रहा है? OTP नहीं मिल रहा, Invalid दिख रहा है, ऐप crash हो रहा है, या biometric login काम नहीं कर रहा?",
    },
    awaiting_error_type: {
      onMatch: {
        en: "Got it. I have cleared your active sessions, reset the OTP cooldown timer, and verified your registered number. Please close the app completely, make sure your phone time is set to automatic, then open the app and request a fresh OTP. Did you receive the new OTP?",
        hi: "समझ गया। मैंने आपके active sessions clear किए, OTP cooldown timer reset किया, और आपका registered number verify किया। ऐप पूरी तरह बंद करें, phone का समय Automatic पर सेट करें, फिर ऐप खोलें और fresh OTP request करें। क्या नया OTP मिला?",
      },
      onNoMatch: {
        en: "I would like to understand the exact error. Can you describe what you see on screen? Is there an error message, does the OTP fail, or does the app show a loading screen?",
        hi: "मैं exact error समझना चाहता हूँ। क्या आप बता सकते हैं screen पर क्या दिख रहा है? कोई error message है, OTP fail होता है, या ऐप loading screen दिखाता है?",
      },
    },
    awaiting_otp_status: {
      onMatch: {
        en: "Great. Please enter the OTP within 60 seconds. I have extended your session window. If it fails again, use the resend via call option or clear the app cache in your phone settings.",
        hi: "बढ़िया। कृपया 60 सेकंड के भीतर OTP दर्ज करें। मैंने आपका session window बढ़ा दिया है। अगर फिर fail हो, तो resend via call option का उपयोग करें या phone settings में app cache clear करें।",
      },
      onNoMatch: {
        en: "OTP not received? I can also send the OTP via WhatsApp or email. Which would you prefer?",
        hi: "OTP नहीं मिला? मैं OTP WhatsApp या email से भी भेज सकता हूँ। आप क्या prefer करेंगे?",
      },
    },
    awaiting_otp_alt: {
      onMatch: {
        en: "Alternative OTP sent. Please check your WhatsApp or email now. Let me know once you log in successfully.",
        hi: "Alternative OTP भेज दिया गया है। कृपया अपना WhatsApp या email check करें। Successfully login करने के बाद बताएं।",
      },
      onNoMatch: {
        en: "I am generating a secure login link and sending it to your registered email. Please check your inbox and click the link to access your account.",
        hi: "मैं एक secure login link generate करके आपके registered email पर भेज रहा हूँ। Inbox check करें और link पर click करके account access करें।",
      },
    },
    awaiting_login_result: {
      onMatch: {
        en: "Wonderful. Glad you are back in. I will monitor your account for any login issues in the next 24 hours. Tip: enable biometric login in settings for faster access next time. Is there anything else?",
        hi: "बहुत बढ़िया। खुशी है कि आप वापस आ गए। मैं अगले 24 घंटों के लिए आपका account monitor करूँगा। Settings में Biometric Login enable करें। क्या और कोई सहायता चाहिए?",
      },
      onNoMatch: {
        en: "I am escalating this to our Technical Support Team immediately. A senior engineer will contact you within 15 minutes to resolve this remotely.",
        hi: "मैं इसे तुरंत Technical Support Team को escalate कर रहा हूँ। Senior engineer 15 मिनट में remotely resolve करने के लिए आपसे संपर्क करेगा।",
      },
    },
    closing: {
      onMatch: {
        en: "You are welcome. Your access has been restored. Have a great day.",
        hi: "आपका स्वागत है। आपका access बहाल हो गया है। आपका दिन शुभ हो।",
      },
      onNoMatch: {
        en: "Your case is being handled by our team. Feel free to call back anytime. Take care.",
        hi: "आपका केस हमारी टीम handle कर रही है। कभी भी call करें। ख्याल रखें।",
      },
    },
  },

  general: {
    initial: {
      en: "Hello, I am Agently AI, your support assistant. I can help you with payment issues, wallet top-ups, KYC verification, login problems, and account queries. Please describe your issue and I will resolve it right away.",
      hi: "नमस्ते, मैं Agently AI हूँ, आपका support assistant। मैं payment issues, wallet top-ups, KYC verification, login problems और account queries में मदद कर सकता हूँ। कृपया अपनी समस्या बताएं।",
    },
    awaiting_issue: {
      onMatch: {
        en: "Thank you for sharing that. I am checking your account details right now. Can you provide more context? For example, when did this happen, what error did you see, and have you tried any troubleshooting steps?",
        hi: "यह बताने के लिए धन्यवाद। मैं आपके account की details जाँच रहा हूँ। क्या आप और context दे सकते हैं? यह कब हुआ, क्या error देखा, और क्या कोई troubleshooting try किया?",
      },
      onNoMatch: {
        en: "Could you describe your issue in a little more detail? This helps me provide the most accurate solution.",
        hi: "क्या आप अपनी समस्या थोड़ा और detail में बता सकते हैं? इससे मुझे सबसे सटीक समाधान देने में मदद मिलती है।",
      },
    },
    gathering_context: {
      onMatch: {
        en: "Thank you. I have all the details I need. I have logged your case and notified our specialist team. They will contact you within 1 hour with a resolution. Is there anything else to add?",
        hi: "धन्यवाद। मेरे पास सभी ज़रूरी details हैं। आपका केस log कर दिया गया है और specialist team को सूचित किया गया है। वे 1 घंटे में resolution के साथ contact करेंगे। क्या कुछ और add करना है?",
      },
      onNoMatch: {
        en: "I understand. Let me connect you with the right specialist. Please hold on for a moment.",
        hi: "मैं समझता हूँ। मैं आपको सही specialist से connect कर रहा हूँ। एक पल रुकें।",
      },
    },
    closing: {
      onMatch: {
        en: "You are welcome. Your case is being handled. Feel free to call anytime. Have a great day.",
        hi: "आपका स्वागत है। आपका केस handle हो रहा है। कभी भी call करें। आपका दिन शुभ हो।",
      },
      onNoMatch: {
        en: "Thank you for calling. Our team is on it. Have a wonderful day.",
        hi: "Call करने के लिए धन्यवाद। हमारी टीम इस पर काम कर रही है। आपका दिन अच्छा हो।",
      },
    },
  },
};

// ── Issue registry ─────────────────────────────────────────────────────────
const ISSUE_TYPES = {
  1: 'wallet_topup',
  2: 'payment_failure',
  3: 'kyc_incomplete',
  4: 'login_issue',
  5: 'general',
};

const ISSUE_STATES = {
  wallet_topup: ['awaiting_ref', 'awaiting_payment_mode', 'offer_confirmation', 'closing'],
  payment_failure: ['awaiting_app', 'awaiting_error', 'awaiting_retry_confirm', 'awaiting_retry_result', 'closing'],
  kyc_incomplete: ['awaiting_doc_status', 'awaiting_aadhaar_check', 'awaiting_reupload', 'closing'],
  login_issue: ['awaiting_error_type', 'awaiting_otp_status', 'awaiting_otp_alt', 'awaiting_login_result', 'closing'],
  general: ['awaiting_issue', 'gathering_context', 'closing'],
};

// Triage detection logic (mirrors src/utils/triage.js)
const FLOW_DETECTS = {
  wallet_topup: {
    awaiting_ref:          msg => hasRef(msg) || has(msg, 'ref', 'transaction', 'txn', 'utr', 'id', 'number'),
    awaiting_payment_mode: msg => has(msg, 'upi', 'net banking', 'neft', 'imps', 'phonepe', 'gpay', 'google pay', 'bhim', 'paytm', 'debit', 'card', 'bank'),
    offer_confirmation:    msg => isPositive(msg),
    closing:               () => true,
  },
  payment_failure: {
    awaiting_app:          msg => has(msg, 'gpay', 'google pay', 'phonepe', 'bhim', 'paytm', 'upi', 'net banking', 'debit', 'card'),
    awaiting_error:        msg => has(msg, 'limit', 'exceeded', 'insufficient', 'funds', 'server', 'error', 'declined', 'pin', 'wrong', 'failed', 'timeout', 'pending'),
    awaiting_retry_confirm: msg => isPositive(msg) || has(msg, 'ok', 'trying', 'retry', 'will', 'let me'),
    awaiting_retry_result: msg => isPositive(msg) || has(msg, 'worked', 'success', 'done', 'through', 'went'),
    closing:               () => true,
  },
  kyc_incomplete: {
    awaiting_doc_status:   msg => isPositive(msg) || has(msg, 'yes', 'submitted', 'uploaded', 'sent', 'done', 'already'),
    awaiting_aadhaar_check: msg => isPositive(msg) || has(msg, 'yes', 'same', 'clear', 'correct', 'match'),
    awaiting_reupload:     msg => isPositive(msg) || has(msg, 'done', 'uploaded', 'sent', 'submitted', 'ok'),
    closing:               () => true,
  },
  login_issue: {
    awaiting_error_type:   msg => has(msg, 'otp', 'invalid', 'crash', 'fingerprint', 'face', 'session', 'expired', 'password', 'locked', 'not received', 'blank', 'loading'),
    awaiting_otp_status:   msg => has(msg, 'received', 'got', 'yes', 'came', 'arrived', 'otp'),
    awaiting_otp_alt:      msg => has(msg, 'whatsapp', 'email', 'call', 'yes', 'please', 'ok'),
    awaiting_login_result: msg => isPositive(msg) || has(msg, 'worked', 'in', 'logged', 'success', 'done', 'access'),
    closing:               () => true,
  },
  general: {
    awaiting_issue:      msg => msg.trim().length > 3,
    gathering_context:   msg => msg.trim().length > 5,
    closing:             () => true,
  },
};

// Next state mapping
const NEXT_STATE = {
  wallet_topup: {
    awaiting_ref:          { onMatch: 'awaiting_payment_mode', onNoMatch: 'awaiting_ref' },
    awaiting_payment_mode: { onMatch: 'offer_confirmation',    onNoMatch: 'awaiting_payment_mode' },
    offer_confirmation:    { onMatch: 'closing',               onNoMatch: 'closing' },
    closing:               { onMatch: 'terminal',              onNoMatch: 'terminal' },
  },
  payment_failure: {
    awaiting_app:          { onMatch: 'awaiting_error',           onNoMatch: 'awaiting_app' },
    awaiting_error:        { onMatch: 'awaiting_retry_confirm',   onNoMatch: 'awaiting_retry_result' },
    awaiting_retry_confirm: { onMatch: 'awaiting_retry_result',  onNoMatch: 'closing' },
    awaiting_retry_result: { onMatch: 'closing',                  onNoMatch: 'closing' },
    closing:               { onMatch: 'terminal',                 onNoMatch: 'terminal' },
  },
  kyc_incomplete: {
    awaiting_doc_status:   { onMatch: 'awaiting_aadhaar_check', onNoMatch: 'awaiting_doc_status' },
    awaiting_aadhaar_check: { onMatch: 'closing',               onNoMatch: 'awaiting_reupload' },
    awaiting_reupload:     { onMatch: 'closing',                 onNoMatch: 'awaiting_reupload' },
    closing:               { onMatch: 'terminal',                onNoMatch: 'terminal' },
  },
  login_issue: {
    awaiting_error_type:   { onMatch: 'awaiting_otp_status',    onNoMatch: 'awaiting_error_type' },
    awaiting_otp_status:   { onMatch: 'awaiting_login_result',  onNoMatch: 'awaiting_otp_alt' },
    awaiting_otp_alt:      { onMatch: 'awaiting_login_result',  onNoMatch: 'awaiting_login_result' },
    awaiting_login_result: { onMatch: 'closing',                onNoMatch: 'closing' },
    closing:               { onMatch: 'terminal',               onNoMatch: 'terminal' },
  },
  general: {
    awaiting_issue:    { onMatch: 'gathering_context', onNoMatch: 'awaiting_issue' },
    gathering_context: { onMatch: 'closing',           onNoMatch: 'closing' },
    closing:           { onMatch: 'terminal',          onNoMatch: 'terminal' },
  },
};

/**
 * Get the IVR-friendly initial message for an issue type.
 */
function getIVROpener(issueType, lang = 'en') {
  const messages = IVR[issueType] || IVR.general;
  return messages.initial[lang] || messages.initial.en;
}

/**
 * Process a customer voice message through the triage engine.
 * Returns { message, nextState, isTerminal }
 */
function processIVRTriageMessage(issueType, currentState, customerInput, lang = 'en') {
  if (currentState === 'terminal') {
    return {
      message: lang === 'hi'
        ? 'धन्यवाद। आपकी समस्या हल हो गई है। अलविदा।'
        : 'Thank you. Your issue has been resolved. Goodbye.',
      nextState: 'terminal',
      isTerminal: true,
    };
  }

  const detects   = FLOW_DETECTS[issueType] || FLOW_DETECTS.general;
  const nextStates = NEXT_STATE[issueType]  || NEXT_STATE.general;
  const messages  = IVR[issueType]          || IVR.general;

  const detect  = detects[currentState];
  const matched = detect ? detect(customerInput) : true;
  const outcome = matched ? 'onMatch' : 'onNoMatch';

  const nextState = (nextStates[currentState] || {})[outcome] || 'terminal';
  const isTerminal = nextState === 'terminal';

  const stateMessages = messages[currentState];
  const message = stateMessages
    ? (stateMessages[outcome]?.[lang] || stateMessages[outcome]?.en || 'Thank you for your response.')
    : 'Thank you for your response.';

  return { message, nextState, isTerminal };
}

/**
 * Get issue type string from DTMF digit.
 */
function getIssueTypeFromDigit(digit) {
  return ISSUE_TYPES[parseInt(digit)] || 'general';
}

/**
 * Get first triage state for an issue type.
 */
function getInitialTriageState(issueType) {
  return (ISSUE_STATES[issueType] || ISSUE_STATES.general)[0];
}

module.exports = {
  getIVROpener,
  processIVRTriageMessage,
  getIssueTypeFromDigit,
  getInitialTriageState,
  ISSUE_TYPES,
};
