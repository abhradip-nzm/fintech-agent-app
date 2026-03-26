/**
 * Multilingual support for the AI triage bot.
 * Supported languages: English (en), Hindi (hi), Bahasa Indonesia (id), Mandarin Chinese (zh)
 */

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English',           native: 'English',          emoji: '🇬🇧' },
  { code: 'hi', name: 'Hindi',             native: 'हिंदी',            emoji: '🇮🇳' },
  { code: 'id', name: 'Bahasa Indonesia',  native: 'Bahasa Indonesia',  emoji: '🇮🇩' },
  { code: 'zh', name: 'Mandarin Chinese',  native: '中文',              emoji: '🇨🇳' },
];

// ─── Language selection prompt ─────────────────────────────────────────────
export const LANGUAGE_SELECTION_MSG =
`Hello! / नमस्ते! / Halo! / 你好！

Please select your preferred language:
*1️⃣ English*
*2️⃣ हिंदी (Hindi)*
*3️⃣ Bahasa Indonesia*
*4️⃣ 中文 (Mandarin)*

Reply with the number (1 / 2 / 3 / 4) to continue.`;

// ─── Re-ask if language not recognised ────────────────────────────────────
export const LANG_REASK =
`Please reply with *1*, *2*, *3*, or *4* to select your language:
1️⃣ English  |  2️⃣ हिंदी  |  3️⃣ Bahasa Indonesia  |  4️⃣ 中文`;

// ─── Language confirmation ─────────────────────────────────────────────────
export const LANG_CONFIRM = {
  en: "You've selected *English*. Let me assist you now! 👋",
  hi: "आपने *हिंदी* चुनी है। मैं अभी आपकी सहायता करता/करती हूँ! 👋",
  id: "Anda telah memilih *Bahasa Indonesia*. Mari saya bantu Anda sekarang! 👋",
  zh: "您选择了*中文*。让我立即为您服务！👋",
};

// ─── Detect language from customer reply ─────────────────────────────────
export const detectLanguage = (msg) => {
  const m = msg.trim().toLowerCase();
  if (m === '1' || m.includes('english') || m.includes('eng')) return 'en';
  if (m === '2' || m.includes('hindi') || m.includes('हिंदी') || m.includes('हिन्दी') || m.includes('हां') || m === 'hi') return 'hi';
  if (m === '3' || m.includes('bahasa') || m.includes('indonesia') || m.includes('indo')) return 'id';
  if (m === '4' || m.includes('mandarin') || m.includes('chinese') || m.includes('中文') || m.includes('普通话')) return 'zh';
  return null;
};

// ─── Flow translations ────────────────────────────────────────────────────
// Structure: FLOW_TRANSLATIONS[issueType][state][matchType][langCode]
// matchType is one of: 'message' (for initial), 'onMatch', 'onNoMatch'

