import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/Sidebar';
import { Avatar, Badge, IssueStatusBadge, SeverityBadge, TierBadge } from '../../../components/UI';
import { useApp } from '../../../context/AppContext';
import { sendWhatsAppMessage, formatBotMessage, formatAgentTakeover } from '../../../utils/whatsapp';

const AI_RESPONSES = {
  default: "I understand your concern. Let me look into this for you right away. Could you please provide more details about the issue you're experiencing?",
  payment: "I've checked your account and can see the payment details. Our system shows the transaction is being processed. Typical processing time is 2-4 hours. Would you like me to escalate this to our priority queue?",
  wallet: "I can see the wallet top-up request. The amount appears to be in our reconciliation queue. I'll flag this for immediate processing. You should receive a confirmation within 30 minutes.",
  kyc: "I can see your KYC verification is pending. Please ensure your Aadhaar card is clearly photographed and the details match exactly. I'll expedite the verification process for you.",
  login: "For login issues, please try: 1) Clear app cache, 2) Ensure your phone time is set to automatic, 3) Request a fresh OTP. If the issue persists, I'll reset your session immediately.",
  resolved: "Great news! I've resolved your issue. Your account has been updated. Is there anything else I can help you with today? 😊",
};

const getAIResponse = (message) => {
  const lower = message.toLowerCase();
  if (lower.includes('payment') || lower.includes('upi') || lower.includes('transfer') || lower.includes('declined')) return AI_RESPONSES.payment;
  if (lower.includes('wallet') || lower.includes('top-up') || lower.includes('topup') || lower.includes('credit')) return AI_RESPONSES.wallet;
  if (lower.includes('kyc') || lower.includes('aadhaar') || lower.includes('verification')) return AI_RESPONSES.kyc;
  if (lower.includes('login') || lower.includes('otp') || lower.includes('access')) return AI_RESPONSES.login;
  if (lower.includes('thank') || lower.includes('solved') || lower.includes('fixed') || lower.includes('working')) return AI_RESPONSES.resolved;
  return AI_RESPONSES.default;
};

const MessageBubble = ({ msg }) => {
  const isBot = msg.sender === 'ai_bot';
  const isHuman = msg.sender === 'human_agent';
  const isCustomer = msg.sender === 'customer';

  if (isCustomer) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px', gap: '8px', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', maxWidth: '72%' }}>
          <div style={{ background: 'linear-gradient(135deg, #1e5fb5, #2979d8)', color: '#fff', padding: '10px 14px', borderRadius: '18px 18px 4px 18px', fontSize: '13.5px', lineHeight: 1.55 }}>
            <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{msg.message}</p>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--gray-400)' }}>
            {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · WhatsApp
          </span>
        </div>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1e5fb520', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#1e5fb5', flexShrink: 0, border: '1.5px solid #1e5fb530' }}>
          C
        </div>
      </div>
    );
  }

  const bubbleBg = isBot ? '#f0f7ff' : '#f5f3ff';
  const bubbleBorder = isBot ? '#bfdbfe' : '#ddd6fe';
  const senderColor = isBot ? '#1e40af' : '#5b21b6';

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px', gap: '8px', alignItems: 'flex-end' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: isBot ? '#dbeafe' : '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
        {isBot ? '🤖' : '👤'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxWidth: '72%' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: senderColor, marginLeft: '2px' }}>{msg.senderName}</span>
        <div style={{ background: bubbleBg, border: `1px solid ${bubbleBorder}`, padding: '10px 14px', borderRadius: '18px 18px 18px 4px', fontSize: '13.5px', lineHeight: 1.55, color: 'var(--gray-800)' }}>
          <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{msg.message}</p>
        </div>
        <span style={{ fontSize: '10px', color: 'var(--gray-400)', marginLeft: '2px' }}>
          {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          {isBot && ' · AI Bot'}{isHuman && ' · Human Agent'}
        </span>
      </div>
    </div>
  );
};

