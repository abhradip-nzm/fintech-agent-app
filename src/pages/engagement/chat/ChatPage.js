import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/Sidebar';
import { useApp } from '../../../context/AppContext';
import { sendWhatsAppMessage, formatBotMessage, formatAgentTakeover, fetchIncomingMessages } from '../../../utils/whatsapp';
import { processTriageMessage, getTriageOpener, getCustomerIssueType } from '../../../utils/triage';
import { playMessageTone, playAssignTone } from '../../../utils/sounds';
import { STATUS_META } from '../../../data/agentsData';

// ─── Message bubble ───────────────────────────────────────────────────────────
const MessageBubble = ({ msg }) => {
  const isBot      = msg.sender === 'ai_bot';
  const isHuman    = msg.sender === 'human_agent';
  const isCustomer = msg.sender === 'customer';

  if (isCustomer) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12, gap: 8, alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, maxWidth: '72%' }}>
          <div style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', color: '#fff', padding: '10px 14px', borderRadius: '18px 18px 4px 18px', fontSize: 13.5, lineHeight: 1.55 }}>
            <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{msg.message}</p>
          </div>
          <span style={{ fontSize: 10, color: 'var(--gray-400)' }}>
            {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · WhatsApp
            {msg.source === 'whatsapp_live' && <span style={{ marginLeft: 4, color: '#25D366', fontWeight: 700 }}>● Live</span>}
          </span>
        </div>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#25D36620', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#128C7E', flexShrink: 0, border: '1.5px solid #25D36630' }}>C</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12, gap: 8, alignItems: 'flex-end' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: isBot ? '#dbeafe' : '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
        {isBot ? '🤖' : '👤'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: '72%' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: isBot ? '#1e40af' : '#5b21b6', marginLeft: 2 }}>{msg.senderName}</span>
        <div style={{ background: isBot ? '#f0f7ff' : '#f5f3ff', border: `1px solid ${isBot ? '#bfdbfe' : '#ddd6fe'}`, padding: '10px 14px', borderRadius: '18px 18px 18px 4px', fontSize: 13.5, lineHeight: 1.55, color: 'var(--gray-800)' }}>
          <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{msg.message}</p>
        </div>
        <span style={{ fontSize: 10, color: 'var(--gray-400)', marginLeft: 2 }}>
          {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          {isBot && ' · AI Bot'}{isHuman && ' · Human Agent'}
        </span>
      </div>
    </div>
  );
};

