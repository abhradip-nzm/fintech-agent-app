import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/Sidebar';
import { useApp } from '../../../context/AppContext';
import { sendWhatsAppMessage, formatBotMessage, formatAgentTakeover, fetchIncomingMessages } from '../../../utils/whatsapp';
import { processTriageMessage, getTriageOpener, getCustomerIssueType } from '../../../utils/triage';
import { SUPPORTED_LANGUAGES } from '../../../utils/languages';
import { playMessageTone, playAssignTone } from '../../../utils/sounds';
import { STATUS_META } from '../../../data/agentsData';
import { readIVRConfig } from '../../../utils/storage';

// ─── Message bubble ───────────────────────────────────────────────────────────
const MessageBubble = ({ msg, onTranslate, translated, translating }) => {
  const isBot      = msg.sender === 'ai_bot';
  const isHuman    = msg.sender === 'human_agent';
  const isCustomer = msg.sender === 'customer';
  const nonEng     = /[^\x00-\x7F]/.test(msg.message);

  const TranslateBtn = () => nonEng && !translated ? (
    <button
      onClick={() => onTranslate && onTranslate(`w_${msg.id}`, msg.message)}
      disabled={translating}
      style={{ fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 8,
        background: translating ? '#f3f4f6' : '#ede9fe', color: translating ? '#9ca3af' : '#6d28d9',
        border: '1px solid #ddd6fe', cursor: translating ? 'wait' : 'pointer',
        fontFamily: 'var(--font-body)', marginTop: 3, display: 'inline-block' }}>
      {translating ? '…' : '🌐 Translate'}
    </button>
  ) : null;

  if (isCustomer) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12, gap: 8, alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, maxWidth: '72%' }}>
          <div style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', color: '#fff', padding: '10px 14px', borderRadius: '18px 18px 4px 18px', fontSize: 13.5, lineHeight: 1.55 }}>
            <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{msg.message}</p>
            {translated && <p style={{ margin: '6px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.85)', borderTop: '1px dashed rgba(255,255,255,0.3)', paddingTop: 5, fontStyle: 'italic' }}>🌐 {translated}</p>}
          </div>
          <TranslateBtn />
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
          {translated && <p style={{ margin: '6px 0 0', fontSize: 11, color: '#6d28d9', borderTop: '1px dashed #ddd6fe', paddingTop: 5, fontStyle: 'italic' }}>🌐 {translated}</p>}
        </div>
        <TranslateBtn />
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

  // ── IVR state ─────────────────────────────────────────────────────────────
  const [ivrCallSid,       setIvrCallSid]       = useState(null);
  const [ivrStatus,        setIvrStatus]        = useState(null); // null | 'initiating' | 'in-progress' | 'completed' | 'failed'
  const [ivrTranscript,    setIvrTranscript]    = useState([]);
  const [ivrProvider,      setIvrProvider]      = useState('');
  const [showIvrPanel,     setShowIvrPanel]     = useState(false);
  const [ivrError,         setIvrError]         = useState(null);
  const [translatedMap,    setTranslatedMap]     = useState({});  // key → translated text
  const translatedMapRef = useRef({});  // always-current mirror for download closure
  const [translatingKey,   setTranslatingKey]    = useState(null);
  const [ivrHistory,       setIvrHistory]        = useState([]);  // frozen past IVR sessions
  const [initMode,         setInitMode]         = useState('bot'); // 'bot'|'ivr'|'human' — used in empty panel
  const ivrPollRef = useRef(null);

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
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, botTyping, ivrTranscript]);

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

  useEffect(() => () => clearInterval(pollIntervalRef.current), []);

  // ── Triage: auto reply to customer message ───────────────────────────────────
  const triggerTriageReply = useCallback((customerMsg) => {
    const triageState = getTriageState(customerId);
    if (!triageState) return;
    if (triageState.state === 'terminal') return;

    setBotTyping(true);
    setTimeout(() => {
      setBotTyping(false);
      const currentLang = triageState.language || 'en';
      const result = processTriageMessage(triageState.issueType, triageState.state, customerMsg, { phone: customer?.phone }, currentLang);
      if (result.message) {
        sendMessage(customerId, result.message, 'ai_bot', 'Agently AI');
        // Deliver to WhatsApp (best effort)
        const ph = '+' + (customer?.phone || '').replace(/\D/g, '');
        sendWhatsAppMessage(ph, formatBotMessage(result.message)).catch(() => {});
      }
      setTriageState(customerId, {
        issueType: triageState.issueType,
        state: result.nextState,
        language: result.lang !== undefined ? result.lang : currentLang,
      });
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

  // ── Auto-poll (must be after doFetchReplies to avoid TDZ) ───────────────────
  useEffect(() => {
    if (polling && customer) {
      pollIntervalRef.current = setInterval(() => doFetchReplies(false), 12000);
    }
    return () => clearInterval(pollIntervalRef.current);
  }, [polling, customer, doFetchReplies]); // eslint-disable-line

  // ── Initiate bot conversation ────────────────────────────────────────────────
  const handleInitiateBot = async () => {
    if (!customer || initiating) return;
    setInitiating(true);
    const { message, nextState } = getTriageOpener();

    setBotTyping(true);
    await new Promise(r => setTimeout(r, 1800));
    setBotTyping(false);

    sendMessage(customerId, message, 'ai_bot', 'Agently AI');
    setTriageState(customerId, { issueType, state: nextState, language: null });
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
        const currentLang = triageState.language || 'en';
        setBotTyping(true);
        setTimeout(() => {
          setBotTyping(false);
          const result = processTriageMessage(triageState.issueType, triageState.state, msg, { phone: customer?.phone }, currentLang);
          sendMessage(customerId, result.message, 'ai_bot', 'Agently AI');
          setTriageState(customerId, {
            issueType: triageState.issueType,
            state: result.nextState,
            language: result.lang !== undefined ? result.lang : currentLang,
          });
        }, 1600);
      }
    }
  };

  // ── Agent assignment ─────────────────────────────────────────────────────────
  const handleAssignAgent = (agentId) => {
    assignAgent(customerId, agentId);
    setShowAgentPicker(false);
    playAssignTone();
    setPolling(true); // ensure customer replies auto-sync in human mode
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
    // Always restart bot with a fresh greeting so the triage flow begins cleanly
    handleInitiateBot();
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

  // ── IVR: poll transcript ─────────────────────────────────────────────────────
  const pollIVRTranscript = useCallback(async (callSid) => {
    try {
      const res = await fetch(`/.netlify/functions/call-transcript?callSid=${callSid}`);
      if (!res.ok) return;
      const data = await res.json();
      setIvrTranscript(data.entries || []);
      setIvrStatus(data.status || 'in-progress');
      if (data.status === 'completed' || data.status === 'failed') {
        clearInterval(ivrPollRef.current);
      }
    } catch (_) {}
  }, []);

  useEffect(() => () => clearInterval(ivrPollRef.current), []);

  // ── IVR: initiate outbound call ──────────────────────────────────────────────
  const handleInitiateIVR = useCallback(async () => {
    if (!customer) return;
    const cfg = readIVRConfig();
    const provider = cfg.activeProvider || 'twilio';
    const providerCfg = provider === 'twilio' ? cfg.twilio : cfg.exotel;
    setIvrError(null);
    setIvrStatus('initiating');
    setIvrTranscript([]);
    setIvrProvider(provider);
    try {
      const res = await fetch('/.netlify/functions/initiate-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          customerPhone: customer.phone,
          customerId,
          config: providerCfg,
          geminiKey: cfg.geminiKey,
          baseUrl: window.location.origin,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to initiate call');
      setIvrCallSid(data.callSid);
      setIvrStatus('in-progress');
      addNotification({ type: 'bot_initiated', customerId, customerName: customer.name, message: `IVR call initiated to ${customer.name} via ${provider}` });
      ivrPollRef.current = setInterval(() => pollIVRTranscript(data.callSid), 3000);
    } catch (err) {
      setIvrError(err.message || 'Call initiation failed');
      setIvrStatus('failed');
    }
  }, [customer, customerId, addNotification, pollIVRTranscript]);

  // ── IVR: transfer to WhatsApp ────────────────────────────────────────────────
  const handleTransferToWhatsApp = useCallback(() => {
    const lastBotEntry = [...ivrTranscript].reverse().find(e => e.speaker === 'bot');
    const summary = lastBotEntry
      ? `📞 *IVR Call Summary*\n\nYour issue has been noted. ${lastBotEntry.text}\n\nOur team will continue here on WhatsApp.`
      : '📞 *IVR Call Summary*\n\nThank you for calling. Our team will continue supporting you via WhatsApp.';
    sendMessage(customerId, summary, 'ai_bot', 'Agently AI');
    const ph = '+' + (customer?.phone || '').replace(/\D/g, '');
    sendWhatsAppMessage(ph, formatBotMessage(summary)).catch(() => {});
    setShowIvrPanel(false);
    addNotification({ type: 'bot_initiated', customerId, customerName: customer.name, message: 'IVR call transferred to WhatsApp chat' });
  }, [ivrTranscript, customerId, customer, sendMessage, addNotification]);

  // ── Unified translate (IVR entries, WhatsApp messages) ──────────────────────
  const handleTranslate = useCallback(async (key, text) => {
    setTranslatingKey(key);
    try {
      // Detect script to pick a valid MyMemory source language
      const detectLang = (t) => {
        if (/[\u0900-\u097F]/.test(t)) return 'hi';   // Devanagari (Hindi)
        if (/[\u0980-\u09FF]/.test(t)) return 'bn';   // Bengali
        if (/[\u0B80-\u0BFF]/.test(t)) return 'ta';   // Tamil
        if (/[\u0C00-\u0C7F]/.test(t)) return 'te';   // Telugu
        if (/[\u0600-\u06FF]/.test(t)) return 'ar';   // Arabic
        if (/[\u4E00-\u9FFF]/.test(t)) return 'zh-CN';// Chinese
        if (/[\u3040-\u30FF]/.test(t)) return 'ja';   // Japanese
        if (/[\uAC00-\uD7AF]/.test(t)) return 'ko';   // Korean
        return 'hi'; // default for this app
      };
      const srcLang = detectLang(text);
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${srcLang}|en`
      );
      const data = await res.json();
      const translated = data.responseData?.translatedText || '(translation unavailable)';
      setTranslatedMap(p => { const n = { ...p, [key]: translated }; translatedMapRef.current = n; return n; });
    } catch { setTranslatedMap(p => { const n = { ...p, [key]: '(translation failed)' }; translatedMapRef.current = n; return n; }); }
    finally { setTranslatingKey(null); }
  }, []);

  // ── Download full chat history ───────────────────────────────────────────────
  const [downloading, setDownloading] = useState(false);

  const handleDownloadHistory = useCallback(async () => {
    if (!customer) return;
    setDownloading(true);

    // Fetch the latest IVR transcript fresh from server (stale state may be empty)
    let freshIvrEntries = ivrTranscript;
    let freshIvrStatus  = ivrStatus;
    const sidToFetch    = ivrCallSid;
    if (sidToFetch) {
      try {
        const res  = await fetch(`/.netlify/functions/call-transcript?callSid=${sidToFetch}`);
        if (res.ok) {
          const data  = await res.json();
          freshIvrEntries = data.entries  || freshIvrEntries;
          freshIvrStatus  = data.status   || freshIvrStatus;
        }
      } catch (_) {}
    }

    const hr  = '─'.repeat(60);
    const now = new Date().toLocaleString('en-IN');

    // ── Header ──
    let txt = '';
    txt += '╔' + '═'.repeat(62) + '╗\n';
    txt += '║  AGENTLY AI — COMPLETE CHAT HISTORY' + ' '.repeat(26) + '║\n';
    txt += '╚' + '═'.repeat(62) + '╝\n\n';

    // ── Customer Profile ──
    txt += `CUSTOMER PROFILE\n${hr}\n`;
    txt += `Name          : ${customer.name}\n`;
    txt += `Phone         : ${customer.phone}\n`;
    txt += `Account No    : ${customer.accountNumber || '—'}\n`;
    txt += `Balance       : ₹${(customer.balance || 0).toLocaleString('en-IN')}\n`;
    txt += `KYC Status    : ${customer.kycStatus || '—'}\n`;
    txt += `Tier          : ${customer.tier || '—'}\n`;
    txt += `Member Since  : ${customer.joinDate ? new Date(customer.joinDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' }) : '—'}\n\n`;

    // ── Issues ──
    if (customer.issues?.length > 0) {
      txt += `ISSUES (${customer.issues.length} total, ${openIssues.length} open)\n${hr}\n`;
      customer.issues.forEach(issue => {
        const sev    = issue.severity?.toUpperCase() || 'NORMAL';
        const status = issue.status?.toUpperCase().replace('_', ' ') || '';
        txt += `[${sev}] ${issue.title} — ${status}\n`;
        txt += `  ${issue.description || ''}\n\n`;
      });
    }

    // ── WhatsApp Conversation ──
    if (messages.length > 0) {
      txt += `WHATSAPP CONVERSATION (${messages.length} messages)\n${hr}\n`;
      messages.forEach(m => {
        const t   = new Date(m.timestamp).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        const who = m.sender === 'customer'
          ? customer.name
          : m.sender === 'ai_bot'
            ? 'Agently AI Bot'
            : (m.senderName || 'Human Agent');
        txt += `[${t}] ${who}:\n${m.message}\n`;
        const tkMsg = translatedMapRef.current[`w_${m.id}`];
        if (tkMsg) txt += `  [Translated EN] ${tkMsg}\n`;
        txt += '\n';
      });
    } else {
      txt += `WHATSAPP CONVERSATION\n${hr}\n(No WhatsApp messages recorded)\n\n`;
    }

    // ── IVR History (past sessions that were transitioned away from) ──
    ivrHistory.forEach((session, si) => {
      const providerLabel = session.provider ? session.provider.toUpperCase() : 'IVR';
      txt += `IVR VOICE CALL (Session ${si + 1}) — ${providerLabel}\n${hr}\n`;
      if (session.callSid) txt += `Call ID       : ${session.callSid}\n`;
      txt += `Status        : ${session.status || 'unknown'}\n`;
      if (session.entries?.[0]?.timestamp)
        txt += `Started       : ${new Date(session.entries[0].timestamp).toLocaleString('en-IN')}\n`;
      txt += '\n';
      (session.entries || []).filter(e => e.speaker !== 'system').forEach((e, ei) => {
        const t   = e.timestamp ? new Date(e.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : '--:--';
        const who = e.speaker === 'bot' ? 'IVR Bot' : customer.name;
        txt += `[${t}] ${who}:\n  ${e.text}\n`;
        const tkHistory = translatedMapRef.current[`h${si}_${ei}`];
        if (tkHistory) txt += `  [Translated EN] ${tkHistory}\n`;
        txt += '\n';
      });
    });

    // ── IVR Voice Call (active/current session) ──
    if (freshIvrEntries.length > 0 || sidToFetch) {
      const providerLabel = ivrProvider ? ivrProvider.toUpperCase() : 'IVR';
      txt += `IVR VOICE CALL — ${providerLabel}\n${hr}\n`;
      if (sidToFetch)    txt += `Call ID       : ${sidToFetch}\n`;
      if (freshIvrStatus) txt += `Status        : ${freshIvrStatus}\n`;
      if (freshIvrEntries[0]?.timestamp)
        txt += `Started       : ${new Date(freshIvrEntries[0].timestamp).toLocaleString('en-IN')}\n`;
      txt += '\n';

      if (freshIvrEntries.length === 0) {
        txt += '(No transcript entries available)\n\n';
      } else {
        freshIvrEntries.forEach((e, idx) => {
          const t   = e.timestamp ? new Date(e.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : '--:--';
          const who = e.speaker === 'bot' ? 'IVR Bot' : e.speaker === 'customer' ? customer.name : 'System';
          txt += `[${t}] ${who}:\n  ${e.text}\n`;
          const tkActive = translatedMapRef.current[`a_${idx}`];
          if (tkActive) txt += `  [Translated EN] ${tkActive}\n`;
          txt += '\n';
        });
      }
    }

    // ── Footer ──
    txt += `${hr}\nDownloaded via Agently AI Platform · ${now}\n`;

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `chat-${customer.name.replace(/\s+/g, '-')}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloading(false);
  }, [customer, messages, ivrHistory, ivrTranscript, ivrProvider, ivrStatus, ivrCallSid, openIssues]);

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

      {/* IVR error toast */}
      {ivrError && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 1200, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', maxWidth: 360 }}>
          <span>⚠️</span>
          <p style={{ fontSize: 12, color: '#dc2626', fontWeight: 600, flex: 1 }}>{ivrError}</p>
          <button onClick={() => setIvrError(null)} style={{ width: 20, height: 20, background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 14, lineHeight: 1 }}>✕</button>
        </div>
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
                    {(() => {
                      const ts = getTriageState(customerId);
                      const lang = ts?.language;
                      if (!lang || isHumanMode) return null;
                      const langMeta = SUPPORTED_LANGUAGES.find(l => l.code === lang);
                      if (!langMeta) return null;
                      return (
                        <span style={{ marginLeft: 5, padding: '1px 6px', borderRadius: 6, background: '#f0fdf4', color: '#166534', fontSize: 9, fontWeight: 700, border: '1px solid #bbf7d0' }}>
                          {langMeta.emoji} {langMeta.native}
                        </span>
                      );
                    })()}
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

              {/* Download chat history */}
              <button onClick={handleDownloadHistory} disabled={downloading} title="Download full chat history" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: downloading ? '#f1f5f9' : '#fff', color: downloading ? 'var(--gray-400)' : 'var(--gray-600)', border: '1px solid var(--gray-200)', cursor: downloading ? 'wait' : 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
                {downloading ? '⏳ Preparing…' : '⬇ Download'}
              </button>

              {/* IVR Call button */}
              <button
                onClick={handleInitiateIVR}
                disabled={ivrStatus === 'initiating' || ivrStatus === 'in-progress'}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: (ivrStatus === 'initiating' || ivrStatus === 'in-progress') ? '#fef3c7' : 'linear-gradient(135deg, #dc2626, #b91c1c)', color: (ivrStatus === 'initiating' || ivrStatus === 'in-progress') ? '#92400e' : '#fff', border: 'none', cursor: (ivrStatus === 'initiating' || ivrStatus === 'in-progress') ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', boxShadow: (ivrStatus === 'initiating' || ivrStatus === 'in-progress') ? 'none' : '0 2px 8px rgba(220,38,38,0.3)' }}>
                📞 {ivrStatus === 'initiating' ? 'Calling…' : ivrStatus === 'in-progress' ? 'In Call' : 'IVR Call'}
              </button>

            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <span style={{ display: 'inline-block', padding: '5px 16px', borderRadius: 12, background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)', fontSize: 11, color: '#065f46', fontWeight: 500 }}>
                📱 WhatsApp · {customer.phone}
              </span>
            </div>

            {/* IVR history sessions (past calls that were transitioned away from) */}
            {ivrHistory.map((session, si) => (
              <div key={session.callSid || si}>
                <Separator label={`📞 IVR Call · ${(session.provider || 'IVR').toUpperCase()} · ${session.status === 'completed' ? '✓ Completed' : session.status === 'failed' ? '✕ Failed' : session.status || ''}`} />
                {session.entries.filter(e => e.speaker !== 'system').map((entry, ei) => {
                  const histKey    = `h${si}_${ei}`;
                  const isBot      = entry.speaker === 'bot';
                  const histTrans  = translatedMap[histKey];
                  const histTling  = translatingKey === histKey;
                  const histNonEng = /[^\x00-\x7F]/.test(entry.text);
                  return (
                    <div key={ei} style={{ display: 'flex', flexDirection: isBot ? 'row' : 'row-reverse', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: isBot ? '#fee2e2' : '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0, marginTop: 2 }}>
                        {isBot ? '📞' : '🎙️'}
                      </div>
                      <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', gap: 3, alignItems: isBot ? 'flex-start' : 'flex-end' }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: isBot ? '#b91c1c' : '#15803d' }}>{isBot ? 'IVR Bot' : customer.name}</span>
                        <div style={{ background: isBot ? '#fff1f2' : '#f0fdf4', border: `1px solid ${isBot ? '#fecaca' : '#bbf7d0'}`, borderRadius: isBot ? '16px 16px 16px 4px' : '16px 16px 4px 16px', padding: '8px 12px', fontSize: 13, color: 'var(--gray-800)', lineHeight: 1.5 }}>
                          <p style={{ margin: 0 }}>{entry.text}</p>
                          {histTrans && <p style={{ margin: '6px 0 0', fontSize: 11, color: '#6d28d9', borderTop: '1px dashed #ddd6fe', paddingTop: 5, fontStyle: 'italic' }}>🌐 {histTrans}</p>}
                        </div>
                        {histNonEng && !histTrans && (
                          <button onClick={() => handleTranslate(histKey, entry.text)} disabled={histTling}
                            style={{ fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 8, background: histTling ? '#f3f4f6' : '#ede9fe', color: histTling ? '#9ca3af' : '#6d28d9', border: '1px solid #ddd6fe', cursor: histTling ? 'wait' : 'pointer', fontFamily: 'var(--font-body)' }}>
                            {histTling ? '…' : '🌐 Translate'}
                          </button>
                        )}
                        <span style={{ fontSize: 9, color: 'var(--gray-400)' }}>{entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                      </div>
                    </div>
                  );
                })}
                <Separator label={`— IVR Call Ended —`} />
              </div>
            ))}

            {hasPastConvo && (
              <>
                <Separator label="Conversation" />
                {messages.map(msg => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    onTranslate={handleTranslate}
                    translated={translatedMap[`w_${msg.id}`]}
                    translating={translatingKey === `w_${msg.id}`}
                  />
                ))}
              </>
            )}

            {!hasPastConvo && messages.length > 0 && messages.map(msg => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                onTranslate={handleTranslate}
                translated={translatedMap[`w_${msg.id}`]}
                translating={translatingKey === `w_${msg.id}`}
              />
            ))}

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
            {!hasPastConvo && messages.length === 0 && !botTyping && !ivrCallSid && (
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
                  {/* 3-mode selector */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 16, justifyContent: 'center' }}>
                    {[
                      { key: 'bot',   icon: '🤖', label: 'AI Bot',      color: '#1e40af', bg: '#dbeafe', border: '#bfdbfe' },
                      { key: 'ivr',   icon: '📞', label: 'IVR Call',    color: '#b91c1c', bg: '#fee2e2', border: '#fca5a5' },
                      { key: 'human', icon: '👤', label: 'Human Agent', color: '#5b21b6', bg: '#ede9fe', border: '#ddd6fe' },
                    ].map(opt => (
                      <div key={opt.key}
                        onClick={() => setInitMode(opt.key)}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                          background: initMode === opt.key ? opt.bg : '#f1f5f9',
                          border: `1.5px solid ${initMode === opt.key ? opt.border : '#e2e8f0'}` }}>
                        <span style={{ fontSize: 13 }}>{opt.icon}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: initMode === opt.key ? opt.color : '#94a3b8' }}>{opt.label}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={initMode === 'ivr' ? handleInitiateIVR : initMode === 'human' ? () => setShowAgentPicker(true) : handleInitiateBot}
                    disabled={initiating || (initMode === 'ivr' && (ivrStatus === 'initiating' || ivrStatus === 'in-progress'))}
                    style={{ width: '100%', padding: '13px 20px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                      background: initiating ? '#e2e8f0' : initMode === 'ivr' ? 'linear-gradient(135deg,#dc2626,#b91c1c)' : initMode === 'human' ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'linear-gradient(135deg,#1e5fb5,#7c3aed)',
                      color: initiating ? '#94a3b8' : '#fff', border: 'none', cursor: initiating ? 'not-allowed' : 'pointer',
                      fontFamily: 'var(--font-body)', boxShadow: initiating ? 'none' : '0 4px 20px rgba(30,95,181,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {initiating ? (
                      <><div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #94a3b8', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />Starting…</>
                    ) : initMode === 'ivr' ? (
                      <>📞 {ivrStatus === 'in-progress' ? 'Call In Progress' : 'Start IVR Call'}</>
                    ) : initMode === 'human' ? (
                      <>👤 Assign Human Agent</>
                    ) : (
                      <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>Initiate Bot Conversation</>
                    )}
                  </button>
                  <p style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 10 }}>
                    {initMode === 'ivr' ? <>Will call <strong>{customer.phone}</strong> via {readIVRConfig().activeProvider}</> : <>Will send triage greeting to <strong>{customer.phone}</strong></>}
                  </p>
                </div>
              </div>
            )}
            {/* ── Inline IVR Transcript ── */}
            {ivrCallSid && (
              <div style={{ marginTop: 16 }}>
                {/* IVR session header */}
                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20, background: 'linear-gradient(135deg,#dc262620,#b91c1c10)', border: '1px solid #fca5a5', fontSize: 11, fontWeight: 700, color: '#b91c1c' }}>
                    📞 IVR Voice Call · {ivrProvider === 'twilio' ? 'Twilio' : 'Exotel'} · {customer.phone}
                    <span style={{ padding: '1px 8px', borderRadius: 10, background: ivrStatus === 'in-progress' ? '#dcfce7' : ivrStatus === 'completed' ? '#d1fae5' : ivrStatus === 'failed' ? '#fee2e2' : '#fef3c7', color: ivrStatus === 'in-progress' ? '#15803d' : ivrStatus === 'completed' ? '#065f46' : ivrStatus === 'failed' ? '#dc2626' : '#92400e', fontSize: 9, fontWeight: 800 }}>
                      {ivrStatus === 'in-progress' ? '● LIVE' : ivrStatus === 'completed' ? '✓ ENDED' : ivrStatus === 'failed' ? '✕ FAILED' : ivrStatus?.toUpperCase() || 'CONNECTING'}
                    </span>
                  </span>
                </div>

                {/* Transcript entries */}
                {ivrTranscript.length === 0 && (ivrStatus === 'initiating' || ivrStatus === 'in-progress') && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '24px 0' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #fecaca', borderTopColor: '#dc2626', animation: 'spin 0.8s linear infinite' }} />
                    <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>Connecting call…</p>
                  </div>
                )}

                {ivrTranscript.map((entry, idx) => {
                  const isBot         = entry.speaker === 'bot';
                  const isCust        = entry.speaker === 'customer';
                  const isSystem      = entry.speaker === 'system';
                  const nonEng        = /[^\x00-\x7F]/.test(entry.text);
                  const activeKey     = `a_${idx}`;
                  const translated    = translatedMap[activeKey];
                  const isTranslating = translatingKey === activeKey;

                  if (isSystem) return (
                    <div key={idx} style={{ textAlign: 'center', margin: '6px 0' }}>
                      <span style={{ display: 'inline-block', padding: '3px 14px', borderRadius: 20, background: '#f1f5f9', color: 'var(--gray-400)', fontSize: 10, fontWeight: 600 }}>{entry.text}</span>
                    </div>
                  );

                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: isCust ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: isBot ? '#fee2e2' : '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0, marginTop: 2 }}>
                        {isBot ? '📞' : '🎙️'}
                      </div>
                      <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', gap: 3, alignItems: isCust ? 'flex-end' : 'flex-start' }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: isBot ? '#b91c1c' : '#15803d', marginLeft: isCust ? 0 : 2 }}>
                          {isBot ? 'IVR Bot' : customer.name}
                        </span>
                        <div style={{ background: isBot ? '#fff1f2' : '#f0fdf4', border: `1px solid ${isBot ? '#fecaca' : '#bbf7d0'}`, borderRadius: isBot ? '16px 16px 16px 4px' : '16px 16px 4px 16px', padding: '8px 12px', fontSize: 13, color: 'var(--gray-800)', lineHeight: 1.5 }}>
                          <p style={{ margin: 0 }}>{entry.text}</p>
                          {translated && (
                            <p style={{ margin: '6px 0 0', fontSize: 11, color: '#6d28d9', borderTop: '1px dashed #ddd6fe', paddingTop: 5, fontStyle: 'italic' }}>
                              🌐 {translated}
                            </p>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: isCust ? 0 : 2 }}>
                          <span style={{ fontSize: 9, color: 'var(--gray-400)' }}>
                            {entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                          {nonEng && !translated && (
                            <button onClick={() => handleTranslate(activeKey, entry.text)} disabled={isTranslating} style={{ fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 8, background: isTranslating ? '#f3f4f6' : '#ede9fe', color: isTranslating ? '#9ca3af' : '#6d28d9', border: '1px solid #ddd6fe', cursor: isTranslating ? 'wait' : 'pointer', fontFamily: 'var(--font-body)' }}>
                              {isTranslating ? '…' : '🌐 Translate'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Live spinner for in-progress after some entries */}
                {ivrStatus === 'in-progress' && ivrTranscript.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '4px 0 8px 34px' }}>
                    {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#fca5a5', animation: `pulse 1.2s ${i * 0.25}s ease-in-out infinite` }} />)}
                    <span style={{ fontSize: 10, color: 'var(--gray-400)' }}>Listening…</span>
                  </div>
                )}

                {/* Post-call actions */}
                {(ivrStatus === 'completed' || ivrStatus === 'failed') && (
                  <div style={{ marginTop: 16, marginBottom: 8 }}>
                    <div style={{ textAlign: 'center', marginBottom: 10 }}>
                      <span style={{ display: 'inline-block', padding: '4px 16px', borderRadius: 20, background: ivrStatus === 'completed' ? '#d1fae5' : '#fee2e2', color: ivrStatus === 'completed' ? '#065f46' : '#dc2626', fontSize: 11, fontWeight: 700 }}>
                        {ivrStatus === 'completed' ? '✓ IVR Call Ended' : '✕ Call Failed'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button onClick={() => { setIvrCallSid(null); setIvrTranscript([]); setIvrStatus(null); setIvrError(null); handleInitiateIVR(); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700, background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', boxShadow: '0 2px 8px rgba(220,38,38,0.3)' }}>
                        📞 IVR Again
                      </button>
                      <button onClick={() => {
                          if (ivrTranscript.length > 0) setIvrHistory(prev => [...prev, { callSid: ivrCallSid, provider: ivrProvider, status: ivrStatus, entries: ivrTranscript }]);
                          setIvrCallSid(null); setIvrTranscript([]); setIvrStatus(null); setIvrError(null);
                          handleInitiateBot();
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700, background: 'linear-gradient(135deg,#1e5fb5,#2979d8)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', boxShadow: '0 2px 8px rgba(30,95,181,0.3)' }}>
                        🤖 AI Bot Chat
                      </button>
                      <button onClick={() => {
                          if (ivrTranscript.length > 0) setIvrHistory(prev => [...prev, { callSid: ivrCallSid, provider: ivrProvider, status: ivrStatus, entries: ivrTranscript }]);
                          setIvrCallSid(null); setIvrTranscript([]); setIvrStatus(null); setIvrError(null);
                          setShowAgentPicker(true);
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', boxShadow: '0 2px 8px rgba(124,58,237,0.3)' }}>
                        👤 Human Agent
                      </button>
                    </div>
                    {ivrTranscript.length > 0 && (
                      <div style={{ textAlign: 'center', marginTop: 10 }}>
                        <button onClick={handleDownloadHistory} disabled={downloading} style={{ fontSize: 11, fontWeight: 600, padding: '5px 14px', borderRadius: 8, background: downloading ? '#f1f5f9' : '#f8fafc', color: downloading ? 'var(--gray-400)' : 'var(--gray-600)', border: '1px solid var(--gray-200)', cursor: downloading ? 'wait' : 'pointer', fontFamily: 'var(--font-body)' }}>
                          {downloading ? '⏳ Preparing…' : '⬇ Download Full Transcript'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
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