const ChatPage = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const { customers, getCustomerById, getConversation, sendMessage, resolveIssue, agentMode, toggleAgentMode } = useApp();
  const [inputMsg, setInputMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState(null);
  const [botTyping, setBotTyping] = useState(false);
  const [activeTab, setActiveTab] = useState('issues');
  const messagesEndRef = useRef(null);

  const customer = getCustomerById(customerId);
  const messages = getConversation(customerId);
  const isHumanMode = agentMode[customerId] === 'human';
  const openIssues = customer?.issues?.filter(i => i.status !== 'resolved') || [];

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  if (!customer) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <p style={{ color: 'var(--gray-500)', fontSize: '16px', marginBottom: '20px' }}>Customer not found.</p>
          <button onClick={() => navigate('/engagement/customers')} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #1e5fb5, #2979d8)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
            ← Back to Customers
          </button>
        </div>
      </div>
    );
  }

  const handleSend = async () => {
    if (!inputMsg.trim() || sending) return;
    const msg = inputMsg.trim();
    setInputMsg('');
    setSending(true);

    const senderName = isHumanMode ? 'Ravi Kumar (Agent)' : 'FinAgent AI';
    const sender = isHumanMode ? 'human_agent' : 'ai_bot';
    sendMessage(customerId, msg, sender, senderName);

    try {
      const formattedMsg = isHumanMode
        ? formatAgentTakeover(senderName, msg)
        : formatBotMessage(msg);
      await sendWhatsAppMessage('+918617269309', formattedMsg);
      setWhatsappStatus({ success: true, message: 'Sent via WhatsApp ✓' });
      setTimeout(() => setWhatsappStatus(null), 3000);
    } catch (e) {
      setWhatsappStatus({ success: false, message: 'Configure CallMeBot API key to enable' });
      setTimeout(() => setWhatsappStatus(null), 4000);
    }

    setSending(false);
  };

  const handleSimulateCustomerMsg = () => {
    const sampleMsgs = [
      "Is my issue resolved? I still can't make payments.",
      "Thank you for the help! It's working now.",
      "Can you please escalate this to a senior agent?",
      "I tried what you suggested but it's still not working.",
      "How long will this take to resolve?",
    ];
    const randomMsg = sampleMsgs[Math.floor(Math.random() * sampleMsgs.length)];
    sendMessage(customerId, randomMsg, 'customer', customer.name);

    if (!isHumanMode) {
      setBotTyping(true);
      setTimeout(() => {
        setBotTyping(false);
        const aiReply = getAIResponse(randomMsg);
        sendMessage(customerId, aiReply, 'ai_bot', 'FinAgent AI');
      }, 1800);
    }
  };

  return (
    <div style={{ display: 'flex', flex: 1, height: '100vh', overflow: 'hidden' }}>
      {/* Customer info panel */}
      <div style={{ width: '280px', background: '#fff', borderRight: '1px solid var(--gray-200)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
        {/* Back */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--gray-100)' }}>
          <button onClick={() => navigate('/engagement/customers')} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--gray-500)', fontSize: '12px', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            ← Customers
          </button>
        </div>

        {/* Profile */}
        <div style={{ padding: '18px 16px', borderBottom: '1px solid var(--gray-100)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ width: 46, height: 46, borderRadius: '50%', background: `${customer.avatarColor}20`, border: `2px solid ${customer.avatarColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 700, color: customer.avatarColor, flexShrink: 0 }}>
              {customer.avatar}
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', color: 'var(--gray-900)', lineHeight: 1.2 }}>{customer.name}</h3>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: customer.tier === 'Platinum' ? '#f1f5f9' : customer.tier === 'Gold' ? '#fef9c3' : customer.tier === 'Silver' ? '#dbeafe' : '#f1f5f9', border: '1px solid', borderColor: customer.tier === 'Platinum' ? '#cbd5e1' : customer.tier === 'Gold' ? '#fde047' : customer.tier === 'Silver' ? '#bfdbfe' : '#e2e8f0', borderRadius: '12px', padding: '2px 8px', marginTop: '3px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: customer.tier === 'Gold' ? '#854d0e' : 'var(--gray-600)' }}>{customer.tier}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
            {[
              { label: 'Account', value: customer.accountNumber },
              { label: 'Balance', value: `₹${customer.balance.toLocaleString('en-IN', { minimumFractionDigits: 0 })}` },
              { label: 'WhatsApp', value: customer.phone },
              { label: 'KYC', value: customer.kycStatus === 'verified' ? '✓ Done' : '⏳ Pending', color: customer.kycStatus === 'verified' ? '#10b981' : '#f59e0b' },
            ].map(item => (
              <div key={item.label} style={{ background: 'var(--gray-50)', padding: '8px', borderRadius: '8px', border: '1px solid var(--gray-100)' }}>
                <p style={{ color: 'var(--gray-400)', marginBottom: '2px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</p>
                <p style={{ fontWeight: 700, color: item.color || 'var(--gray-700)', fontSize: '11px' }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-100)' }}>
          {['issues', 'txns'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              flex: 1, padding: '10px 8px', fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-body)',
              background: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em',
              color: activeTab === tab ? 'var(--blue-500)' : 'var(--gray-400)',
              borderBottom: activeTab === tab ? '2px solid var(--blue-400)' : '2px solid transparent',
              border: 'none', transition: 'all 0.15s'
            }}>{tab === 'txns' ? 'Transactions' : 'Issues'}</button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {activeTab === 'issues' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {customer.issues.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--gray-400)', fontSize: '12px' }}>✅ No issues on record</div>
              ) : customer.issues.map(issue => (
                <div key={issue.id} style={{ padding: '10px', borderRadius: '10px', border: `1px solid ${issue.status === 'resolved' ? 'var(--gray-100)' : issue.severity === 'high' ? '#fca5a5' : '#fde68a'}`, background: issue.status === 'resolved' ? 'var(--gray-50)' : issue.severity === 'high' ? '#fff5f5' : '#fffbeb' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray-800)', marginBottom: '5px', lineHeight: 1.3 }}>{issue.title}</p>
                  <p style={{ fontSize: '10px', color: 'var(--gray-400)', marginBottom: '7px', lineHeight: 1.4 }}>{issue.description}</p>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '10px', background: issue.status === 'resolved' ? '#d1fae5' : issue.status === 'in_progress' ? '#fef3c7' : '#fee2e2', color: issue.status === 'resolved' ? '#065f46' : issue.status === 'in_progress' ? '#92400e' : '#991b1b' }}>
                      {issue.status === 'in_progress' ? 'IN PROGRESS' : issue.status.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '10px', background: issue.assignedTo === 'ai_bot' ? '#dbeafe' : '#ede9fe', color: issue.assignedTo === 'ai_bot' ? '#1e40af' : '#5b21b6' }}>
                      {issue.assignedTo === 'ai_bot' ? '🤖 AI' : '👤 Human'}
                    </span>
                  </div>
                  {issue.status !== 'resolved' && (
                    <button onClick={() => resolveIssue(customerId, issue.id)} style={{ width: '100%', padding: '5px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                      ✓ Mark Resolved
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          {activeTab === 'txns' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {customer.transactions.map(txn => (
                <div key={txn.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '8px', background: '#fff', border: '1px solid var(--gray-100)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: txn.type === 'credit' ? '#d1fae5' : txn.status === 'failed' ? '#fee2e2' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>
                    {txn.type === 'credit' ? '↓' : txn.status === 'failed' ? '✕' : '↑'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--gray-700)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{txn.description}</p>
                    <p style={{ fontSize: '9px', color: 'var(--gray-400)' }}>{new Date(txn.date).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: txn.type === 'credit' ? '#10b981' : txn.status === 'failed' ? '#ef4444' : 'var(--gray-700)' }}>
                      {txn.type === 'credit' ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
                    </p>
                    <span style={{ fontSize: '8px', fontWeight: 700, padding: '1px 5px', borderRadius: '8px', background: txn.status === 'success' ? '#d1fae5' : txn.status === 'pending' ? '#fef3c7' : '#fee2e2', color: txn.status === 'success' ? '#065f46' : txn.status === 'pending' ? '#92400e' : '#991b1b' }}>
                      {txn.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f8fafc', overflow: 'hidden' }}>
        {/* Chat header */}
        <div style={{ background: '#fff', borderBottom: '1px solid var(--gray-200)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${customer.avatarColor}20`, border: `2px solid ${customer.avatarColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: customer.avatarColor }}>
              {customer.avatar}
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px', color: 'var(--gray-900)', lineHeight: 1.2 }}>{customer.name}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#25D366', display: 'inline-block' }} />
                <span style={{ fontSize: '11px', color: 'var(--gray-400)' }}>WhatsApp · {isHumanMode ? '👤 Human Agent' : '🤖 AI Bot'} Mode</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {whatsappStatus && (
              <div style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, background: whatsappStatus.success ? '#d1fae5' : '#fff7ed', color: whatsappStatus.success ? '#065f46' : '#92400e', border: `1px solid ${whatsappStatus.success ? '#6ee7b7' : '#fed7aa'}` }}>
                📱 {whatsappStatus.message}
              </div>
            )}
            {openIssues.length > 0 && (
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '12px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}>
                {openIssues.length} Open Issue{openIssues.length > 1 ? 's' : ''}
              </span>
            )}

            {/* Mode toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: '10px', padding: '6px 12px', cursor: 'pointer' }} onClick={() => toggleAgentMode(customerId)}>
              <span style={{ fontSize: '11px', color: 'var(--gray-600)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {isHumanMode ? '👤 Human Mode' : '🤖 AI Mode'}
              </span>
              <div style={{ width: 34, height: 18, borderRadius: '9px', background: isHumanMode ? '#8b5cf6' : '#1e5fb5', position: 'relative', transition: 'background 0.2s' }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: isHumanMode ? 18 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
            </div>

            <button onClick={handleSimulateCustomerMsg} style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, background: '#fff', color: 'var(--gray-600)', border: '1px solid var(--gray-200)', cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
              + Simulate Reply
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ display: 'inline-block', padding: '5px 16px', borderRadius: '12px', background: 'rgba(37, 211, 102, 0.1)', border: '1px solid rgba(37, 211, 102, 0.25)', fontSize: '11px', color: '#065f46', fontWeight: 500 }}>
              📱 WhatsApp · {customer.phone}
            </span>
          </div>

          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
              <p style={{ fontWeight: 600, color: 'var(--gray-500)', fontSize: '15px' }}>No messages yet</p>
              <p style={{ fontSize: '13px', marginTop: '6px', color: 'var(--gray-400)' }}>Type a message below or simulate a customer reply</p>
            </div>
          ) : messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}

          {botTyping && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', marginBottom: '12px' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🤖</div>
              <div style={{ background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: '18px 18px 18px 4px', padding: '10px 16px' }}>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#93c5fd', animation: `pulse 1.2s ${i * 0.25}s ease-in-out infinite` }} />)}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ background: '#fff', borderTop: '1px solid var(--gray-200)', padding: '14px 20px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', color: 'var(--gray-400)' }}>Sending as:</span>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: isHumanMode ? '#ede9fe' : '#dbeafe', color: isHumanMode ? '#5b21b6' : '#1e40af' }}>
              {isHumanMode ? '👤 Ravi Kumar (Human Agent)' : '🤖 FinAgent AI Bot'}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--gray-300)' }}>→ WhatsApp delivery to {customer.phone}</span>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <textarea
              value={inputMsg}
              onChange={e => setInputMsg(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={`Message as ${isHumanMode ? 'human agent' : 'AI bot'}... (Enter to send, Shift+Enter for newline)`}
              style={{ flex: 1, padding: '10px 14px', borderRadius: '12px', border: '1.5px solid var(--gray-200)', fontSize: '13.5px', fontFamily: 'var(--font-body)', resize: 'none', minHeight: '44px', maxHeight: '120px', outline: 'none', color: 'var(--gray-800)', background: 'var(--gray-50)', lineHeight: 1.5 }}
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!inputMsg.trim() || sending}
              style={{ width: 44, height: 44, borderRadius: '12px', flexShrink: 0, background: inputMsg.trim() ? 'linear-gradient(135deg, #1e5fb5, #2979d8)' : 'var(--gray-200)', color: inputMsg.trim() ? '#fff' : 'var(--gray-400)', border: 'none', cursor: inputMsg.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
          <p style={{ fontSize: '10px', color: 'var(--gray-300)', marginTop: '6px', textAlign: 'center' }}>
            📱 WhatsApp via CallMeBot API · Demo number: +91 8617269309 · Configure API key in src/utils/whatsapp.js
          </p>
        </div>
      </div>
    </div>
  );
};

const ChatPageWrapper = () => (
  <div style={{ display: 'flex', minHeight: '100vh' }}>
    <Sidebar />
    <div style={{ flex: 1, marginLeft: '220px', display: 'flex' }}>
      <ChatPage />
    </div>
  </div>
);

export default ChatPageWrapper;