// ─── Agent Picker Modal ───────────────────────────────────────────────────────
const AgentPickerModal = ({ customer, onAssign, onCancel, getSortedAgents, getAgentLoad }) => {
  const agents   = getSortedAgents();
  const recommended = agents.find(a => a.status === 'online' || a.status === 'busy') || agents[0];
  const [selected, setSelected] = useState(recommended?.id || null);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 460, boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: 'var(--gray-900)', lineHeight: 1.2 }}>Assign Human Agent</h3>
            <p style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 3 }}>
              Customer: <strong>{customer.name}</strong> · Round-robin recommended below
            </p>
          </div>
          <button onClick={onCancel} style={{ width: 28, height: 28, borderRadius: 8, background: '#f1f5f9', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--gray-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, maxHeight: 340, overflowY: 'auto' }}>
          {agents.map(agent => {
            const m       = STATUS_META[agent.status] || STATUS_META.offline;
            const isRec   = agent.id === recommended?.id;
            const isSel   = agent.id === selected;
            const loadPct = Math.min(agent.load / 5, 1);
            const loadColor = loadPct > 0.7 ? '#ef4444' : loadPct > 0.4 ? '#f59e0b' : '#10b981';
            const unavailable = agent.status === 'offline';

            return (
              <div
                key={agent.id}
                onClick={() => !unavailable && setSelected(agent.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                  borderRadius: 12, cursor: unavailable ? 'not-allowed' : 'pointer',
                  border: `2px solid ${isSel ? '#1e5fb5' : isRec ? '#bfdbfe' : 'var(--gray-200)'}`,
                  background: isSel ? '#eff6ff' : isRec ? '#f8fbff' : '#fff',
                  opacity: unavailable ? 0.5 : 1, transition: 'all 0.15s',
                }}
              >
                {/* Avatar */}
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${agent.avatarColor}20`, border: `2px solid ${agent.avatarColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: agent.avatarColor, flexShrink: 0 }}>
                  {agent.avatar}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--gray-900)' }}>{agent.name}</span>
                    {isRec && <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 10, background: '#1e5fb5', color: '#fff' }}>RECOMMENDED</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: m.color }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: m.color, display: 'inline-block' }} />
                      {m.label}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--gray-400)' }}>{agent.role}</span>
                  </div>
                  {/* Load bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                    <div style={{ flex: 1, height: 4, background: '#f1f5f9', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${loadPct * 100}%`, background: loadColor, borderRadius: 2, transition: 'width 0.3s' }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: loadColor, minWidth: 50 }}>{agent.load} active</span>
                  </div>
                </div>
                {/* Radio */}
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${isSel ? '#1e5fb5' : 'var(--gray-300)'}`, background: isSel ? '#1e5fb5' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {isSel && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '11px', borderRadius: 10, background: '#fff', color: '#64748b', border: '1.5px solid #e2e8f0', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
          <button
            onClick={() => selected && onAssign(selected)}
            disabled={!selected}
            style={{ flex: 2, padding: '11px', borderRadius: 10, background: selected ? 'linear-gradient(135deg, #1e5fb5, #7c3aed)' : '#e2e8f0', color: selected ? '#fff' : '#94a3b8', border: 'none', fontSize: 13, fontWeight: 700, cursor: selected ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-body)', boxShadow: selected ? '0 4px 16px rgba(30,95,181,0.3)' : 'none' }}>
            👤 Confirm Assignment
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Chat separator ───────────────────────────────────────────────────────────
const Separator = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
    <div style={{ flex: 1, height: 1, background: 'var(--gray-100)' }} />
    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--gray-400)', padding: '3px 10px', background: '#f1f5f9', borderRadius: 10, whiteSpace: 'nowrap' }}>{label}</span>
    <div style={{ flex: 1, height: 1, background: 'var(--gray-100)' }} />
  </div>
);

// ─── Chat Page ────────────────────────────────────────────────────────────────
const ChatPage = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const {
    customers, getCustomerById, getConversation, sendMessage,
    resolveIssue, updateCustomerPhone,
    agentMode, toggleAgentMode, setCustomerAgentMode,
    humanAgents, getSortedAgents, getAgentLoad, getRecommendedAgent,
    agentAssignments, assignAgent, releaseAgent,
    addNotification, markAllRead,
    triageStates, setTriageState, getTriageState,
  } = useApp();

  const [inputMsg,        setInputMsg]        = useState('');
  const [sending,         setSending]         = useState(false);
  const [waStatus,        setWaStatus]        = useState(null);
  const [botTyping,       setBotTyping]       = useState(false);
  const [activeTab,       setActiveTab]       = useState('issues');
  const [editingPhone,    setEditingPhone]    = useState(false);
  const [phoneInput,      setPhoneInput]      = useState('');
  const [botInitiated,    setBotInitiated]    = useState(false);
  const [initiating,      setInitiating]      = useState(false);
  const [fetchingReplies, setFetchingReplies] = useState(false);
  const [replyMsg,        setReplyMsg]        = useState(null);
  const [polling,         setPolling]         = useState(false);
  const [showAgentPicker, setShowAgentPicker] = useState(false);

  const messagesEndRef   = useRef(null);
  const importedMsgIds   = useRef(new Set());
  const pollIntervalRef  = useRef(null);
  const prevMsgCountRef  = useRef(0);

  const customer     = getCustomerById(customerId);
  const messages     = getConversation(customerId);
  const isHumanMode  = agentMode[customerId] === 'human';
  const openIssues   = customer?.issues?.filter(i => i.status !== 'resolved') || [];
  const hasPastConvo = messages.length > 0;
  const assignedAgentId = agentAssignments[customerId];
  const assignedAgent   = humanAgents.find(a => a.id === assignedAgentId);
  const convoActive     = hasPastConvo || botInitiated || messages.length > 0;
  const issueType       = getCustomerIssueType(customer);

  // ── Auto-scroll ──────────────────────────────────────────────────────────────
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, botTyping]);

  // ── Seed imported WA IDs ─────────────────────────────────────────────────────
  useEffect(() => { messages.forEach(m => { if (m.waId) importedMsgIds.current.add(m.waId); }); }, []); // eslint-disable-line

  // ── Detect new customer messages → play sound + add notification ─────────────
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current) {
      const newMsgs = messages.slice(prevMsgCountRef.current);
      newMsgs.forEach(msg => {
        if (msg.sender === 'customer') {
          playMessageTone();
          addNotification({
            type:         'customer_reply',
            customerId,
            customerName: customer?.name,
            message:      msg.message,
          });
          // If bot mode is active and convo is going, run triage auto-reply
          if (!isHumanMode && convoActive) {
            triggerTriageReply(msg.message);
          }
        }
      });
    }
    prevMsgCountRef.current = messages.length;
  }, [messages]); // eslint-disable-line

  // ── Auto-poll ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (polling && customer) {
      pollIntervalRef.current = setInterval(() => doFetchReplies(false), 12000);
    }
    return () => clearInterval(pollIntervalRef.current);
  }, [polling, customer, messages]); // eslint-disable-line

  useEffect(() => () => clearInterval(pollIntervalRef.current), []);

  // ── Triage: auto reply to customer message ───────────────────────────────────
  const triggerTriageReply = useCallback((customerMsg) => {
    const triageState = getTriageState(customerId);
    if (!triageState) return;
    if (triageState.state === 'terminal') return;

    setBotTyping(true);
    setTimeout(() => {
      setBotTyping(false);
      const result = processTriageMessage(triageState.issueType, triageState.state, customerMsg, { phone: customer?.phone });
      if (result.message) {
        sendMessage(customerId, result.message, 'ai_bot', 'Agently AI');
        // Deliver to WhatsApp (best effort)
        const ph = '+' + (customer?.phone || '').replace(/\D/g, '');
        sendWhatsAppMessage(ph, formatBotMessage(result.message)).catch(() => {});
      }
      setTriageState(customerId, { issueType: triageState.issueType, state: result.nextState });
    }, 1600);
  }, [customerId, customer, getTriageState, sendMessage, setTriageState]);

  // ── Fetch WA replies ─────────────────────────────────────────────────────────
  const doFetchReplies = useCallback(async (showToast = true) => {
    if (!customer) return;
    if (showToast) setFetchingReplies(true);
    const result = await fetchIncomingMessages(customer.phone, 30);
    if (result.success) {
      let added = 0;
      result.messages.forEach(m => {
        if (!importedMsgIds.current.has(m.id)) {
          importedMsgIds.current.add(m.id);
          sendMessage(customerId, m.message, 'customer', customer.name, m.timestamp, m.id);
          added++;
        }
      });
      if (showToast) {
        setReplyMsg(added > 0
          ? { type: 'success', text: `${added} new repl${added === 1 ? 'y' : 'ies'} fetched ✓` }
          : { type: 'info', text: 'No new replies yet' });
        setTimeout(() => setReplyMsg(null), 3500);
      }
    } else if (showToast) {
      setReplyMsg({ type: 'warn', text: `Could not fetch: ${result.error || 'check token'}` });
      setTimeout(() => setReplyMsg(null), 4000);
    }
    if (showToast) setFetchingReplies(false);
  }, [customer, customerId, sendMessage]);

  // ── Initiate bot conversation ────────────────────────────────────────────────
  const handleInitiateBot = async () => {
    if (!customer || initiating) return;
    setInitiating(true);
    const { message, nextState } = getTriageOpener(issueType);

    setBotTyping(true);
    await new Promise(r => setTimeout(r, 1800));
    setBotTyping(false);

    sendMessage(customerId, message, 'ai_bot', 'Agently AI');
    setTriageState(customerId, { issueType, state: nextState });
    setBotInitiated(true);
    setPolling(true);

    try {
      const ph = '+' + (customer.phone || '').replace(/\D/g, '');
      await sendWhatsAppMessage(ph, formatBotMessage(message));
      setWaStatus({ success: true, message: 'Bot greeting sent via WhatsApp ✓' });
    } catch {
      setWaStatus({ success: false, message: 'WhatsApp delivery failed — check Whapi token' });
    }
    setTimeout(() => setWaStatus(null), 4000);
    setInitiating(false);

    addNotification({ type: 'bot_initiated', customerId, customerName: customer.name, message: `Bot conversation initiated with ${customer.name}` });
  };

  // ── Send message ─────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!inputMsg.trim() || sending) return;
    const msg = inputMsg.trim();
    setInputMsg('');
    setSending(true);

    const agentName = assignedAgent ? assignedAgent.name : 'Ravi Kumar';
    const senderName = isHumanMode ? `${agentName} (Agent)` : 'Agently AI';
    const sender     = isHumanMode ? 'human_agent' : 'ai_bot';
    sendMessage(customerId, msg, sender, senderName);

    try {
      const formatted = isHumanMode ? formatAgentTakeover(senderName, msg) : formatBotMessage(msg);
      const ph = '+' + (customer.phone || '').replace(/\D/g, '');
      await sendWhatsAppMessage(ph, formatted);
      setWaStatus({ success: true, message: 'Sent via WhatsApp ✓' });
    } catch {
      setWaStatus({ success: false, message: 'WhatsApp delivery failed' });
    }
    setTimeout(() => setWaStatus(null), 3000);
    setSending(false);

    // If bot mode: also process through triage for an AI auto-follow-up
    if (!isHumanMode) {
      const triageState = getTriageState(customerId);
      if (triageState && triageState.state !== 'terminal') {
        setBotTyping(true);
        setTimeout(() => {
          setBotTyping(false);
          const result = processTriageMessage(triageState.issueType, triageState.state, msg, { phone: customer?.phone });
          sendMessage(customerId, result.message, 'ai_bot', 'Agently AI');
          setTriageState(customerId, { issueType: triageState.issueType, state: result.nextState });
        }, 1600);
      }
    }
  };

  // ── Agent assignment ─────────────────────────────────────────────────────────
  const handleAssignAgent = (agentId) => {
    assignAgent(customerId, agentId);
    setShowAgentPicker(false);
    playAssignTone();
    const agent = humanAgents.find(a => a.id === agentId);
    if (agent) {
      const joinMsg = `Hi ${customer?.name}! I'm ${agent.name} from the ${agent.role} team. I've taken over your case and I'm here to help you personally. Let me review the conversation and assist you right away!`;
      sendMessage(customerId, joinMsg, 'human_agent', `${agent.name} (Agent)`);
      const ph = '+' + (customer?.phone || '').replace(/\D/g, '');
      sendWhatsAppMessage(ph, formatAgentTakeover(agent.name, joinMsg)).catch(() => {});
      addNotification({ type: 'agent_assigned', customerId, customerName: customer?.name, message: `${agent.name} assigned to ${customer?.name}'s conversation` });
    }
  };

  const handleReleaseAgent = () => {
    releaseAgent(customerId);
    setTriageState(customerId, { issueType, state: getTriageState(customerId)?.state || 'awaiting_issue' });
  };

  // ── Simulate customer reply ───────────────────────────────────────────────────
  const handleSimulateReply = () => {
    const samples = [
      "I still see the same issue. Can you help me further?",
      "Thank you for the help! It's working now. 🙏",
      "Can you please escalate this to a senior agent?",
      "The reference number is TXN2024031500987.",
      "I used Google Pay for the payment.",
      "The balance is still not updated. It's been 2 hours now.",
      "I received OTP but it shows invalid session error.",
      "Yes, that worked! Thank you so much!",
    ];
    const msg = samples[Math.floor(Math.random() * samples.length)];
    sendMessage(customerId, msg, 'customer', customer?.name);
  };

  // ── Phone edit ───────────────────────────────────────────────────────────────
  const handleSavePhone = () => {
    const c = phoneInput.replace(/\D/g, '');
    if (c.length >= 10) { updateCustomerPhone(customerId, phoneInput); setEditingPhone(false); }
  };

  if (!customer) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <p style={{ color: 'var(--gray-500)', fontSize: 16, marginBottom: 20 }}>Customer not found.</p>
          <button onClick={() => navigate('/engagement/customers')} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #1e5fb5, #2979d8)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
            ← Back to Customers
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Agent picker modal */}
      {showAgentPicker && (
        <AgentPickerModal
          customer={customer}
          onAssign={handleAssignAgent}
          onCancel={() => setShowAgentPicker(false)}
          getSortedAgents={getSortedAgents}
          getAgentLoad={getAgentLoad}
        />
      )}

      <div style={{ display: 'flex', flex: 1, height: '100vh', overflow: 'hidden' }}>

        {/* ── LEFT: customer panel ── */}
        <div style={{ width: 280, background: '#fff', borderRight: '1px solid var(--gray-200)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>

          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--gray-100)' }}>
            <button onClick={() => navigate('/engagement/customers')} style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--gray-500)', fontSize: 12, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              ← Customers
            </button>
          </div>

          {/* Profile */}
          <div style={{ padding: '18px 16px', borderBottom: '1px solid var(--gray-100)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: '50%', background: `${customer.avatarColor}20`, border: `2px solid ${customer.avatarColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: customer.avatarColor, flexShrink: 0 }}>
                {customer.avatar}
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--gray-900)', lineHeight: 1.2 }}>{customer.name}</h3>
                <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, background: '#fef9c3', border: '1px solid #fde047', fontSize: 10, fontWeight: 700, color: '#854d0e', marginTop: 3 }}>{customer.tier}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, fontSize: 11 }}>
              {[
                { label: 'Account', value: customer.accountNumber },
                { label: 'Balance',  value: `₹${customer.balance.toLocaleString('en-IN', { minimumFractionDigits: 0 })}` },
                { label: 'KYC',      value: customer.kycStatus === 'verified' ? '✓ Done' : '⏳ Pending', color: customer.kycStatus === 'verified' ? '#10b981' : '#f59e0b' },
                { label: 'Since',    value: new Date(customer.joinDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' }) },
              ].map(item => (
                <div key={item.label} style={{ background: 'var(--gray-50)', padding: '7px 9px', borderRadius: 8, border: '1px solid var(--gray-100)' }}>
                  <p style={{ color: 'var(--gray-400)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{item.label}</p>
                  <p style={{ fontWeight: 700, color: item.color || 'var(--gray-700)', fontSize: 11 }}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* WhatsApp number (editable) */}
            <div style={{ marginTop: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <p style={{ color: '#166534', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>📱 WhatsApp</p>
                {!editingPhone && <button onClick={() => { setPhoneInput(customer.phone); setEditingPhone(true); }} style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>✏️ Edit</button>}
              </div>
              {editingPhone ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <input type="text" value={phoneInput} onChange={e => setPhoneInput(e.target.value)} style={{ width: '100%', padding: '5px 8px', borderRadius: 6, border: '1.5px solid #86efac', fontSize: 11, fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box' }} autoFocus />
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={handleSavePhone} style={{ flex: 1, padding: 4, borderRadius: 5, fontSize: 10, fontWeight: 700, background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>✓ Save</button>
                    <button onClick={() => setEditingPhone(false)} style={{ flex: 1, padding: 4, borderRadius: 5, fontSize: 10, fontWeight: 700, background: '#e5e7eb', color: '#374151', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>✕</button>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>{customer.phone}</p>
              )}
            </div>

            {/* Assigned agent badge */}
            {assignedAgent && (
              <div style={{ marginTop: 8, background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 8, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${assignedAgent.avatarColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: assignedAgent.avatarColor, flexShrink: 0 }}>
                  {assignedAgent.avatar}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#5b21b6' }}>{assignedAgent.name}</p>
                  <p style={{ fontSize: 9, color: '#7c3aed' }}>Assigned Agent</p>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-100)' }}>
            {['issues', 'txns'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: '10px 8px', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-body)', background: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em', color: activeTab === tab ? 'var(--blue-500)' : 'var(--gray-400)', borderBottom: activeTab === tab ? '2px solid var(--blue-400)' : '2px solid transparent', border: 'none', transition: 'all 0.15s' }}>
                {tab === 'txns' ? 'Transactions' : 'Issues'}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
            {activeTab === 'issues' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {customer.issues.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: 20, color: 'var(--gray-400)', fontSize: 12 }}>✅ No issues on record</p>
                ) : customer.issues.map(issue => (
                  <div key={issue.id} style={{ padding: 10, borderRadius: 10, border: `1px solid ${issue.status === 'resolved' ? 'var(--gray-100)' : issue.severity === 'high' ? '#fca5a5' : '#fde68a'}`, background: issue.status === 'resolved' ? 'var(--gray-50)' : issue.severity === 'high' ? '#fff5f5' : '#fffbeb' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 5, lineHeight: 1.3 }}>{issue.title}</p>
                    <p style={{ fontSize: 10, color: 'var(--gray-400)', marginBottom: 7, lineHeight: 1.4 }}>{issue.description}</p>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: issue.status !== 'resolved' ? 6 : 0 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 10, background: issue.status === 'resolved' ? '#d1fae5' : issue.status === 'in_progress' ? '#fef3c7' : '#fee2e2', color: issue.status === 'resolved' ? '#065f46' : issue.status === 'in_progress' ? '#92400e' : '#991b1b' }}>
                        {issue.status === 'in_progress' ? 'IN PROGRESS' : issue.status.toUpperCase()}
                      </span>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 10, background: issue.assignedTo === 'ai_bot' ? '#dbeafe' : '#ede9fe', color: issue.assignedTo === 'ai_bot' ? '#1e40af' : '#5b21b6' }}>
                        {issue.assignedTo === 'ai_bot' ? '🤖 AI' : '👤 Human'}
                      </span>
                    </div>
                    {issue.status !== 'resolved' && (
                      <button onClick={() => resolveIssue(customerId, issue.id)} style={{ width: '100%', padding: 5, borderRadius: 6, fontSize: 10, fontWeight: 700, background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                        ✓ Mark Resolved
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'txns' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {customer.transactions.map(txn => (
                  <div key={txn.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderRadius: 8, background: '#fff', border: '1px solid var(--gray-100)' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: txn.type === 'credit' ? '#d1fae5' : txn.status === 'failed' ? '#fee2e2' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>
                      {txn.type === 'credit' ? '↓' : txn.status === 'failed' ? '✕' : '↑'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-700)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{txn.description}</p>
                      <p style={{ fontSize: 9, color: 'var(--gray-400)' }}>{new Date(txn.date).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: txn.type === 'credit' ? '#10b981' : txn.status === 'failed' ? '#ef4444' : 'var(--gray-700)' }}>
                        {txn.type === 'credit' ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
                      </p>
                      <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 8, background: txn.status === 'success' ? '#d1fae5' : txn.status === 'pending' ? '#fef3c7' : '#fee2e2', color: txn.status === 'success' ? '#065f46' : txn.status === 'pending' ? '#92400e' : '#991b1b' }}>
                        {txn.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: chat area ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f8fafc', overflow: 'hidden' }}>

          {/* Chat header */}
          <div style={{ background: '#fff', borderBottom: '1px solid var(--gray-200)', padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${customer.avatarColor}20`, border: `2px solid ${customer.avatarColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: customer.avatarColor }}>
                {customer.avatar}
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--gray-900)', lineHeight: 1.2 }}>{customer.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#25D366', display: 'inline-block' }} />
                  <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                    WhatsApp · {isHumanMode ? `👤 ${assignedAgent?.name || 'Human Agent'}` : '🤖 AI Bot'}
                    {getTriageState(customerId) && !isHumanMode && (
                      <span style={{ marginLeft: 6, padding: '1px 6px', borderRadius: 6, background: '#dbeafe', color: '#1e40af', fontSize: 9, fontWeight: 700 }}>
                        TRIAGE: {getTriageState(customerId)?.state?.replace('_', ' ').toUpperCase()}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Status toasts */}
              {waStatus && (
                <div style={{ padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: waStatus.success ? '#d1fae5' : '#fff7ed', color: waStatus.success ? '#065f46' : '#92400e', border: `1px solid ${waStatus.success ? '#6ee7b7' : '#fed7aa'}` }}>
                  📱 {waStatus.message}
                </div>
              )}
              {replyMsg && (
                <div style={{ padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: replyMsg.type === 'success' ? '#d1fae5' : replyMsg.type === 'warn' ? '#fff7ed' : '#f1f5f9', color: replyMsg.type === 'success' ? '#065f46' : replyMsg.type === 'warn' ? '#92400e' : '#475569', border: `1px solid ${replyMsg.type === 'success' ? '#6ee7b7' : replyMsg.type === 'warn' ? '#fed7aa' : '#e2e8f0'}` }}>
                  {replyMsg.text}
                </div>
              )}

              {openIssues.length > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 12, background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}>
                  {openIssues.length} Open Issue{openIssues.length > 1 ? 's' : ''}
                </span>
              )}

              {/* Fetch replies */}
              {convoActive && (
                <button onClick={() => doFetchReplies(true)} disabled={fetchingReplies} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: polling ? '#d1fae5' : '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', cursor: fetchingReplies ? 'wait' : 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: fetchingReplies ? 'spin 1s linear infinite' : 'none' }}>
                    <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/>
                  </svg>
                  {fetchingReplies ? 'Fetching…' : polling ? '● Live' : 'Fetch Replies'}
                </button>
              )}

              {/* Auto sync toggle */}
              {convoActive && (
                <button onClick={() => setPolling(p => !p)} style={{ padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: polling ? '#ede9fe' : '#f8fafc', color: polling ? '#6d28d9' : 'var(--gray-500)', border: `1px solid ${polling ? '#ddd6fe' : 'var(--gray-200)'}`, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
                  {polling ? '⏸ Stop' : '▶ Auto Sync'}
                </button>
              )}

              {/* AI ↔ Human mode toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 10, padding: '6px 12px', cursor: 'pointer' }} onClick={() => isHumanMode ? handleReleaseAgent() : setShowAgentPicker(true)}>
                <span style={{ fontSize: 11, color: 'var(--gray-600)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {isHumanMode ? '👤 Human' : '🤖 AI Bot'}
                </span>
                <div style={{ width: 34, height: 18, borderRadius: 9, background: isHumanMode ? '#8b5cf6' : '#1e5fb5', position: 'relative', transition: 'background 0.2s' }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: isHumanMode ? 18 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </div>

              {/* Simulate reply */}
              {convoActive && (
                <button onClick={handleSimulateReply} style={{ padding: '6px 11px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: '#fff', color: 'var(--gray-600)', border: '1px solid var(--gray-200)', cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
                  + Simulate Reply
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <span style={{ display: 'inline-block', padding: '5px 16px', borderRadius: 12, background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)', fontSize: 11, color: '#065f46', fontWeight: 500 }}>
                📱 WhatsApp · {customer.phone}
              </span>
            </div>

            {hasPastConvo && (
              <>
                <Separator label="Past Conversation" />
                {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
                <Separator label="Live Session" />
              </>
            )}

            {!hasPastConvo && messages.length > 0 && messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}

            {botTyping && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🤖</div>
                <div style={{ background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: '18px 18px 18px 4px', padding: '10px 16px' }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#93c5fd', animation: `pulse 1.2s ${i * 0.25}s ease-in-out infinite` }} />)}
                  </div>
                </div>
              </div>
            )}

            {/* ── Initiate bot panel ── */}
            {!hasPastConvo && messages.length === 0 && !botTyping && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px 24px', minHeight: '45%' }}>
                <div style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 20, padding: '32px 28px', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                  <div style={{ width: 68, height: 68, borderRadius: 20, background: 'linear-gradient(135deg, #dbeafe, #ede9fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, margin: '0 auto 18px' }}>🤖</div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: 'var(--gray-900)', marginBottom: 8 }}>No conversation yet</h3>
                  <p style={{ fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.6, marginBottom: 16 }}>
                    Initiate a smart triage conversation with <strong>{customer.name}</strong> via WhatsApp.
                  </p>
                  {openIssues.length > 0 && (
                    <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', marginBottom: 20, textAlign: 'left' }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Issue Context · {issueType.replace('_', ' ').toUpperCase()}</p>
                      <p style={{ fontSize: 12, color: '#78350f', fontWeight: 600, lineHeight: 1.4 }}>{openIssues[0].title}</p>
                      <p style={{ fontSize: 11, color: '#92400e', marginTop: 3, lineHeight: 1.4 }}>{openIssues[0].description}</p>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 18, justifyContent: 'center' }}>
                    <div onClick={() => isHumanMode && handleReleaseAgent()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, background: !isHumanMode ? '#dbeafe' : '#f1f5f9', border: `1px solid ${!isHumanMode ? '#bfdbfe' : '#e2e8f0'}`, cursor: 'pointer' }}>
                      <span>🤖</span><span style={{ fontSize: 12, fontWeight: 700, color: !isHumanMode ? '#1e40af' : '#94a3b8' }}>Bot First</span>
                    </div>
                    <div onClick={() => setShowAgentPicker(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, background: isHumanMode ? '#ede9fe' : '#f1f5f9', border: `1px solid ${isHumanMode ? '#ddd6fe' : '#e2e8f0'}`, cursor: 'pointer' }}>
                      <span>👤</span><span style={{ fontSize: 12, fontWeight: 700, color: isHumanMode ? '#5b21b6' : '#94a3b8' }}>Agent Direct</span>
                    </div>
                  </div>
                  <button onClick={handleInitiateBot} disabled={initiating} style={{ width: '100%', padding: '13px 20px', borderRadius: 12, fontSize: 14, fontWeight: 700, background: initiating ? '#e2e8f0' : 'linear-gradient(135deg, #1e5fb5, #7c3aed)', color: initiating ? '#94a3b8' : '#fff', border: 'none', cursor: initiating ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)', boxShadow: initiating ? 'none' : '0 4px 20px rgba(30,95,181,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {initiating ? (
                      <><div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #94a3b8', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />Sending greeting…</>
                    ) : (
                      <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>Initiate Bot Conversation</>
                    )}
                  </button>
                  <p style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 10 }}>Will send triage greeting to <strong>{customer.phone}</strong></p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Human agent banner */}
          {convoActive && !isHumanMode && (
            <div style={{ background: '#faf5ff', borderTop: '1px solid #ede9fe', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span style={{ fontSize: 12, color: '#6d28d9', fontWeight: 600 }}>👤 Human agent can take over anytime</span>
              <button onClick={() => setShowAgentPicker(true)} style={{ padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                Assign Agent
              </button>
            </div>
          )}
          {isHumanMode && assignedAgent && (
            <div style={{ background: '#f5f3ff', borderTop: '1px solid #ddd6fe', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${assignedAgent.avatarColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: assignedAgent.avatarColor }}>
                {assignedAgent.avatar}
              </div>
              <span style={{ fontSize: 12, color: '#5b21b6', fontWeight: 700 }}>👤 {assignedAgent.name} ({assignedAgent.role}) is live</span>
              <button onClick={() => setShowAgentPicker(true)} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#ede9fe', color: '#5b21b6', border: '1px solid #ddd6fe', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Switch Agent</button>
              <button onClick={handleReleaseAgent} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Return to AI Bot</button>
            </div>
          )}

          {/* Input */}
          <div style={{ background: '#fff', borderTop: '1px solid var(--gray-200)', padding: '12px 18px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>Sending as:</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: isHumanMode ? '#ede9fe' : '#dbeafe', color: isHumanMode ? '#5b21b6' : '#1e40af' }}>
                {isHumanMode ? `👤 ${assignedAgent?.name || 'Human Agent'}` : '🤖 Agently AI Bot'}
              </span>
              <span style={{ fontSize: 11, color: 'var(--gray-300)' }}>→ <strong style={{ color: 'var(--gray-500)' }}>{customer.phone}</strong></span>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <textarea
                value={inputMsg}
                onChange={e => setInputMsg(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={convoActive ? `Message as ${isHumanMode ? 'human agent' : 'AI bot'}… (Enter to send)` : 'Initiate conversation first…'}
                disabled={!convoActive}
                style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: '1.5px solid var(--gray-200)', fontSize: 13.5, fontFamily: 'var(--font-body)', resize: 'none', minHeight: 44, maxHeight: 120, outline: 'none', color: 'var(--gray-800)', background: convoActive ? 'var(--gray-50)' : '#f1f5f9', lineHeight: 1.5 }}
                rows={1}
              />
              <button onClick={handleSend} disabled={!inputMsg.trim() || sending || !convoActive} style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: inputMsg.trim() && convoActive ? 'linear-gradient(135deg, #1e5fb5, #2979d8)' : 'var(--gray-200)', color: inputMsg.trim() && convoActive ? '#fff' : 'var(--gray-400)', border: 'none', cursor: inputMsg.trim() && convoActive ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
            <p style={{ fontSize: 10, color: 'var(--gray-300)', marginTop: 6, textAlign: 'center' }}>
              📱 Whapi.Cloud · {polling ? <span style={{ color: '#15803d', fontWeight: 600 }}>● Auto-syncing every 12s</span> : 'Click "Fetch Replies" to pull customer messages'}
            </p>
          </div>
        </div>
      </div>
    </>
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
