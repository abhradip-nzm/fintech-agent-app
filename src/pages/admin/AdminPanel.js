import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  readAgents, writeAgents,
  readIndustries, writeIndustries,
  getApiKey, setApiKey, getBinId, isCloudConnected, clearCloudConfig,
} from '../../utils/storage';

// ─── Rich Text Editor ─────────────────────────────────────────────────────────
const TOOL_GROUPS = [
  [
    { icon: 'B',  cmd: 'bold',               title: 'Bold',             fw: 800 },
    { icon: 'I',  cmd: 'italic',             title: 'Italic',           fi: 'italic' },
    { icon: 'U',  cmd: 'underline',          title: 'Underline',        td: 'underline' },
    { icon: 'S',  cmd: 'strikeThrough',      title: 'Strikethrough',    td: 'line-through', fs: 11 },
  ],
  [
    { icon: 'H1', cmd: 'formatBlock', arg: 'h2', title: 'Heading 1',   fw: 800, fs: 10 },
    { icon: 'H2', cmd: 'formatBlock', arg: 'h3', title: 'Heading 2',   fw: 700, fs: 10 },
    { icon: 'P',  cmd: 'formatBlock', arg: 'p',  title: 'Paragraph',   fs: 11 },
  ],
  [
    { icon: '•',  cmd: 'insertUnorderedList', title: 'Bullet list',     fs: 18, fw: 700 },
    { icon: '1.', cmd: 'insertOrderedList',   title: 'Numbered list',   fs: 11 },
    { icon: '❝',  cmd: 'formatBlock', arg: 'blockquote', title: 'Blockquote', fs: 13 },
  ],
  [
    { icon: '—',  cmd: 'insertHorizontalRule', title: 'Divider',        fs: 12 },
    { icon: '🔗', cmd: 'createLink',           title: 'Insert link',    fs: 12, isLink: true },
    { icon: '✕',  cmd: 'removeFormat',         title: 'Clear format',   fs: 10 },
  ],
];

const RichTextEditor = ({ defaultValue = '', onChange }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.innerHTML = defaultValue;
  }, []); // eslint-disable-line

  const exec = (cmd, arg) => {
    ref.current.focus();
    document.execCommand(cmd, false, arg || null);
    onChange(ref.current.innerHTML);
  };

  return (
    <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, padding: '7px 10px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', alignItems: 'center' }}>
        {TOOL_GROUPS.map((group, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && <div style={{ width: 1, height: 18, background: '#d1d5db', margin: '0 4px' }} />}
            {group.map((t, ti) => (
              <button
                key={`${gi}-${ti}`}
                type="button"
                title={t.title}
                onMouseDown={e => {
                  e.preventDefault();
                  if (t.isLink) {
                    const url = window.prompt('Enter URL (include https://):');
                    if (url) exec('createLink', url);
                  } else {
                    exec(t.cmd, t.arg);
                  }
                }}
                style={{
                  width: 30, height: 28, borderRadius: 5, border: 'none',
                  background: 'transparent', fontSize: t.fs || 12,
                  fontWeight: t.fw || 600, fontStyle: t.fi || 'normal',
                  textDecoration: t.td || 'none', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', color: '#4b5563',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#e5e7eb'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {t.icon}
              </button>
            ))}
          </React.Fragment>
        ))}
      </div>
      {/* Editable area */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(ref.current.innerHTML)}
        style={{
          minHeight: 220, padding: '14px 16px',
          fontSize: 13, fontFamily: 'Inter, sans-serif',
          outline: 'none', color: '#1e293b', lineHeight: 1.8,
          background: '#fafafa', overflowY: 'auto', maxHeight: 380,
        }}
      />
    </div>
  );
};

// ─── Icon library ─────────────────────────────────────────────────────────────
const ICON_DEFS = {
  onboarding: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>,
  chat:       <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  analytics:  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  payment:    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  security:   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  document:   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  robot:      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><line x1="12" y1="7" x2="12" y2="11"/><circle cx="8" cy="16" r="1" fill="currentColor"/><circle cx="16" cy="16" r="1" fill="currentColor"/></svg>,
  search:     <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
};

const ACCENT_OPTIONS = [
  { value: 'blue',   label: 'Blue',   color: '#1e5fb5' },
  { value: 'cyan',   label: 'Cyan',   color: '#00c6ff' },
  { value: 'purple', label: 'Purple', color: '#7c3aed' },
  { value: 'green',  label: 'Green',  color: '#059669' },
  { value: 'orange', label: 'Orange', color: '#d97706' },
];

