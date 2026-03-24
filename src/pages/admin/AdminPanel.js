import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  readAgents, writeAgents,
  getApiKey, setApiKey, getBinId, isCloudConnected, clearCloudConfig,
} from '../../utils/storage';

// ─── Icon library (shared with homepage cards) ────────────────────────────────
const ICON_DEFS = {
  onboarding: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <polyline points="16 11 18 13 22 9"/>
    </svg>
  ),
  chat: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  analytics: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  payment: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  security: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  document: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  robot: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="11" width="18" height="10" rx="2"/>
      <circle cx="12" cy="5" r="2"/><line x1="12" y1="7" x2="12" y2="11"/>
      <circle cx="8" cy="16" r="1" fill="currentColor"/><circle cx="16" cy="16" r="1" fill="currentColor"/>
    </svg>
  ),
  search: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
};

const ACCENT_OPTIONS = [
  { value: 'blue',   label: 'Blue',   color: '#1e5fb5' },
  { value: 'cyan',   label: 'Cyan',   color: '#00c6ff' },
  { value: 'purple', label: 'Purple', color: '#7c3aed' },
  { value: 'green',  label: 'Green',  color: '#059669' },
  { value: 'orange', label: 'Orange', color: '#d97706' },
];

const EMPTY_FORM = {
  agentNumber: '',
  title: '',
  subtitle: '',
  featuresText: '',
  metricValue: '',
  metricLabel: '',
  iconType: 'robot',
  isInternal: false,
  appUrl: '',
  internalPath: '',
  accentColor: 'blue',
};

// ─── Agently Logo SVG (rounded-square app icon · rising trend path) ───────────
const AgentlyLogo = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 42 42" fill="none">
    <defs>
      <linearGradient id="adminLogoGrad" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#4f7cf7"/><stop offset="100%" stopColor="#7c3aed"/>
      </linearGradient>
      <linearGradient id="adminLogoShine" x1="0" y1="0" x2="0" y2="21" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="rgba(255,255,255,0.22)"/>
        <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
      </linearGradient>
    </defs>
    <rect width="42" height="42" rx="11" fill="url(#adminLogoGrad)"/>
    <rect width="42" height="21" rx="10" fill="url(#adminLogoShine)"/>
    <path d="M 10 31 C 14 26 17 23 21 19 C 25 15 28 13 32 10"
      stroke="rgba(255,255,255,0.93)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <circle cx="10" cy="31" r="3.1" fill="white" opacity="0.9"/>
    <circle cx="21" cy="19" r="3.1" fill="white" opacity="0.9"/>
    <circle cx="32" cy="10" r="3.1" fill="white" opacity="0.9"/>
  </svg>
);