export const FLOW_TRANSLATIONS = {

  // ── Wallet top-up ──────────────────────────────────────────────────────
  wallet_topup: {
    initial: {
      message: {
        en: "Hello! I can see you reported a wallet top-up issue. Let me help you resolve this right away. 🙏\n\nCould you please share the *UPI Reference ID or Transaction ID* from your payment? You'll find it in:\n• Your UPI app (Google Pay / PhonePe / BHIM) → Transaction History\n• Your bank SMS alert",
        hi: "नमस्ते! मुझे पता चला है कि आपने वॉलेट टॉप-अप की समस्या रिपोर्ट की है। मैं इसे अभी हल करने में आपकी मदद करता/करती हूँ। 🙏\n\nकृपया अपने भुगतान का *UPI रेफरेंस ID या ट्रांजेक्शन ID* शेयर करें। आप इसे यहाँ पा सकते हैं:\n• आपका UPI ऐप (Google Pay / PhonePe / BHIM) → ट्रांजेक्शन हिस्ट्री\n• आपका बैंक SMS अलर्ट",
        id: "Halo! Saya melihat Anda melaporkan masalah top-up dompet. Saya akan membantu menyelesaikannya segera. 🙏\n\nBolehkah Anda berbagi *UPI Reference ID atau Transaction ID* dari pembayaran Anda? Anda dapat menemukannya di:\n• Aplikasi UPI Anda (Google Pay / PhonePe / BHIM) → Riwayat Transaksi\n• SMS notifikasi bank Anda",
        zh: "您好！我看到您报告了钱包充值问题，我来帮您立即解决。🙏\n\n请提供您付款的 *UPI参考号或交易ID*，您可以在以下位置找到：\n• 您的UPI应用（Google Pay / PhonePe / BHIM）→ 交易记录\n• 您的银行短信提醒",
      },
    },
    awaiting_ref: {
      onMatch: {
        en: "Thank you! I've located your transaction. ✅\n\nI can see the amount was received at our end but is pending in reconciliation. Could you also confirm:\n\n1️⃣ Was this paid via *UPI or Net Banking*?\n2️⃣ Which bank/app did you use?",
        hi: "धन्यवाद! मैंने आपका ट्रांजेक्शन ढूंढ लिया है। ✅\n\nमुझे दिख रहा है कि राशि हमें मिल गई है लेकिन reconciliation pending है। क्या आप यह भी बता सकते हैं:\n\n1️⃣ भुगतान *UPI या Net Banking* से किया था?\n2️⃣ किस बैंक/ऐप का उपयोग किया?",
        id: "Terima kasih! Saya telah menemukan transaksi Anda. ✅\n\nSaya melihat jumlahnya sudah diterima di pihak kami tetapi masih dalam proses rekonsiliasi. Bisa konfirmasi:\n\n1️⃣ Dibayar melalui *UPI atau Net Banking*?\n2️⃣ Bank/aplikasi apa yang Anda gunakan?",
        zh: "谢谢！我已找到您的交易记录。✅\n\n我看到金额已收到但正在对账处理中。请确认：\n\n1️⃣ 通过 *UPI 还是网络银行* 支付的？\n2️⃣ 您使用了哪个银行/应用？",
      },
      onNoMatch: {
        en: "I need the UPI Reference ID or Transaction ID to trace your payment.\n\n📌 *How to find it:*\n• *Google Pay* → Tap transaction → Note 'UPI Ref No.'\n• *PhonePe* → History → Transaction ID\n• *Bank SMS* → Look for 12-digit UTR number\n\nPlease share it here.",
        hi: "आपके भुगतान को ट्रेस करने के लिए मुझे UPI रेफरेंस ID या ट्रांजेक्शन ID चाहिए।\n\n📌 *इसे कैसे खोजें:*\n• *Google Pay* → ट्रांजेक्शन टैप करें → 'UPI Ref No.' नोट करें\n• *PhonePe* → History → Transaction ID\n• *Bank SMS* → 12 अंकों का UTR नंबर देखें\n\nकृपया यहाँ शेयर करें।",
        id: "Saya memerlukan UPI Reference ID atau Transaction ID untuk melacak pembayaran Anda.\n\n📌 *Cara menemukannya:*\n• *Google Pay* → Ketuk transaksi → Catat 'UPI Ref No.'\n• *PhonePe* → Riwayat → Transaction ID\n• *SMS Bank* → Cari nomor UTR 12 digit\n\nSilakan bagikan di sini.",
        zh: "我需要UPI参考号或交易ID来追踪您的付款。\n\n📌 *查找方法：*\n• *Google Pay* → 点击交易 → 记录'UPI Ref No.'\n• *PhonePe* → 历史记录 → 交易ID\n• *银行短信* → 查找12位UTR号码\n\n请在此分享。",
      },
    },
    awaiting_payment_mode: {
      onMatch: {
        en: "Perfect! All details confirmed. 🎉\n\n✅ *Action taken:* I've escalated this to our payments reconciliation team with HIGH priority.\n\n⏱ Expected credit time: *within 30 minutes*\n📱 You'll receive an SMS confirmation once done.\n\nWould you like me to also send a payment confirmation link on WhatsApp?",
        hi: "बिल्कुल सही! सभी विवरण कन्फर्म हो गए। 🎉\n\n✅ *की गई कार्रवाई:* मैंने इसे हमारी payments reconciliation टीम को HIGH priority के साथ escalate कर दिया है।\n\n⏱ क्रेडिट का अपेक्षित समय: *30 मिनट के भीतर*\n📱 काम पूरा होने पर आपको SMS confirmation मिलेगा।\n\nक्या आप चाहते हैं कि मैं WhatsApp पर payment confirmation link भी भेजूँ?",
        id: "Sempurna! Semua detail sudah terkonfirmasi. 🎉\n\n✅ *Tindakan yang diambil:* Saya telah mengajukan ini ke tim rekonsiliasi pembayaran kami dengan prioritas TINGGI.\n\n⏱ Waktu kredit yang diharapkan: *dalam 30 menit*\n📱 Anda akan menerima konfirmasi SMS setelah selesai.\n\nApakah Anda ingin saya mengirimkan link konfirmasi pembayaran melalui WhatsApp?",
        zh: "完美！所有详情已确认。🎉\n\n✅ *已采取行动：* 我已以高优先级将此问题升级至付款对账团队。\n\n⏱ 预计到账时间：*30分钟内*\n📱 完成后您将收到短信确认。\n\n您是否希望我也通过WhatsApp发送付款确认链接？",
      },
      onNoMatch: {
        en: "Thanks! Just one more detail — which payment method did you use?\n• UPI (Google Pay, PhonePe, BHIM)\n• Net Banking\n• Debit Card\n\nThis helps us route your case to the right team.",
        hi: "धन्यवाद! बस एक और विवरण — आपने किस payment method का उपयोग किया?\n• UPI (Google Pay, PhonePe, BHIM)\n• Net Banking\n• Debit Card\n\nइससे हमें आपका केस सही टीम तक पहुँचाने में मदद मिलती है।",
        id: "Terima kasih! Satu detail lagi — metode pembayaran apa yang Anda gunakan?\n• UPI (Google Pay, PhonePe, BHIM)\n• Net Banking\n• Kartu Debit\n\nIni membantu kami mengarahkan kasus Anda ke tim yang tepat.",
        zh: "谢谢！再确认一点 — 您使用了哪种付款方式？\n• UPI（Google Pay、PhonePe、BHIM）\n• 网络银行\n• 借记卡\n\n这有助于我们将您的案例转交给正确的团队。",
      },
    },
    offer_confirmation: {
      onMatch: {
        en: "✅ Confirmation link sent to your registered number!\n\n*Summary of resolution:*\n• Transaction traced & flagged for priority credit\n• Reconciliation team notified\n• You'll get SMS + WhatsApp update in 30 min\n\nIs there anything else I can help you with today?",
        hi: "✅ आपके registered number पर confirmation link भेज दिया गया है!\n\n*समाधान का सारांश:*\n• ट्रांजेक्शन ट्रेस किया और priority credit के लिए flag किया\n• Reconciliation टीम को सूचित किया\n• 30 मिनट में SMS + WhatsApp update मिलेगा\n\nक्या आज मैं आपकी और कोई सहायता कर सकता/सकती हूँ?",
        id: "✅ Link konfirmasi telah dikirim ke nomor terdaftar Anda!\n\n*Ringkasan penyelesaian:*\n• Transaksi dilacak & ditandai untuk kredit prioritas\n• Tim rekonsiliasi diberitahu\n• Anda akan mendapat pembaruan SMS + WhatsApp dalam 30 menit\n\nApakah ada hal lain yang bisa saya bantu hari ini?",
        zh: "✅ 确认链接已发送至您的注册号码！\n\n*解决摘要：*\n• 交易已追踪并标记为优先到账\n• 已通知对账团队\n• 30分钟内您将收到短信 + WhatsApp更新\n\n今天还有什么我可以帮助您的吗？",
      },
      onNoMatch: {
        en: "No problem! Your case has been escalated with the highest priority. Please expect your wallet credit within 30 minutes.\n\nIs there anything else I can help you with?",
        hi: "कोई बात नहीं! आपका केस सर्वोच्च प्राथमिकता के साथ escalate कर दिया गया है। कृपया 30 मिनट के भीतर वॉलेट क्रेडिट की उम्मीद करें।\n\nक्या मैं आपकी और कोई सहायता कर सकता/सकती हूँ?",
        id: "Tidak masalah! Kasus Anda telah dieskalasi dengan prioritas tertinggi. Mohon tunggu kredit dompet dalam 30 menit.\n\nApakah ada yang bisa saya bantu lagi?",
        zh: "没问题！您的案例已以最高优先级升级。请在30分钟内等待钱包到账。\n\n还有什么我可以帮助您的吗？",
      },
    },
    closing: {
      onMatch: {
        en: "You're welcome! 😊 I've noted your issue as resolved pending credit confirmation.\n\nFeel free to reach out anytime. Have a great day!",
        hi: "आपका स्वागत है! 😊 मैंने आपकी समस्या को credit confirmation pending के साथ resolved नोट कर दिया है।\n\nकभी भी संपर्क करें। आपका दिन शुभ हो!",
        id: "Sama-sama! 😊 Saya telah mencatat masalah Anda sebagai terselesaikan sambil menunggu konfirmasi kredit.\n\nJangan ragu menghubungi kami kapan saja. Semoga hari Anda menyenangkan!",
        zh: "不客气！😊 我已将您的问题记录为等待到账确认的已解决状态。\n\n随时联系我们。祝您今天愉快！",
      },
      onNoMatch: {
        en: "Feel free to reach out if you need anything else. Have a great day! 😊",
        hi: "अगर आपको और कुछ चाहिए तो बेझिझक संपर्क करें। आपका दिन शुभ हो! 😊",
        id: "Jangan ragu menghubungi kami jika Anda membutuhkan sesuatu. Semoga hari Anda menyenangkan! 😊",
        zh: "如需任何帮助请随时联系我们。祝您今天愉快！😊",
      },
    },
  },

  // ── Payment failure ────────────────────────────────────────────────────
  payment_failure: {
    initial: {
      message: {
        en: "I can see your payment was declined. Let me investigate and resolve this immediately.\n\nTo start, which *UPI app or payment method* were you using?\n(Google Pay / PhonePe / BHIM / Net Banking / Debit Card)",
        hi: "मुझे पता चला है कि आपका भुगतान decline हो गया। मैं इसकी तुरंत जाँच करके हल करता/करती हूँ।\n\nशुरुआत के लिए, आप कौन सा *UPI ऐप या payment method* उपयोग कर रहे थे?\n(Google Pay / PhonePe / BHIM / Net Banking / Debit Card)",
        id: "Saya melihat pembayaran Anda ditolak. Saya akan menyelidiki dan menyelesaikannya segera.\n\nUntuk memulai, *aplikasi UPI atau metode pembayaran* apa yang Anda gunakan?\n(Google Pay / PhonePe / BHIM / Net Banking / Kartu Debit)",
        zh: "我看到您的付款被拒绝了，我来立即调查并解决。\n\n首先，您使用的是哪个 *UPI应用或付款方式*？\n（Google Pay / PhonePe / BHIM / 网络银行 / 借记卡）",
      },
    },
    awaiting_app: {
      onMatch: {
        en: "Got it! Now, what *error message* did you see?\n\n• 'Transaction Limit Exceeded'\n• 'Insufficient Funds'\n• 'Bank Server Error / PSP Declined'\n• 'Wrong UPI PIN'\n• Something else?",
        hi: "समझ गया! अब, आपने कौन सा *error message* देखा?\n\n• 'Transaction Limit Exceeded'\n• 'Insufficient Funds'\n• 'Bank Server Error / PSP Declined'\n• 'Wrong UPI PIN'\n• कुछ और?",
        id: "Mengerti! Sekarang, *pesan kesalahan* apa yang Anda lihat?\n\n• 'Transaction Limit Exceeded'\n• 'Insufficient Funds'\n• 'Bank Server Error / PSP Declined'\n• 'Wrong UPI PIN'\n• Yang lainnya?",
        zh: "明白了！您看到了什么 *错误消息*？\n\n• '超出交易限额'\n• '余额不足'\n• '银行服务器错误 / PSP拒绝'\n• 'UPI PIN错误'\n• 其他情况？",
      },
      onNoMatch: {
        en: "Could you let me know the payment method? This helps me check the right system.\n\n• Google Pay / PhonePe / BHIM / Paytm\n• Net Banking\n• Debit / Credit Card\n• Any other UPI app",
        hi: "क्या आप payment method बता सकते हैं? इससे मुझे सही सिस्टम जाँचने में मदद मिलती है।\n\n• Google Pay / PhonePe / BHIM / Paytm\n• Net Banking\n• Debit / Credit Card\n• कोई अन्य UPI ऐप",
        id: "Bisakah Anda memberi tahu metode pembayarannya? Ini membantu saya memeriksa sistem yang tepat.\n\n• Google Pay / PhonePe / BHIM / Paytm\n• Net Banking\n• Kartu Debit / Kredit\n• Aplikasi UPI lainnya",
        zh: "您能告诉我付款方式吗？这有助于我检查正确的系统。\n\n• Google Pay / PhonePe / BHIM / Paytm\n• 网络银行\n• 借记卡 / 信用卡\n• 其他UPI应用",
      },
    },
    awaiting_error: {
      onMatch: {
        en: "Understood. Based on this error, here's what I've done:\n\n✅ *Immediate Actions:*\n• Daily UPI limit temporarily lifted for 1 hour\n• Transaction lock cleared from your account\n• Merchant reference preserved for retry\n\n⚡ Please retry the payment now — it should go through. Should I stay on the line while you try?",
        hi: "समझ गया। इस error के आधार पर, मैंने यह किया है:\n\n✅ *तत्काल कार्रवाई:*\n• Daily UPI limit 1 घंटे के लिए अस्थायी रूप से हटाई गई\n• आपके account से transaction lock हटाया गया\n• Retry के लिए merchant reference सुरक्षित किया\n\n⚡ कृपया अभी payment retry करें — यह हो जानी चाहिए। क्या मैं आपके try करने तक लाइन पर रहूँ?",
        id: "Mengerti. Berdasarkan kesalahan ini, inilah yang telah saya lakukan:\n\n✅ *Tindakan Segera:*\n• Batas UPI harian sementara diangkat selama 1 jam\n• Kunci transaksi dihapus dari akun Anda\n• Referensi pedagang disimpan untuk percobaan ulang\n\n⚡ Silakan coba ulang pembayaran sekarang — seharusnya berhasil. Apakah saya tetap di sini selagi Anda mencoba?",
        zh: "明白了。根据此错误，我已采取以下措施：\n\n✅ *立即行动：*\n• 每日UPI限额暂时解除1小时\n• 账户交易锁定已清除\n• 商户参考已保留以供重试\n\n⚡ 请现在重新付款 — 应该可以成功。您尝试时我可以在线等候吗？",
      },
      onNoMatch: {
        en: "I've checked your account. The most likely cause is a temporary bank-side restriction.\n\n✅ I've cleared the transaction block. Please try these steps:\n1. Force-close your UPI app and reopen\n2. Wait 2 minutes\n3. Retry the payment\n\nDid the retry work?",
        hi: "मैंने आपका account जाँचा। सबसे संभावित कारण bank-side की temporary restriction है।\n\n✅ मैंने transaction block हटा दिया है। कृपया ये steps try करें:\n1. अपना UPI ऐप force-close करके फिर खोलें\n2. 2 मिनट प्रतीक्षा करें\n3. Payment retry करें\n\nक्या retry काम किया?",
        id: "Saya telah memeriksa akun Anda. Penyebab yang paling mungkin adalah pembatasan sementara dari bank.\n\n✅ Saya telah menghapus blokir transaksi. Silakan coba langkah-langkah ini:\n1. Paksa tutup aplikasi UPI dan buka kembali\n2. Tunggu 2 menit\n3. Coba ulang pembayaran\n\nApakah percobaan ulang berhasil?",
        zh: "我已检查您的账户。最可能的原因是银行端的临时限制。\n\n✅ 我已清除交易锁定。请按以下步骤操作：\n1. 强制关闭UPI应用并重新打开\n2. 等待2分钟\n3. 重试付款\n\n重试成功了吗？",
      },
    },
    awaiting_retry_confirm: {
      onMatch: {
        en: "Great! I'm monitoring your account in real-time.\n\n*After retrying, please let me know:*\n• ✅ 'It worked!' — I'll close the case\n• ❌ 'Still failing' — I'll escalate to senior team\n\nTake your time. 👍",
        hi: "बढ़िया! मैं आपका account real-time में monitor कर रहा/रही हूँ।\n\n*Retry करने के बाद, कृपया बताएं:*\n• ✅ 'काम कर गया!' — मैं केस close कर दूँगा/दूँगी\n• ❌ 'अभी भी नहीं हो रहा' — मैं senior team को escalate करूँगा/करूँगी\n\nसमय लें। 👍",
        id: "Bagus! Saya memantau akun Anda secara real-time.\n\n*Setelah mencoba ulang, beri tahu saya:*\n• ✅ 'Berhasil!' — Saya akan menutup kasus\n• ❌ 'Masih gagal' — Saya akan eskalasi ke tim senior\n\nSilakan dicoba. 👍",
        zh: "好的！我正在实时监控您的账户。\n\n*重试后请告诉我：*\n• ✅ '成功了！' — 我将关闭案例\n• ❌ '还是失败' — 我将升级到高级团队\n\n请慢慢来。👍",
      },
      onNoMatch: {
        en: "No worries! I've escalated your case to our senior payments team. They'll review and call you within 30 minutes.\n\nIs there anything else I can help with?",
        hi: "चिंता न करें! मैंने आपका केस हमारी senior payments team को escalate कर दिया है। वे 30 मिनट के भीतर review करके call करेंगे।\n\nक्या मैं और कोई सहायता कर सकता/सकती हूँ?",
        id: "Tidak masalah! Saya telah mengajukan kasus Anda ke tim pembayaran senior kami. Mereka akan meninjau dan menghubungi Anda dalam 30 menit.\n\nApakah ada yang bisa saya bantu lagi?",
        zh: "没关系！我已将您的案例升级至我们的高级付款团队。他们将在30分钟内审查并致电您。\n\n还有什么我可以帮助您的吗？",
      },
    },
    awaiting_retry_result: {
      onMatch: {
        en: "Excellent! 🎉 Glad the payment went through!\n\nI've updated your case as *Resolved*. A summary has been sent to your registered email.\n\nIs there anything else I can help with today?",
        hi: "बहुत बढ़िया! 🎉 खुशी है कि payment हो गई!\n\nमैंने आपका केस *Resolved* के रूप में update कर दिया है। आपके registered email पर summary भेज दी गई है।\n\nक्या आज मैं और कोई सहायता कर सकता/सकती हूँ?",
        id: "Luar biasa! 🎉 Senang pembayaran berhasil!\n\nSaya telah memperbarui kasus Anda sebagai *Terselesaikan*. Ringkasan telah dikirimkan ke email terdaftar Anda.\n\nApakah ada yang bisa saya bantu hari ini?",
        zh: "太好了！🎉 付款成功了！\n\n我已将您的案例更新为*已解决*。摘要已发送至您的注册邮箱。\n\n今天还有什么我可以帮助您的吗？",
      },
      onNoMatch: {
        en: "I'm sorry the issue persists! 🚨 I've immediately escalated this to our *Level 2 Payments Team* with the highest priority.\n\n📞 *Expected callback:* within 20 minutes\n📧 Reference ID generated: #PAY-{timestamp}\n\nYou're in safe hands. Anything else I can note?",
        hi: "मुझे खेद है कि समस्या अभी भी है! 🚨 मैंने इसे तुरंत सर्वोच्च प्राथमिकता के साथ हमारी *Level 2 Payments Team* को escalate कर दिया है।\n\n📞 *अपेक्षित callback:* 20 मिनट के भीतर\n📧 Reference ID जनरेट हुई: #PAY-{timestamp}\n\nआप सुरक्षित हाथों में हैं। क्या कुछ और note करना है?",
        id: "Maaf masalahnya masih berlanjut! 🚨 Saya langsung mengajukan ini ke *Tim Pembayaran Level 2* kami dengan prioritas tertinggi.\n\n📞 *Panggilan balik yang diharapkan:* dalam 20 menit\n📧 ID referensi dibuat: #PAY-{timestamp}\n\nAnda dalam tangan yang aman. Ada hal lain yang perlu saya catat?",
        zh: "很抱歉问题仍然存在！🚨 我已立即以最高优先级将此问题升级至我们的*二级付款团队*。\n\n📞 *预计回电时间：* 20分钟内\n📧 已生成参考ID：#PAY-{timestamp}\n\n您在安全的手中。还有什么需要我记录的吗？",
      },
    },
    closing: {
      onMatch: {
        en: "Thank you for your patience! 😊 Your case is being handled. Feel free to reach out anytime.",
        hi: "आपके धैर्य के लिए धन्यवाद! 😊 आपका केस handle किया जा रहा है। कभी भी संपर्क करें।",
        id: "Terima kasih atas kesabaran Anda! 😊 Kasus Anda sedang ditangani. Jangan ragu menghubungi kapan saja.",
        zh: "感谢您的耐心！😊 您的案例正在处理中。随时联系我们。",
      },
      onNoMatch: {
        en: "Thank you for your patience! 😊 Feel free to reach out if you need anything else. Have a great day!",
        hi: "आपके धैर्य के लिए धन्यवाद! 😊 अगर कुछ और चाहिए तो बेझिझक संपर्क करें। आपका दिन शुभ हो!",
        id: "Terima kasih atas kesabaran Anda! 😊 Jangan ragu menghubungi jika Anda membutuhkan sesuatu. Semoga hari Anda menyenangkan!",
        zh: "感谢您的耐心！😊 如有需要请随时联系我们。祝您今天愉快！",
      },
    },
  },

  // ── KYC incomplete ────────────────────────────────────────────────────
  kyc_incomplete: {
    initial: {
      message: {
        en: "I see your KYC verification is pending. This is important for unlocking your full account benefits! Let me guide you through it. 🆔\n\nHave you already submitted your documents (Aadhaar / PAN card)?",
        hi: "मुझे दिख रहा है कि आपका KYC verification pending है। यह आपके पूरे account के फायदे unlocking के लिए ज़रूरी है! मैं आपको इसमें guide करता/करती हूँ। 🆔\n\nक्या आपने पहले से documents submit किए हैं (Aadhaar / PAN card)?",
        id: "Saya melihat verifikasi KYC Anda masih tertunda. Ini penting untuk membuka manfaat akun penuh Anda! Biarkan saya membimbing Anda. 🆔\n\nApakah Anda sudah menyerahkan dokumen Anda (Aadhaar / KTP / PAN card)?",
        zh: "我看到您的KYC验证正在等待中。这对于解锁您的完整账户权益非常重要！让我引导您完成。🆔\n\n您是否已提交了您的证件（Aadhaar / PAN卡）？",
      },
    },
    awaiting_doc_status: {
      onMatch: {
        en: "Great! Let me check the status of your submission.\n\n🔍 *Checking...*\n\nI can see your documents were received. The Aadhaar verification step is pending.\n\nCould you confirm:\n1. Is the *name on your Aadhaar* exactly the same as your account registration name?\n2. Is the *photo on your Aadhaar* clear and visible?",
        hi: "बढ़िया! मैं आपकी submission का status जाँचता/जाँचती हूँ।\n\n🔍 *जाँच रहा/रही हूँ...*\n\nमुझे दिख रहा है कि आपके documents मिल गए हैं। Aadhaar verification step pending है।\n\nक्या आप confirm कर सकते हैं:\n1. क्या *आपके Aadhaar पर नाम* आपके account registration नाम से बिल्कुल मेल खाता है?\n2. क्या *आपके Aadhaar पर फ़ोटो* साफ़ और दिखाई दे रही है?",
        id: "Bagus! Biarkan saya memeriksa status pengajuan Anda.\n\n🔍 *Memeriksa...*\n\nSaya melihat dokumen Anda sudah diterima. Langkah verifikasi Aadhaar masih tertunda.\n\nBisakah Anda konfirmasi:\n1. Apakah *nama di Aadhaar Anda* sama persis dengan nama pendaftaran akun?\n2. Apakah *foto di Aadhaar Anda* jelas dan terlihat?",
        zh: "好的！让我检查您提交的状态。\n\n🔍 *检查中...*\n\n我看到您的证件已收到，但Aadhaar验证步骤正在等待中。\n\n请确认：\n1. *您Aadhaar上的姓名* 是否与账户注册姓名完全一致？\n2. *您Aadhaar上的照片* 是否清晰可见？",
      },
      onNoMatch: {
        en: "No worries! Let me guide you step by step.\n\n📋 *Documents needed:*\n1. *Aadhaar Card* (front + back photo)\n2. *PAN Card* (front photo)\n3. *Selfie* (clear, well-lit, no glasses)\n\nYou can upload them in the app: Settings → KYC Verification → Upload Documents\n\nHave you done this step?",
        hi: "कोई बात नहीं! मैं आपको step-by-step guide करता/करती हूँ।\n\n📋 *ज़रूरी documents:*\n1. *Aadhaar Card* (आगे + पीछे की फ़ोटो)\n2. *PAN Card* (आगे की फ़ोटो)\n3. *Selfie* (साफ़, अच्छी रोशनी में, बिना चश्मे के)\n\nआप इन्हें ऐप में upload कर सकते हैं: Settings → KYC Verification → Upload Documents\n\nक्या आपने यह step कर लिया है?",
        id: "Tidak masalah! Biarkan saya membimbing Anda selangkah demi selangkah.\n\n📋 *Dokumen yang diperlukan:*\n1. *Kartu Aadhaar* (foto depan + belakang)\n2. *Kartu PAN* (foto depan)\n3. *Selfie* (jelas, pencahayaan baik, tanpa kacamata)\n\nAnda dapat mengunggahnya di aplikasi: Pengaturan → Verifikasi KYC → Unggah Dokumen\n\nApakah Anda sudah melakukan langkah ini?",
        zh: "没关系！让我一步一步引导您。\n\n📋 *所需证件：*\n1. *Aadhaar卡*（正面 + 背面照片）\n2. *PAN卡*（正面照片）\n3. *自拍*（清晰、光线充足、不戴眼镜）\n\n您可以在应用中上传：设置 → KYC验证 → 上传证件\n\n您是否已完成此步骤？",
      },
    },
    awaiting_aadhaar_check: {
      onMatch: {
        en: "Perfect! Everything looks good on your end. ✅\n\nI've flagged your KYC for *manual review by our compliance team*. This typically takes 2-4 hours.\n\n🔔 You'll receive an SMS + App notification once verified.\n\n*Benefits unlocked after KYC:*\n• Higher transaction limits\n• International transfers\n• Premium account features\n\nAnything else I can help with?",
        hi: "बिल्कुल सही! आपकी तरफ से सब ठीक दिख रहा है। ✅\n\nमैंने आपका KYC हमारी *compliance team द्वारा manual review* के लिए flag कर दिया है। इसमें आमतौर पर 2-4 घंटे लगते हैं।\n\n🔔 verify होने पर आपको SMS + App notification मिलेगा।\n\n*KYC के बाद unlock होने वाले फायदे:*\n• अधिक transaction limits\n• International transfers\n• Premium account features\n\nक्या मैं और कोई सहायता कर सकता/सकती हूँ?",
        id: "Sempurna! Semuanya terlihat baik dari pihak Anda. ✅\n\nSaya telah menandai KYC Anda untuk *tinjauan manual oleh tim kepatuhan kami*. Ini biasanya memakan waktu 2-4 jam.\n\n🔔 Anda akan menerima notifikasi SMS + Aplikasi setelah diverifikasi.\n\n*Manfaat yang dibuka setelah KYC:*\n• Batas transaksi lebih tinggi\n• Transfer internasional\n• Fitur akun premium\n\nAda yang lain yang bisa saya bantu?",
        zh: "完美！您这边一切正常。✅\n\n我已将您的KYC标记为*由合规团队手动审核*。这通常需要2-4小时。\n\n🔔 验证后您将收到短信 + 应用通知。\n\n*KYC后解锁的权益：*\n• 更高的交易限额\n• 国际转账\n• 高级账户功能\n\n还有什么我可以帮助您的吗？",
      },
      onNoMatch: {
        en: "That might be causing the delay. A mismatch in name or unclear photo is the most common reason KYC fails.\n\n✅ *Quick fixes:*\n• Re-upload your Aadhaar with better lighting\n• Ensure the name matches exactly (no abbreviations)\n• Make sure both sides of Aadhaar are uploaded\n\nOnce re-uploaded, I'll manually expedite your verification. Can you try re-uploading now?",
        hi: "यही देरी का कारण हो सकता है। नाम में मेल न खाना या अस्पष्ट फ़ोटो KYC fail होने का सबसे आम कारण है।\n\n✅ *त्वरित समाधान:*\n• बेहतर रोशनी में अपना Aadhaar फिर से upload करें\n• सुनिश्चित करें कि नाम बिल्कुल मेल खाता है (कोई abbreviation नहीं)\n• Aadhaar के दोनों तरफ upload हों\n\nFiर से upload करने के बाद, मैं आपकी verification को manually expedite करूँगा/करूँगी। क्या आप अभी फिर से upload कर सकते हैं?",
        id: "Itu mungkin menyebabkan penundaan. Ketidaksesuaian nama atau foto yang tidak jelas adalah alasan paling umum KYC gagal.\n\n✅ *Perbaikan cepat:*\n• Unggah ulang Aadhaar Anda dengan pencahayaan yang lebih baik\n• Pastikan nama sama persis (tanpa singkatan)\n• Pastikan kedua sisi Aadhaar diunggah\n\nSetelah diunggah ulang, saya akan mempercepat verifikasi Anda secara manual. Bisakah Anda mencoba mengunggah ulang sekarang?",
        zh: "这可能是造成延误的原因。姓名不匹配或照片不清晰是KYC失败最常见的原因。\n\n✅ *快速解决方法：*\n• 在更好的光线下重新上传Aadhaar\n• 确保姓名完全匹配（不要缩写）\n• 确保Aadhaar正反两面都已上传\n\n重新上传后，我将手动加急处理您的验证。您现在可以尝试重新上传吗？",
      },
    },
    awaiting_reupload: {
      onMatch: {
        en: "✅ New documents received! I've marked your KYC for *priority review*.\n\nExpected completion: *within 2 hours*\n\nYou'll get an SMS once your KYC is approved. Is there anything else I can help with?",
        hi: "✅ नए documents मिल गए! मैंने आपका KYC *priority review* के लिए mark कर दिया है।\n\nअपेक्षित completion: *2 घंटे के भीतर*\n\nKYC approve होने पर आपको SMS मिलेगा। क्या मैं और कोई सहायता कर सकता/सकती हूँ?",
        id: "✅ Dokumen baru diterima! Saya telah menandai KYC Anda untuk *tinjauan prioritas*.\n\nPerkiraan penyelesaian: *dalam 2 jam*\n\nAnda akan mendapat SMS setelah KYC Anda disetujui. Ada yang bisa saya bantu lagi?",
        zh: "✅ 新证件已收到！我已将您的KYC标记为*优先审核*。\n\n预计完成时间：*2小时内*\n\nKYC批准后您将收到短信。还有什么我可以帮助您的吗？",
      },
      onNoMatch: {
        en: "Take your time! Whenever you've re-uploaded the documents, just let me know and I'll expedite the review.\n\nAny other questions in the meantime?",
        hi: "समय लें! जब भी documents फिर से upload कर लें, बस मुझे बताएं और मैं review को expedite करूँगा/करूँगी।\n\nइस बीच कोई और सवाल?",
        id: "Silakan luangkan waktu! Kapan pun Anda sudah mengunggah ulang dokumen, beri tahu saya dan saya akan mempercepat tinjauan.\n\nAda pertanyaan lain sementara itu?",
        zh: "慢慢来！无论何时重新上传了证件，请告诉我，我将加快审核。\n\n在此期间还有其他问题吗？",
      },
    },
    closing: {
      onMatch: {
        en: "You're welcome! 😊 Your KYC verification is in progress. Have a great day!",
        hi: "आपका स्वागत है! 😊 आपका KYC verification progress में है। आपका दिन शुभ हो!",
        id: "Sama-sama! 😊 Verifikasi KYC Anda sedang diproses. Semoga hari Anda menyenangkan!",
        zh: "不客气！😊 您的KYC验证正在进行中。祝您今天愉快！",
      },
      onNoMatch: {
        en: "Happy to help! Feel free to reach out anytime. Have a wonderful day! 😊",
        hi: "मदद करके खुशी हुई! कभी भी संपर्क करें। आपका दिन अच्छा हो! 😊",
        id: "Senang membantu! Jangan ragu menghubungi kapan saja. Semoga hari Anda menyenangkan! 😊",
        zh: "很乐意帮助！随时联系我们。祝您有美好的一天！😊",
      },
    },
  },

  // ── Login issue ───────────────────────────────────────────────────────
  login_issue: {
    initial: {
      message: {
        en: "I see you're having trouble logging in. Let me help you regain access right away! 🔑\n\nWhat exactly happens when you try to log in?\n\n• OTP not received\n• OTP received but shows 'Invalid'\n• App crashes after OTP\n• Fingerprint / Face ID not working\n• Something else?",
        hi: "मुझे पता चला है कि आपको login में परेशानी हो रही है। मैं आपको तुरंत access वापस दिलाने में मदद करता/करती हूँ! 🔑\n\nLogin करने पर क्या हो रहा है?\n\n• OTP नहीं मिल रहा\n• OTP मिला लेकिन 'Invalid' दिखा रहा है\n• OTP के बाद ऐप crash हो जाता है\n• Fingerprint / Face ID काम नहीं कर रहा\n• कुछ और?",
        id: "Saya melihat Anda mengalami masalah saat masuk. Biarkan saya membantu Anda mendapatkan akses kembali segera! 🔑\n\nApa yang terjadi saat Anda mencoba masuk?\n\n• OTP tidak diterima\n• OTP diterima tetapi menampilkan 'Tidak Valid'\n• Aplikasi crash setelah OTP\n• Sidik jari / Face ID tidak berfungsi\n• Yang lainnya?",
        zh: "我看到您在登录时遇到了问题，让我帮您立即恢复访问！🔑\n\n您尝试登录时发生了什么？\n\n• 收不到OTP验证码\n• 收到OTP但显示'无效'\n• OTP后应用崩溃\n• 指纹 / 面部识别不工作\n• 其他情况？",
      },
    },
    awaiting_error_type: {
      onMatch: {
        en: "Got it! Here's what I'm doing to fix this:\n\n✅ *Immediate Actions:*\n• Cleared your active sessions\n• Reset the OTP cooldown timer\n• Verified your registered number: {phone}\n\n*Please follow these steps now:*\n1. Close the app completely\n2. Ensure your phone time is set to *Automatic*\n3. Open the app and request a fresh OTP\n\nDid you receive the new OTP?",
        hi: "समझ गया! मैं इसे ठीक करने के लिए यह कर रहा/रही हूँ:\n\n✅ *तत्काल कार्रवाई:*\n• आपके active sessions साफ़ किए\n• OTP cooldown timer reset किया\n• आपका registered number verify किया: {phone}\n\n*अभी ये steps follow करें:*\n1. ऐप पूरी तरह बंद करें\n2. सुनिश्चित करें कि आपके फ़ोन का समय *Automatic* पर सेट है\n3. ऐप खोलें और fresh OTP request करें\n\nक्या आपको नया OTP मिला?",
        id: "Mengerti! Inilah yang saya lakukan untuk memperbaikinya:\n\n✅ *Tindakan Segera:*\n• Sesi aktif Anda dihapus\n• Timer cooldown OTP direset\n• Nomor terdaftar Anda diverifikasi: {phone}\n\n*Silakan ikuti langkah-langkah ini sekarang:*\n1. Tutup aplikasi sepenuhnya\n2. Pastikan waktu ponsel Anda diatur ke *Otomatis*\n3. Buka aplikasi dan minta OTP baru\n\nApakah Anda menerima OTP baru?",
        zh: "明白了！我正在采取以下措施来解决此问题：\n\n✅ *立即行动：*\n• 已清除您的活动会话\n• 已重置OTP冷却计时器\n• 已验证您的注册号码：{phone}\n\n*请立即按以下步骤操作：*\n1. 完全关闭应用\n2. 确保手机时间设置为*自动*\n3. 打开应用并请求新OTP\n\n您收到新的OTP了吗？",
      },
      onNoMatch: {
        en: "I'd like to understand the exact error to give you the right fix.\n\nCould you describe what you see on screen? For example:\n• Is there an error message? What does it say?\n• Does the OTP arrive but fail?\n• Does the app just show a loading screen?",
        hi: "मैं सही समाधान देने के लिए exact error समझना चाहता/चाहती हूँ।\n\nक्या आप screen पर जो दिख रहा है वह describe कर सकते हैं? उदाहरण के लिए:\n• क्या कोई error message है? उसमें क्या लिखा है?\n• OTP आता है लेकिन fail होता है?\n• ऐप सिर्फ loading screen दिखाता है?",
        id: "Saya ingin memahami kesalahan yang tepat untuk memberikan perbaikan yang benar.\n\nBisakah Anda mendeskripsikan apa yang Anda lihat di layar? Misalnya:\n• Apakah ada pesan kesalahan? Apa yang tertulis?\n• Apakah OTP datang tetapi gagal?\n• Apakah aplikasi hanya menampilkan layar loading?",
        zh: "我需要了解确切的错误才能给您正确的解决方案。\n\n您能描述一下屏幕上显示的内容吗？例如：\n• 有没有错误消息？说了什么？\n• OTP收到了但验证失败？\n• 应用只显示加载界面？",
      },
    },
    awaiting_otp_status: {
      onMatch: {
        en: "Great! Please enter the OTP within 60 seconds — I've extended your session window.\n\n*If it fails again, try:*\n• Use the 'Resend via Call' option\n• Clear app cache: Settings → Apps → FinAgent → Clear Cache\n\nDid login work?",
        hi: "बढ़िया! कृपया 60 सेकंड के भीतर OTP दर्ज करें — मैंने आपका session window बढ़ा दिया है।\n\n*अगर फिर से fail हो, तो try करें:*\n• 'Resend via Call' option का उपयोग करें\n• App cache clear करें: Settings → Apps → FinAgent → Clear Cache\n\nक्या login काम किया?",
        id: "Bagus! Silakan masukkan OTP dalam 60 detik — saya telah memperpanjang jendela sesi Anda.\n\n*Jika gagal lagi, coba:*\n• Gunakan opsi 'Kirim Ulang via Telepon'\n• Hapus cache aplikasi: Pengaturan → Aplikasi → FinAgent → Hapus Cache\n\nApakah login berhasil?",
        zh: "好！请在60秒内输入OTP — 我已延长了您的会话窗口。\n\n*如果再次失败，请尝试：*\n• 使用'通过电话重新发送'选项\n• 清除应用缓存：设置 → 应用 → FinAgent → 清除缓存\n\n登录成功了吗？",
      },
      onNoMatch: {
        en: "OTP not received? Let me check...\n\n🔍 Your registered number on file: {phone}\n\n*Possible reasons:*\n• Network congestion (try after 2 min)\n• DND (Do Not Disturb) enabled on your number\n• SIM in slot 2 (OTPs may go to slot 1)\n\nI can also send the OTP via *WhatsApp* or *email*. Which would you prefer?",
        hi: "OTP नहीं मिला? मैं जाँचता/जाँचती हूँ...\n\n🔍 आपका registered number: {phone}\n\n*संभावित कारण:*\n• Network congestion (2 मिनट बाद try करें)\n• आपके number पर DND (Do Not Disturb) चालू है\n• SIM slot 2 में है (OTP slot 1 पर जा सकते हैं)\n\nमैं OTP *WhatsApp* या *email* से भी भेज सकता/सकती हूँ। आप क्या prefer करेंगे?",
        id: "OTP tidak diterima? Biarkan saya periksa...\n\n🔍 Nomor terdaftar Anda: {phone}\n\n*Kemungkinan penyebab:*\n• Kemacetan jaringan (coba setelah 2 menit)\n• DND (Jangan Ganggu) diaktifkan pada nomor Anda\n• SIM di slot 2 (OTP mungkin masuk ke slot 1)\n\nSaya juga bisa mengirim OTP melalui *WhatsApp* atau *email*. Mana yang Anda pilih?",
        zh: "没收到OTP？让我检查一下...\n\n🔍 您的注册号码：{phone}\n\n*可能原因：*\n• 网络拥堵（2分钟后重试）\n• 您的号码已启用免打扰（DND）\n• SIM卡在卡槽2（OTP可能发送到卡槽1）\n\n我也可以通过 *WhatsApp* 或 *邮件* 发送OTP。您希望哪种方式？",
      },
    },
    awaiting_otp_alt: {
      onMatch: {
        en: "✅ Alternative OTP sent! Please check your WhatsApp / email now.\n\nOnce you log in successfully, let me know. I'll note that SMS delivery has an issue on your number and flag it for network team review.",
        hi: "✅ Alternative OTP भेज दिया गया है! कृपया अभी अपना WhatsApp / email चेक करें।\n\nSuccessfully login करने के बाद मुझे बताएं। मैं note करूँगा/करूँगी कि आपके number पर SMS delivery में problem है और इसे network team review के लिए flag करूँगा/करूँगी।",
        id: "✅ OTP alternatif terkirim! Silakan periksa WhatsApp / email Anda sekarang.\n\nSetelah berhasil masuk, beri tahu saya. Saya akan mencatat bahwa pengiriman SMS memiliki masalah pada nomor Anda dan menandainya untuk ditinjau tim jaringan.",
        zh: "✅ 备用OTP已发送！请立即检查您的WhatsApp / 邮箱。\n\n成功登录后请告诉我。我将记录您的号码存在短信发送问题，并将其标记给网络团队审查。",
      },
      onNoMatch: {
        en: "Let me try another approach. I'm generating a *secure login link* and sending it to your registered email. Please check your inbox and click the link to access your account.\n\nIs there anything else I can try to help?",
        hi: "मैं एक और तरीका try करता/करती हूँ। मैं एक *secure login link* generate कर रहा/रही हूँ और आपके registered email पर भेज रहा/रही हूँ। कृपया अपना inbox check करें और अपने account तक पहुँचने के लिए link पर click करें।\n\nक्या और कोई तरीका try करूँ?",
        id: "Biarkan saya mencoba pendekatan lain. Saya sedang membuat *link login aman* dan mengirimkannya ke email terdaftar Anda. Silakan periksa kotak masuk Anda dan klik link untuk mengakses akun Anda.\n\nAda hal lain yang bisa saya coba untuk membantu?",
        zh: "让我尝试另一种方法。我正在生成一个*安全登录链接*并发送到您的注册邮箱。请检查收件箱并点击链接访问您的账户。\n\n还有什么我可以尝试帮助您的吗？",
      },
    },
    awaiting_login_result: {
      onMatch: {
        en: "Wonderful! 🎉 Glad you're back in!\n\nI've made a note to monitor your account for any further login anomalies for the next 24 hours.\n\n*Tip:* Enable *Biometric Login* in Settings for faster access next time!\n\nIs there anything else I can help with?",
        hi: "बहुत बढ़िया! 🎉 खुशी है कि आप वापस आ गए!\n\nमैंने अगले 24 घंटों के लिए आपके account में login anomalies की निगरानी के लिए note कर दिया है।\n\n*Tip:* तेज़ access के लिए Settings में *Biometric Login* enable करें!\n\nक्या मैं और कोई सहायता कर सकता/सकती हूँ?",
        id: "Luar biasa! 🎉 Senang Anda sudah bisa masuk!\n\nSaya telah membuat catatan untuk memantau akun Anda dari anomali login lebih lanjut selama 24 jam ke depan.\n\n*Tips:* Aktifkan *Login Biometrik* di Pengaturan untuk akses yang lebih cepat!\n\nApakah ada yang bisa saya bantu lagi?",
        zh: "太好了！🎉 很高兴您重新登录成功！\n\n我已记录将在接下来24小时内监控您的账户是否有进一步的登录异常。\n\n*提示：* 在设置中启用 *生物识别登录* 以获得更快的访问速度！\n\n还有什么我可以帮助您的吗？",
      },
      onNoMatch: {
        en: "I'm escalating this to our *Technical Support Team* right away. 🚨\n\nA senior engineer will contact you within 15 minutes to resolve this remotely.\n\n📞 *Escalation ID:* #TEC-{timestamp}\nPlease keep this ID for reference.\n\nAnything else I can note for the team?",
        hi: "मैं इसे तुरंत हमारी *Technical Support Team* को escalate कर रहा/रही हूँ। 🚨\n\nएक senior engineer 15 मिनट के भीतर remotely resolve करने के लिए आपसे संपर्क करेगा।\n\n📞 *Escalation ID:* #TEC-{timestamp}\nकृपया reference के लिए यह ID रखें।\n\nटीम के लिए कुछ और note करूँ?",
        id: "Saya langsung mengajukan ini ke *Tim Dukungan Teknis* kami. 🚨\n\nSeorang insinyur senior akan menghubungi Anda dalam 15 menit untuk menyelesaikannya dari jarak jauh.\n\n📞 *ID Eskalasi:* #TEC-{timestamp}\nSilakan simpan ID ini sebagai referensi.\n\nAda hal lain yang perlu saya catat untuk tim?",
        zh: "我立即将此问题升级至我们的*技术支持团队*。🚨\n\n一位高级工程师将在15分钟内联系您进行远程解决。\n\n📞 *升级ID：* #TEC-{timestamp}\n请保留此ID以备参考。\n\n还有什么需要我告诉团队的吗？",
      },
    },
    closing: {
      onMatch: {
        en: "You're welcome! 😊 Your access has been restored. Have a great day!",
        hi: "आपका स्वागत है! 😊 आपका access बहाल हो गया है। आपका दिन शुभ हो!",
        id: "Sama-sama! 😊 Akses Anda telah dipulihkan. Semoga hari Anda menyenangkan!",
        zh: "不客气！😊 您的访问权限已恢复。祝您今天愉快！",
      },
      onNoMatch: {
        en: "Your case is being handled by our team. Feel free to check back anytime. Take care! 😊",
        hi: "आपका केस हमारी टीम द्वारा handle किया जा रहा है। कभी भी वापस check करें। ख्याल रखें! 😊",
        id: "Kasus Anda sedang ditangani oleh tim kami. Jangan ragu untuk kembali kapan saja. Jaga kesehatan! 😊",
        zh: "您的案例正由我们的团队处理中。随时可以回来查看。保重！😊",
      },
    },
  },

  // ── General / fallback ────────────────────────────────────────────────
  general: {
    initial: {
      message: {
        en: "Hello! 👋 I'm Agently AI, your dedicated support assistant.\n\nI'm here to help you with:\n• 💳 Payment issues\n• 👛 Wallet top-ups\n• 🆔 KYC verification\n• 🔑 Login problems\n• 📊 Account queries\n\nCould you please describe what you're facing? I'll resolve it right away!",
        hi: "नमस्ते! 👋 मैं Agently AI हूँ, आपका dedicated support assistant।\n\nमैं इनमें आपकी मदद करने के लिए यहाँ हूँ:\n• 💳 Payment issues\n• 👛 Wallet top-ups\n• 🆔 KYC verification\n• 🔑 Login problems\n• 📊 Account queries\n\nकृपया बताएं आप किस समस्या का सामना कर रहे हैं? मैं इसे तुरंत हल करूँगा/करूँगी!",
        id: "Halo! 👋 Saya Agently AI, asisten dukungan dedicated Anda.\n\nSaya di sini untuk membantu Anda dengan:\n• 💳 Masalah pembayaran\n• 👛 Top-up dompet\n• 🆔 Verifikasi KYC\n• 🔑 Masalah login\n• 📊 Pertanyaan akun\n\nBisakah Anda mendeskripsikan masalah yang Anda hadapi? Saya akan segera menyelesaikannya!",
        zh: "您好！👋 我是Agently AI，您的专属支持助手。\n\n我在这里帮助您处理：\n• 💳 付款问题\n• 👛 钱包充值\n• 🆔 KYC验证\n• 🔑 登录问题\n• 📊 账户查询\n\n请描述您遇到的问题，我将立即为您解决！",
      },
    },
    awaiting_issue: {
      onMatch: {
        en: "Thank you for sharing that. I'm checking your account details right now...\n\n🔍 *Reviewing:* Transaction history, account status, open tickets...\n\nCould you provide more context? For example:\n• When did this happen?\n• What error or message did you see?\n• Have you tried any troubleshooting steps?",
        hi: "यह share करने के लिए धन्यवाद। मैं अभी आपके account की details जाँच रहा/रही हूँ...\n\n🔍 *Review हो रहा है:* Transaction history, account status, open tickets...\n\nक्या आप और context दे सकते हैं? उदाहरण के लिए:\n• यह कब हुआ?\n• आपने कौन सा error या message देखा?\n• क्या आपने कोई troubleshooting steps try किए?",
        id: "Terima kasih telah berbagi itu. Saya sedang memeriksa detail akun Anda sekarang...\n\n🔍 *Meninjau:* Riwayat transaksi, status akun, tiket terbuka...\n\nBisakah Anda memberikan konteks lebih lanjut? Misalnya:\n• Kapan ini terjadi?\n• Kesalahan atau pesan apa yang Anda lihat?\n• Apakah Anda sudah mencoba langkah-langkah pemecahan masalah?",
        zh: "感谢您的反馈。我正在检查您的账户详情...\n\n🔍 *审查中：* 交易记录、账户状态、待处理工单...\n\n您能提供更多背景信息吗？例如：\n• 这是什么时候发生的？\n• 您看到了什么错误或消息？\n• 您是否尝试过任何故障排除步骤？",
      },
      onNoMatch: {
        en: "Could you please describe your issue in a little more detail? This helps me provide the most accurate solution. 🙏",
        hi: "क्या आप अपनी समस्या को थोड़ा और detail में बता सकते हैं? इससे मुझे सबसे सटीक समाधान देने में मदद मिलती है। 🙏",
        id: "Bisakah Anda mendeskripsikan masalah Anda sedikit lebih detail? Ini membantu saya memberikan solusi yang paling akurat. 🙏",
        zh: "您能稍微详细地描述一下您的问题吗？这有助于我提供最准确的解决方案。🙏",
      },
    },
    gathering_context: {
      onMatch: {
        en: "Thank you! I have all the details I need.\n\n✅ *Actions taken:*\n• Case logged with ID #SUP-{timestamp}\n• Your account flagged for priority review\n• Specialist team notified\n\n📱 *Next steps:* Our team will contact you within 1 hour with a resolution.\n\nIs there anything else you'd like to add?",
        hi: "धन्यवाद! मेरे पास सभी ज़रूरी details हैं।\n\n✅ *की गई कार्रवाई:*\n• ID #SUP-{timestamp} के साथ केस log किया\n• आपका account priority review के लिए flag किया\n• Specialist team को सूचित किया\n\n📱 *अगले steps:* हमारी टीम 1 घंटे के भीतर resolution के साथ आपसे संपर्क करेगी।\n\nक्या आप कुछ और add करना चाहेंगे?",
        id: "Terima kasih! Saya memiliki semua detail yang saya perlukan.\n\n✅ *Tindakan yang diambil:*\n• Kasus dicatat dengan ID #SUP-{timestamp}\n• Akun Anda ditandai untuk tinjauan prioritas\n• Tim spesialis diberitahu\n\n📱 *Langkah selanjutnya:* Tim kami akan menghubungi Anda dalam 1 jam dengan solusi.\n\nApakah ada hal lain yang ingin Anda tambahkan?",
        zh: "谢谢！我已获得所需的所有详情。\n\n✅ *已采取行动：*\n• 已记录工单ID #SUP-{timestamp}\n• 账户已标记为优先审查\n• 已通知专业团队\n\n📱 *后续步骤：* 我们的团队将在1小时内联系您提供解决方案。\n\n还有什么您想补充的吗？",
      },
      onNoMatch: {
        en: "I understand. Let me connect you with the right specialist who can look into this further. Please hold on for a moment.",
        hi: "मैं समझता/समझती हूँ। मैं आपको सही specialist से connect कर रहा/रही हूँ जो इसे और जाँच सकेगा। कृपया एक पल रुकें।",
        id: "Saya mengerti. Biarkan saya menghubungkan Anda dengan spesialis yang tepat yang dapat menyelidiki lebih lanjut. Harap tunggu sebentar.",
        zh: "我明白了。让我为您联系合适的专家进一步调查。请稍候。",
      },
    },
    closing: {
      onMatch: {
        en: "You're welcome! 😊 Your case is being handled. Feel free to reach out anytime. Have a great day!",
        hi: "आपका स्वागत है! 😊 आपका केस handle किया जा रहा है। कभी भी संपर्क करें। आपका दिन शुभ हो!",
        id: "Sama-sama! 😊 Kasus Anda sedang ditangani. Jangan ragu menghubungi kapan saja. Semoga hari Anda menyenangkan!",
        zh: "不客气！😊 您的案例正在处理中。随时联系我们。祝您今天愉快！",
      },
      onNoMatch: {
        en: "Thank you for reaching out! Our team is on it. Have a wonderful day! 😊",
        hi: "संपर्क करने के लिए धन्यवाद! हमारी टीम इस पर काम कर रही है। आपका दिन अच्छा हो! 😊",
        id: "Terima kasih telah menghubungi kami! Tim kami sedang menanganinya. Semoga hari Anda menyenangkan! 😊",
        zh: "感谢您的联系！我们的团队正在处理中。祝您有美好的一天！😊",
      },
    },
  },
};

/**
 * Get a translated message for a given flow state and match outcome.
 * Falls back to English if the requested language is not available.
 */
export const getTranslatedMessage = (issueType, state, matchType, lang = 'en') => {
  return (
    FLOW_TRANSLATIONS?.[issueType]?.[state]?.[matchType]?.[lang] ||
    FLOW_TRANSLATIONS?.[issueType]?.[state]?.[matchType]?.en ||
    null
  );
};