const EMPTY_FORM = {
  agentNumber: '', title: '', subtitle: '', featuresText: '',
  metricValue: '', metricLabel: '', iconType: 'robot',
  isInternal: false, appUrl: '', internalPath: '',
  accentColor: 'blue', industries: [], richContent: '',
};

// ─── Agently Logo ─────────────────────────────────────────────────────────────
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

  // ── Menus ──
  const [activeMenu, setActiveMenu]   = useState('agents'); // 'agents' | 'industries'

  // ── Agents ──
  const [agents, setAgents]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [editingId, setEditingId]     = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [saving, setSaving]           = useState(false);
  const [saveMsg, setSaveMsg]         = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // ── Industries ──
  const [industries, setIndustries]   = useState([]);
  const [newIndName, setNewIndName]   = useState('');
  const [indSaveMsg, setIndSaveMsg]   = useState(null);

  // ── Cloud ──
  const [showCloud, setShowCloud]     = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [cloudStatus, setCloudStatus] = useState(null);

  const connected = isCloudConnected();

  useEffect(() => {
    Promise.all([readAgents(), readIndustries()]).then(([a, inds]) => {
      setAgents(a);
      setIndustries(inds);
      setLoading(false);
    });
    setApiKeyInput(getApiKey());
  }, []);

  const set = useCallback((field, value) => setForm(f => ({ ...f, [field]: value })), []);

  const toggleIndustry = useCallback((id) => {
    setForm(f => ({
      ...f,
      industries: f.industries.includes(id)
        ? f.industries.filter(x => x !== id)
        : [...f.industries, id],
    }));
  }, []);

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
      industries:   agent.industries   || [],
      richContent:  agent.richContent  || '',
    });
    setSaveMsg(null);
  };

  const startNew = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, agentNumber: String(agents.length + 1).padStart(2, '0') });
    setSaveMsg(null);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setSaveMsg({ type: 'error', text: 'Title is required.' }); return; }
    setSaving(true);
    const features = form.featuresText.split('\n').map(f => f.trim()).filter(Boolean);
    const agentObj = {
      id:           editingId || `agent_${Date.now()}`,
      agentNumber:  form.agentNumber || String(agents.length + 1).padStart(2, '0'),
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
      industries:   form.industries,
      richContent:  form.richContent,
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

  // ── Industry actions ──────────────────────────────────────────────────────
  const handleAddIndustry = () => {
    const name = newIndName.trim();
    if (!name) return;
    if (industries.some(i => i.name.toLowerCase() === name.toLowerCase())) {
      setIndSaveMsg({ type: 'error', text: 'Industry already exists.' });
      setTimeout(() => setIndSaveMsg(null), 3000);
      return;
    }
    const newInd = { id: `ind_${Date.now()}`, name };
    const updated = [...industries, newInd];
    setIndustries(updated);
    writeIndustries(updated);
    setNewIndName('');
    setIndSaveMsg({ type: 'success', text: `"${name}" added.` });
    setTimeout(() => setIndSaveMsg(null), 2500);
  };

  const handleDeleteIndustry = (id) => {
    const updated = industries.filter(i => i.id !== id);
    setIndustries(updated);
    writeIndustries(updated);
  };

  // ── Cloud ─────────────────────────────────────────────────────────────────
  const handleConnectCloud = async () => {
    setCloudStatus('saving');
    setApiKey(apiKeyInput.trim());
    const result = await writeAgents(agents);
    setCloudStatus(result.success && result.storage === 'cloud' ? 'connected' : 'error');
    if (result.success && result.storage === 'cloud') setTimeout(() => setShowCloud(false), 2000);
  };

  const accentForForm = ACCENT_OPTIONS.find(a => a.value === form.accentColor)?.color || '#1e5fb5';

  // ── Industry usage count ──────────────────────────────────────────────────
  const industryUsage = (id) => agents.filter(a => (a.industries || []).includes(id)).length;

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
              Free forever · <a href="https://jsonbin.io" target="_blank" rel="noreferrer" style={{ color: '#1e5fb5', fontWeight: 600 }}>jsonbin.io</a>
              {' '}→ copy Master Key → paste below
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 320, alignItems: 'center' }}>
            <input type="password" value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)} placeholder="$2b$10$… (JSONBin Master Key)" style={{ ...inputStyle, flex: 1 }} />
            <button onClick={handleConnectCloud} disabled={!apiKeyInput.trim() || cloudStatus === 'saving'} style={{ padding: '9px 20px', borderRadius: 8, background: 'linear-gradient(135deg,#1e5fb5,#2979d8)', color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif', opacity: !apiKeyInput.trim() ? 0.5 : 1 }}>
              {cloudStatus === 'saving' ? 'Connecting…' : 'Connect'}
            </button>
            {connected && <button onClick={() => { clearCloudConfig(); setApiKeyInput(''); setCloudStatus(null); }} style={{ padding: '9px 14px', borderRadius: 8, background: '#fee2e2', color: '#991b1b', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Disconnect</button>}
          </div>
          {cloudStatus === 'connected' && <p style={{ fontSize: 12, color: '#10b981', fontWeight: 700, alignSelf: 'center' }}>✓ Connected! Data synced.</p>}
          {cloudStatus === 'error'     && <p style={{ fontSize: 12, color: '#ef4444', fontWeight: 700, alignSelf: 'center' }}>✗ Invalid key or network error.</p>}
          {getBinId() && <p style={{ width: '100%', fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Bin ID: {getBinId()}</p>}
        </div>
      )}

      {/* ── Body ── */}
      <div style={{ display: 'flex', height: 'calc(100vh - 58px)', overflow: 'hidden' }}>

        {/* ── Left Sidebar ── */}
        <div style={{ width: 272, background: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>

          {/* Tab bar */}
          <div style={{ display: 'flex', padding: '10px 10px 0', gap: 4 }}>
            {[
              { key: 'agents',     label: '📋 Agent Cards' },
              { key: 'industries', label: '🏭 Industries' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveMenu(tab.key)}
                style={{
                  flex: 1, padding: '8px 4px', borderRadius: '8px 8px 0 0',
                  background: activeMenu === tab.key ? '#eff6ff' : 'transparent',
                  border: activeMenu === tab.key ? '1.5px solid #bfdbfe' : '1.5px solid transparent',
                  borderBottom: 'none',
                  color: activeMenu === tab.key ? '#1e5fb5' : '#64748b',
                  fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div style={{ height: 1, background: '#e2e8f0' }} />

          {/* ── Agents list ── */}
          {activeMenu === 'agents' && (
            <>
              <div style={{ padding: '12px 12px 8px' }}>
                <button onClick={startNew} style={{ width: '100%', padding: '10px', borderRadius: 10, background: 'linear-gradient(135deg,#1e5fb5,#2979d8)', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'Inter, sans-serif', boxShadow: '0 4px 12px rgba(30,95,181,0.3)' }}>
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
                      <div onClick={() => selectAgent(agent)} style={{ padding: '10px 12px', background: isSelected ? '#eff6ff' : 'transparent', border: `1.5px solid ${isSelected ? '#bfdbfe' : 'transparent'}`, borderRadius: 10, cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: ac, flexShrink: 0, display: 'inline-block' }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em' }}>AGENT {agent.agentNumber}</p>
                            <p style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{agent.title}</p>
                          </div>
                          <button onClick={e => { e.stopPropagation(); setConfirmDelete(confirmDelete === agent.id ? null : agent.id); }} style={{ width: 24, height: 24, borderRadius: 6, background: '#fee2e2', color: '#dc2626', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>✕</button>
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
            </>
          )}

          {/* ── Industries list (compact sidebar) ── */}
          {activeMenu === 'industries' && (
            <>
              <div style={{ padding: '12px 12px 8px' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    value={newIndName}
                    onChange={e => setNewIndName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddIndustry()}
                    placeholder="New industry name…"
                    style={{ ...inputStyle, flex: 1, fontSize: 12, padding: '7px 10px' }}
                  />
                  <button
                    onClick={handleAddIndustry}
                    disabled={!newIndName.trim()}
                    style={{ padding: '7px 12px', borderRadius: 8, background: newIndName.trim() ? 'linear-gradient(135deg,#1e5fb5,#2979d8)' : '#e2e8f0', color: newIndName.trim() ? '#fff' : '#94a3b8', fontSize: 18, fontWeight: 700, border: 'none', cursor: newIndName.trim() ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>
                    +
                  </button>
                </div>
                {indSaveMsg && (
                  <p style={{ fontSize: 11, marginTop: 6, color: indSaveMsg.type === 'success' ? '#059669' : '#dc2626', fontWeight: 600 }}>{indSaveMsg.text}</p>
                )}
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
                {industries.length === 0 ? (
                  <p style={{ fontSize: 12, color: '#94a3b8', padding: '16px 8px', textAlign: 'center' }}>No industries yet.</p>
                ) : industries.map(ind => {
                  const count = industryUsage(ind.id);
                  return (
                    <div key={ind.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, marginBottom: 3, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: 13 }}>🏭</span>
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{ind.name}</span>
                      <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>{count} agent{count !== 1 ? 's' : ''}</span>
                      <button onClick={() => handleDeleteIndustry(ind.id)} style={{ width: 20, height: 20, borderRadius: 5, background: '#fee2e2', color: '#dc2626', fontSize: 10, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>✕</button>
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9' }}>
                <p style={{ fontSize: 10, color: '#cbd5e1', textAlign: 'center' }}>{industries.length} industr{industries.length !== 1 ? 'ies' : 'y'}</p>
              </div>
            </>
          )}
        </div>

        {/* ── Right Panel ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>

          {/* ── Industries Management Panel ── */}
          {activeMenu === 'industries' && (
            <div style={{ maxWidth: 720 }}>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', fontFamily: 'Plus Jakarta Sans, sans-serif', lineHeight: 1.2 }}>Industries Management</h2>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                  Create industry tags to categorize agents. These will appear as filter chips on the homepage and as colored tags on each agent card.
                </p>
              </div>

              {/* Add form card */}
              <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: 24 }}>
                <label style={{ ...labelStyle, fontSize: 12 }}>Add New Industry</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input
                    value={newIndName}
                    onChange={e => setNewIndName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddIndustry()}
                    placeholder="e.g. Telecommunications, PropTech, AgriTech…"
                    style={{ ...inputStyle, flex: 1, fontSize: 14 }}
                  />
                  <button
                    onClick={handleAddIndustry}
                    disabled={!newIndName.trim()}
                    style={{ padding: '10px 24px', borderRadius: 10, background: newIndName.trim() ? 'linear-gradient(135deg,#1e5fb5,#2979d8)' : '#e2e8f0', color: newIndName.trim() ? '#fff' : '#94a3b8', fontSize: 13, fontWeight: 700, border: 'none', cursor: newIndName.trim() ? 'pointer' : 'not-allowed', fontFamily: 'Inter, sans-serif', boxShadow: newIndName.trim() ? '0 4px 14px rgba(30,95,181,0.3)' : 'none', whiteSpace: 'nowrap' }}>
                    + Add Industry
                  </button>
                </div>
                {indSaveMsg && (
                  <p style={{ fontSize: 12, marginTop: 8, color: indSaveMsg.type === 'success' ? '#059669' : '#dc2626', fontWeight: 600 }}>
                    {indSaveMsg.text}
                  </p>
                )}
              </div>

              {/* Industries grid */}
              {industries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px', background: '#fff', borderRadius: 16, border: '1px dashed #d1d5db' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🏭</div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>No industries yet</p>
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>Add your first industry tag using the form above.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                  {industries.map(ind => {
                    const count = industryUsage(ind.id);
                    return (
                      <div key={ind.id} style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🏭</div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>{ind.name}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteIndustry(ind.id)}
                            style={{ width: 26, height: 26, borderRadius: 7, background: '#fee2e2', color: '#dc2626', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                          >✕</button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: count > 0 ? '#1e5fb5' : '#94a3b8', background: count > 0 ? '#dbeafe' : '#f1f5f9', padding: '3px 8px', borderRadius: 20 }}>
                            {count} agent{count !== 1 ? 's' : ''}
                          </span>
                          <span style={{ fontSize: 10, color: '#94a3b8' }}>using this tag</span>
                        </div>
                        <p style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>ID: {ind.id}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Agent Card Form ── */}
          {activeMenu === 'agents' && (
            <div style={{ maxWidth: 720 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', fontFamily: 'Plus Jakarta Sans, sans-serif', lineHeight: 1.2 }}>
                    {editingId ? 'Edit Agent Card' : 'Create New Agent Card'}
                  </h2>
                  <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>This card will appear on the Agently home page marketplace.</p>
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
                  <textarea style={{ ...inputStyle, minHeight: 90, resize: 'vertical', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.7 }} value={form.featuresText} onChange={e => set('featuresText', e.target.value)} placeholder={'Auto KYC Verification\nRisk Scoring Engine\nInstant Credit Decision'} />
                </div>

                {/* Industries multi-select */}
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Industries <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 10 }}>(click to tag)</span></label>
                  {industries.length === 0 ? (
                    <p style={{ fontSize: 12, color: '#94a3b8', padding: '10px 0' }}>
                      No industries available. <button onClick={() => setActiveMenu('industries')} style={{ background: 'none', border: 'none', color: '#1e5fb5', cursor: 'pointer', fontWeight: 600, fontSize: 12, fontFamily: 'Inter, sans-serif', padding: 0, textDecoration: 'underline' }}>Add some in the Industries tab →</button>
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {industries.map(ind => {
                        const selected = form.industries.includes(ind.id);
                        return (
                          <button
                            key={ind.id}
                            type="button"
                            onClick={() => toggleIndustry(ind.id)}
                            style={{
                              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                              border: `1.5px solid ${selected ? accentForForm : '#e2e8f0'}`,
                              background: selected ? `${accentForForm}14` : '#f8fafc',
                              color: selected ? accentForForm : '#64748b',
                              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                              transition: 'all 0.15s',
                            }}
                          >
                            {selected ? '✓ ' : ''}{ind.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Icon picker */}
                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Icon</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {Object.entries(ICON_DEFS).map(([key, icon]) => (
                      <button key={key} onClick={() => set('iconType', key)} title={key} style={{ width: 46, height: 46, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${form.iconType === key ? accentForForm : '#e2e8f0'}`, background: form.iconType === key ? `${accentForForm}14` : '#fff', color: form.iconType === key ? accentForForm : '#94a3b8', cursor: 'pointer', transition: 'all 0.12s' }}>
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
                      <button key={opt.value} onClick={() => set('accentColor', opt.value)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 20, border: `2px solid ${form.accentColor === opt.value ? opt.color : '#e2e8f0'}`, background: form.accentColor === opt.value ? `${opt.color}18` : '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: form.accentColor === opt.value ? opt.color : '#94a3b8', transition: 'all 0.12s', fontFamily: 'Inter, sans-serif' }}>
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
                      <button key={String(v)} onClick={() => set('isInternal', v)} style={{ padding: '7px 16px', borderRadius: 8, border: `2px solid ${form.isInternal === v ? '#1e5fb5' : '#e2e8f0'}`, background: form.isInternal === v ? '#eff6ff' : '#fff', color: form.isInternal === v ? '#1e5fb5' : '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                  {form.isInternal
                    ? <input style={inputStyle} value={form.internalPath} onChange={e => set('internalPath', e.target.value)} placeholder="/engagement  or  /dashboard" />
                    : <input style={inputStyle} value={form.appUrl} onChange={e => set('appUrl', e.target.value)} placeholder="https://your-agent-app.netlify.app" type="url" />
                  }
                </div>

                {/* Rich Text Editor */}
                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>
                    Detailed Information
                    <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 10, marginLeft: 4 }}>
                      (optional · shown as "View Details" on the homepage card)
                    </span>
                  </label>
                  <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8, lineHeight: 1.5 }}>
                    Use the rich editor to write comprehensive details — usage guides, feature descriptions, pricing, integrations, etc. A "View Details" button will automatically appear on the homepage card when this has content.
                  </p>
                  <RichTextEditor
                    key={editingId || 'new'}
                    defaultValue={form.richContent}
                    onChange={val => set('richContent', val)}
                  />
                </div>

                {/* Save */}
                <div style={{ paddingTop: 20, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button onClick={startNew} style={{ padding: '10px 20px', borderRadius: 10, background: 'transparent', color: '#64748b', fontSize: 13, fontWeight: 600, border: '1.5px solid #e2e8f0', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                    Clear
                  </button>
                  <button onClick={handleSave} disabled={saving} style={{ padding: '10px 28px', borderRadius: 10, background: saving ? '#e2e8f0' : 'linear-gradient(135deg,#1e5fb5,#2979d8)', color: saving ? '#94a3b8' : '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : '0 4px 16px rgba(30,95,181,0.35)', transition: 'all 0.15s', fontFamily: 'Inter, sans-serif' }}>
                    {saving ? 'Saving…' : editingId ? '💾 Update Agent' : '✦ Create Agent'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