// ─── Shared input styles ──────────────────────────────────────────────────────
const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: '8px',
  border: '1.5px solid #e2e8f0', fontSize: '13px',
  fontFamily: 'Inter, sans-serif', outline: 'none',
  background: '#fafafa', color: '#1e293b', boxSizing: 'border-box',
};
const labelStyle = {
  fontSize: '10px', fontWeight: 700, color: '#64748b',
  textTransform: 'uppercase', letterSpacing: '0.07em',
  marginBottom: '5px', display: 'block',
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminPanel = () => {
  const navigate = useNavigate();
  const [agents, setAgents]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [editingId, setEditingId]     = useState(null);      // null = create new
  const [form, setForm]               = useState(EMPTY_FORM);
  const [saving, setSaving]           = useState(false);
  const [saveMsg, setSaveMsg]         = useState(null);      // { type, text }
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showCloud, setShowCloud]     = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [cloudStatus, setCloudStatus] = useState(null);     // null|'saving'|'connected'|'error'

  const connected = isCloudConnected();

  useEffect(() => {
    readAgents().then(a => { setAgents(a); setLoading(false); });
    setApiKeyInput(getApiKey());
  }, []);

  const set = useCallback((field, value) => setForm(f => ({ ...f, [field]: value })), []);

  const selectAgent = (agent) => {
    setEditingId(agent.id);
    setForm({
      agentNumber:  agent.agentNumber  || '',
      title:        agent.title        || '',
      subtitle:     agent.subtitle     || '',
      featuresText: (agent.features || []).join('\n'),
      metricValue:  agent.metricValue  || '',
      metricLabel:  agent.metricLabel  || '',
      iconType:     agent.iconType     || 'robot',
      isInternal:   agent.isInternal   || false,
      appUrl:       agent.appUrl       || '',
      internalPath: agent.internalPath || '',
      accentColor:  agent.accentColor  || 'blue',
    });
    setSaveMsg(null);
  };

  const startNew = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, agentNumber: String(agents.length + 1).padStart(2, '0') });
    setSaveMsg(null);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setSaveMsg({ type: 'error', text: 'Title is required.' });
      return;
    }
    setSaving(true);
    const features = form.featuresText.split('\n').map(f => f.trim()).filter(Boolean);
    const agentObj = {
      id:           editingId || `agent_${Date.now()}`,
      agentNumber:  form.agentNumber  || String(agents.length + 1).padStart(2, '0'),
      title:        form.title.trim(),
      subtitle:     form.subtitle.trim(),
      features,
      metricValue:  form.metricValue.trim(),
      metricLabel:  form.metricLabel.trim(),
      iconType:     form.iconType,
      isInternal:   form.isInternal,
      appUrl:       form.appUrl.trim(),
      internalPath: form.internalPath.trim(),
      accentColor:  form.accentColor,
    };
    const updated = editingId
      ? agents.map(a => a.id === editingId ? agentObj : a)
      : [...agents, agentObj];

    const result = await writeAgents(updated);
    setAgents(updated);
    if (!editingId) setEditingId(agentObj.id);
    setSaving(false);
    setSaveMsg(result.success
      ? { type: 'success', text: result.storage === 'cloud' ? '✓ Saved to cloud' : '✓ Saved locally' }
      : { type: 'warn', text: `Cloud error: ${result.error}. Saved locally.` });
    setTimeout(() => setSaveMsg(null), 4000);
  };

  const handleDelete = async (id) => {
    const updated = agents.filter(a => a.id !== id);
    await writeAgents(updated);
    setAgents(updated);
    setConfirmDelete(null);
    if (editingId === id) startNew();
  };

  const handleConnectCloud = async () => {
    setCloudStatus('saving');
    setApiKey(apiKeyInput.trim());
    const result = await writeAgents(agents);
    setCloudStatus(result.success && result.storage === 'cloud' ? 'connected' : 'error');
    if (result.success && result.storage === 'cloud') {
      setTimeout(() => setShowCloud(false), 2000);
    }
  };

  const accentForForm = ACCENT_OPTIONS.find(a => a.value === form.accentColor)?.color || '#1e5fb5';

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Header ── */}
      <div style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0d2045 100%)', padding: '0 28px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 16px rgba(0,0,0,0.35)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 600, fontFamily: 'Inter, sans-serif', background: 'none', border: 'none', cursor: 'pointer' }}>
            ← Home
          </button>
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AgentlyLogo size={26} />
            <div>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif', lineHeight: 1 }}>Agently</p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, letterSpacing: '0.12em', marginTop: 1 }}>SUPER ADMIN</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowCloud(!showCloud)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 20, background: connected ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${connected ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.12)'}`, color: connected ? '#10b981' : 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: connected ? '#10b981' : '#f59e0b', display: 'inline-block', boxShadow: connected ? '0 0 6px #10b981' : 'none' }} />
          {connected ? '☁ Cloud Synced' : '💾 Local Only — click to connect'}
        </button>
      </div>

      {/* ── Cloud Setup Panel ── */}
      {showCloud && (
        <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '18px 28px', display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: '0 0 auto' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>☁ JSONBin.io Cloud Storage</p>
            <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>
              Free forever · No credit card · Sign up at{' '}
              <a href="https://jsonbin.io" target="_blank" rel="noreferrer" style={{ color: '#1e5fb5', fontWeight: 600 }}>jsonbin.io</a>
              {' '}→ copy your <strong>Master Key</strong> → paste below
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 320, alignItems: 'center' }}>
            <input
              type="password"
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              placeholder="$2b$10$… (JSONBin Master Key)"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              onClick={handleConnectCloud}
              disabled={!apiKeyInput.trim() || cloudStatus === 'saving'}
              style={{ padding: '9px 20px', borderRadius: 8, background: 'linear-gradient(135deg,#1e5fb5,#2979d8)', color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif', opacity: !apiKeyInput.trim() ? 0.5 : 1 }}>
              {cloudStatus === 'saving' ? 'Connecting…' : 'Connect'}
            </button>
            {connected && (
              <button onClick={() => { clearCloudConfig(); setApiKeyInput(''); setCloudStatus(null); }} style={{ padding: '9px 14px', borderRadius: 8, background: '#fee2e2', color: '#991b1b', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                Disconnect
              </button>
            )}
          </div>
          {cloudStatus === 'connected' && <p style={{ fontSize: 12, color: '#10b981', fontWeight: 700, alignSelf: 'center' }}>✓ Connected! Data synced.</p>}
          {cloudStatus === 'error'     && <p style={{ fontSize: 12, color: '#ef4444', fontWeight: 700, alignSelf: 'center' }}>✗ Invalid key or network error.</p>}
          {getBinId() && <p style={{ width: '100%', fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Bin ID: {getBinId()}</p>}
        </div>
      )}

      {/* ── Body ── */}
      <div style={{ display: 'flex', height: 'calc(100vh - 58px)', overflow: 'hidden' }}>

        {/* Left: Agent List */}
        <div style={{ width: 272, background: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 12px 8px' }}>
            <button
              onClick={startNew}
              style={{ width: '100%', padding: '10px', borderRadius: 10, background: 'linear-gradient(135deg,#1e5fb5,#2979d8)', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'Inter, sans-serif', boxShadow: '0 4px 12px rgba(30,95,181,0.3)' }}>
              + New Agent Card
            </button>
          </div>

          <div style={{ padding: '4px 8px', flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, padding: 24 }}>Loading…</p>
            ) : agents.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, padding: 24, lineHeight: 1.6 }}>No agents yet.<br />Create your first one!</p>
            ) : agents.map(agent => {
              const isSelected = editingId === agent.id;
              const ac = ACCENT_OPTIONS.find(a => a.value === (agent.accentColor || 'blue'))?.color || '#1e5fb5';
              return (
                <div key={agent.id} style={{ borderRadius: 10, marginBottom: 4, overflow: 'hidden' }}>
                  <div
                    onClick={() => selectAgent(agent)}
                    style={{ padding: '10px 12px', background: isSelected ? '#eff6ff' : 'transparent', border: `1.5px solid ${isSelected ? '#bfdbfe' : 'transparent'}`, borderRadius: 10, cursor: 'pointer', transition: 'all 0.12s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: ac, flexShrink: 0, display: 'inline-block' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em' }}>AGENT {agent.agentNumber}</p>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{agent.title}</p>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); setConfirmDelete(confirmDelete === agent.id ? null : agent.id); }}
                        style={{ width: 24, height: 24, borderRadius: 6, background: '#fee2e2', color: '#dc2626', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
                        ✕
                      </button>
                    </div>
                  </div>
                  {confirmDelete === agent.id && (
                    <div style={{ margin: '0 4px 4px', padding: '10px 12px', borderRadius: 8, background: '#fff7ed', border: '1px solid #fed7aa' }}>
                      <p style={{ fontSize: 11, color: '#92400e', marginBottom: 8, fontWeight: 500 }}>Delete "{agent.title}"?</p>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleDelete(agent.id)} style={{ flex: 1, padding: '5px', borderRadius: 6, background: '#dc2626', color: '#fff', fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Delete</button>
                        <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: '5px', borderRadius: 6, background: '#e5e7eb', color: '#374151', fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9' }}>
            <p style={{ fontSize: 10, color: '#cbd5e1', textAlign: 'center' }}>{agents.length} agent{agents.length !== 1 ? 's' : ''} · {connected ? '☁ Cloud' : '💾 Local'}</p>
          </div>
        </div>

        {/* Right: Form */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          <div style={{ maxWidth: 680 }}>
            {/* Form header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', fontFamily: 'Plus Jakarta Sans, sans-serif', lineHeight: 1.2 }}>
                  {editingId ? 'Edit Agent Card' : 'Create New Agent Card'}
                </h2>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                  This card will appear on the Agently home page marketplace.
                </p>
              </div>
              {saveMsg && (
                <div style={{ padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, flexShrink: 0, background: saveMsg.type === 'success' ? '#d1fae5' : saveMsg.type === 'warn' ? '#fef3c7' : '#fee2e2', color: saveMsg.type === 'success' ? '#065f46' : saveMsg.type === 'warn' ? '#92400e' : '#991b1b' }}>
                  {saveMsg.text}
                </div>
              )}
            </div>

            {/* Card preview strip */}
            <div style={{ padding: '12px 16px', borderRadius: 12, background: `linear-gradient(135deg, ${accentForForm}12, ${accentForForm}06)`, border: `1px solid ${accentForForm}30`, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${accentForForm}22`, border: `1px solid ${accentForForm}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentForForm }}>
                {ICON_DEFS[form.iconType] || ICON_DEFS.robot}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {form.title || 'Agent Title Preview'}
                </p>
                <p style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                  {form.subtitle || 'Description will appear here…'}
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: 18, fontWeight: 800, color: accentForForm, lineHeight: 1 }}>{form.metricValue || '—'}</p>
                <p style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{form.metricLabel || 'Metric'}</p>
              </div>
            </div>

            {/* Form card */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>

              {/* Row 1: Badge · Metric Value · Metric Label */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 18 }}>
                {[
                  { label: 'Badge Number', field: 'agentNumber', placeholder: '01' },
                  { label: 'Metric Value', field: 'metricValue', placeholder: '3.2s · 78% · etc.' },
                  { label: 'Metric Label', field: 'metricLabel', placeholder: 'Avg. KYC Time' },
                ].map(({ label, field, placeholder }) => (
                  <div key={field}>
                    <label style={labelStyle}>{label}</label>
                    <input style={inputStyle} value={form[field]} onChange={e => set(field, e.target.value)} placeholder={placeholder} />
                  </div>
                ))}
              </div>

              {/* Title */}
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Agent Title *</label>
                <input style={{ ...inputStyle, fontSize: 14, fontWeight: 600 }} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Smart Customer Engagement & Chatbot" />
              </div>

              {/* Subtitle */}
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Description</label>
                <textarea style={{ ...inputStyle, minHeight: 72, resize: 'vertical', lineHeight: 1.6 }} value={form.subtitle} onChange={e => set('subtitle', e.target.value)} placeholder="Short description of what this agent does…" />
              </div>

              {/* Features */}
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Features <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 10 }}>(one per line)</span></label>
                <textarea
                  style={{ ...inputStyle, minHeight: 90, resize: 'vertical', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.7 }}
                  value={form.featuresText}
                  onChange={e => set('featuresText', e.target.value)}
                  placeholder={'Auto KYC Verification\nRisk Scoring Engine\nInstant Credit Decision\nDocument Intelligence'}
                />
              </div>

              {/* Icon picker */}
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Icon</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {Object.entries(ICON_DEFS).map(([key, icon]) => (
                    <button
                      key={key}
                      onClick={() => set('iconType', key)}
                      title={key}
                      style={{ width: 46, height: 46, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${form.iconType === key ? accentForForm : '#e2e8f0'}`, background: form.iconType === key ? `${accentForForm}14` : '#fff', color: form.iconType === key ? accentForForm : '#94a3b8', cursor: 'pointer', transition: 'all 0.12s' }}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color */}
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Accent Color</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {ACCENT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => set('accentColor', opt.value)}
                      style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 20, border: `2px solid ${form.accentColor === opt.value ? opt.color : '#e2e8f0'}`, background: form.accentColor === opt.value ? `${opt.color}18` : '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: form.accentColor === opt.value ? opt.color : '#94a3b8', transition: 'all 0.12s', fontFamily: 'Inter, sans-serif' }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: opt.color, display: 'inline-block' }} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Launch Type */}
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Launch Destination</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  {[{ v: false, label: '🌐 External URL' }, { v: true, label: '🔗 Internal Route' }].map(({ v, label }) => (
                    <button
                      key={String(v)}
                      onClick={() => set('isInternal', v)}
                      style={{ padding: '7px 16px', borderRadius: 8, border: `2px solid ${form.isInternal === v ? '#1e5fb5' : '#e2e8f0'}`, background: form.isInternal === v ? '#eff6ff' : '#fff', color: form.isInternal === v ? '#1e5fb5' : '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                      {label}
                    </button>
                  ))}
                </div>
                {form.isInternal ? (
                  <input style={inputStyle} value={form.internalPath} onChange={e => set('internalPath', e.target.value)} placeholder="/engagement  or  /dashboard" />
                ) : (
                  <input style={inputStyle} value={form.appUrl} onChange={e => set('appUrl', e.target.value)} placeholder="https://your-agent-app.netlify.app" type="url" />
                )}
              </div>

              {/* Save */}
              <div style={{ paddingTop: 20, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button onClick={startNew} style={{ padding: '10px 20px', borderRadius: 10, background: 'transparent', color: '#64748b', fontSize: 13, fontWeight: 600, border: '1.5px solid #e2e8f0', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                  Clear
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{ padding: '10px 28px', borderRadius: 10, background: saving ? '#e2e8f0' : 'linear-gradient(135deg,#1e5fb5,#2979d8)', color: saving ? '#94a3b8' : '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : '0 4px 16px rgba(30,95,181,0.35)', transition: 'all 0.15s', fontFamily: 'Inter, sans-serif' }}>
                  {saving ? 'Saving…' : editingId ? '💾 Update Agent' : '✦ Create Agent'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
