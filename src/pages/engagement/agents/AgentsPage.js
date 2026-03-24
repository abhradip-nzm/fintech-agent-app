import React, { useState } from 'react';
import Layout from '../../../components/Layout';
import { useApp } from '../../../context/AppContext';
import { STATUS_META } from '../../../data/agentsData';

const EMPTY_FORM = { name: '', role: '', email: '', phone: '', skills: '', status: 'online' };

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusPill = ({ status }) => {
  const m = STATUS_META[status] || STATUS_META.offline;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: m.bg, fontSize: 11, fontWeight: 700, color: m.color }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.color, animation: status === 'online' ? 'pulse 2s infinite' : 'none', display: 'inline-block' }} />
      {m.label}
    </span>
  );
};

// ─── Load bar ─────────────────────────────────────────────────────────────────
const LoadBar = ({ load, max = 5 }) => {
  const pct = Math.min(load / max, 1);
  const color = pct > 0.7 ? '#ef4444' : pct > 0.4 ? '#f59e0b' : '#10b981';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct * 100}%`, background: color, borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 20 }}>{load}</span>
    </div>
  );
};

// ─── Agent card ───────────────────────────────────────────────────────────────
const AgentCard = ({ agent, load, onStatusChange, onRemove }) => {
  const [hover, setHover] = useState(false);
  const statusOptions = ['online', 'busy', 'away', 'offline'];

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: '#fff',
        border: `1px solid ${hover ? '#bfdbfe' : 'var(--gray-200)'}`,
        borderRadius: 16, padding: 20,
        boxShadow: hover ? '0 8px 24px rgba(30,95,181,0.1)' : '0 2px 8px rgba(0,0,0,0.05)',
        transition: 'all 0.2s',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 46, height: 46, borderRadius: '50%', background: `${agent.avatarColor}20`, border: `2px solid ${agent.avatarColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, color: agent.avatarColor, flexShrink: 0 }}>
          {agent.avatar}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--gray-900)' }}>{agent.name}</h3>
            <StatusPill status={agent.status} />
          </div>
          <p style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 2 }}>{agent.role}</p>
        </div>
        <button
          onClick={() => onRemove(agent.id)}
          style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 6, background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Remove agent"
        >✕</button>
      </div>

      {/* Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11 }}>
        <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '7px 10px' }}>
          <p style={{ color: 'var(--gray-400)', marginBottom: 2, textTransform: 'uppercase', fontSize: 9, letterSpacing: '0.06em' }}>Email</p>
          <p style={{ fontWeight: 600, color: 'var(--gray-700)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.email}</p>
        </div>
        <div style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '7px 10px' }}>
          <p style={{ color: 'var(--gray-400)', marginBottom: 2, textTransform: 'uppercase', fontSize: 9, letterSpacing: '0.06em' }}>Phone</p>
          <p style={{ fontWeight: 600, color: 'var(--gray-700)' }}>{agent.phone}</p>
        </div>
      </div>

      {/* Bandwidth */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active Conversations</span>
          <span style={{ fontSize: 10, color: 'var(--gray-400)' }}>max 5</span>
        </div>
        <LoadBar load={load} max={5} />
      </div>

      {/* Skills */}
      {agent.skills && agent.skills.length > 0 && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {agent.skills.map(s => (
            <span key={s} style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 10, background: `${agent.avatarColor}12`, color: agent.avatarColor, border: `1px solid ${agent.avatarColor}25` }}>
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Status changer */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Set Status</p>
        <div style={{ display: 'flex', gap: 5 }}>
          {statusOptions.map(s => {
            const m = STATUS_META[s];
            return (
              <button
                key={s}
                onClick={() => onStatusChange(agent.id, s)}
                style={{ flex: 1, padding: '5px 6px', borderRadius: 7, border: `1.5px solid ${agent.status === s ? m.color : 'var(--gray-200)'}`, background: agent.status === s ? m.bg : '#fff', color: agent.status === s ? m.color : 'var(--gray-400)', fontSize: 10, fontWeight: 700, cursor: 'pointer', transition: 'all 0.12s', fontFamily: 'var(--font-body)' }}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── Add agent form ───────────────────────────────────────────────────────────
const AddAgentForm = ({ onSave, onCancel }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const colors = ['#1e5fb5','#7c3aed','#059669','#d97706','#0891b2','#dc2626'];
  const [color, setColor] = useState(colors[0]);

  const initials = form.name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() || '').slice(0,2).join('') || '??';

  const handleSave = () => {
    if (!form.name.trim() || !form.role.trim()) return;
    onSave({
      name:        form.name.trim(),
      role:        form.role.trim(),
      email:       form.email.trim(),
      phone:       form.phone.trim(),
      skills:      form.skills.split(',').map(s => s.trim()).filter(Boolean),
      status:      form.status,
      avatarColor: color,
      avatar:      initials,
      joinedAt:    new Date().toISOString().slice(0,10),
    });
  };

  const inp = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none', background: '#fafafa', color: '#1e293b', boxSizing: 'border-box' };
  const lbl = { fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4, display: 'block' };

  return (
    <div style={{ background: '#fff', border: '1.5px solid #bfdbfe', borderRadius: 16, padding: 24, boxShadow: '0 4px 24px rgba(30,95,181,0.12)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        {/* Live avatar preview */}
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${color}22`, border: `2px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, color, flexShrink: 0 }}>
          {initials}
        </div>
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--gray-900)' }}>Add New Human Agent</h3>
          <p style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>Fill in the details below</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div><label style={lbl}>Full Name *</label><input style={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Anjali Verma" /></div>
        <div><label style={lbl}>Role *</label><input style={inp} value={form.role} onChange={e => set('role', e.target.value)} placeholder="Support Specialist" /></div>
        <div><label style={lbl}>Email</label><input style={inp} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="name@agently.io" /></div>
        <div><label style={lbl}>Phone</label><input style={inp} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 9XXXXXXXXX" /></div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={lbl}>Skills (comma-separated)</label>
        <input style={inp} value={form.skills} onChange={e => set('skills', e.target.value)} placeholder="Payment Issues, KYC, Escalations" />
      </div>

      {/* Avatar colour picker */}
      <div style={{ marginBottom: 18 }}>
        <label style={lbl}>Avatar Colour</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {colors.map(c => (
            <button key={c} onClick={() => setColor(c)} style={{ width: 26, height: 26, borderRadius: '50%', background: c, border: `3px solid ${color === c ? '#0f172a' : 'transparent'}`, cursor: 'pointer', transition: 'border 0.15s' }} />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ padding: '9px 20px', borderRadius: 10, background: '#fff', color: '#64748b', border: '1.5px solid #e2e8f0', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Cancel</button>
        <button onClick={handleSave} disabled={!form.name.trim() || !form.role.trim()} style={{ padding: '9px 24px', borderRadius: 10, background: form.name.trim() ? 'linear-gradient(135deg,#1e5fb5,#2979d8)' : '#e2e8f0', color: form.name.trim() ? '#fff' : '#94a3b8', border: 'none', fontSize: 13, fontWeight: 700, cursor: form.name.trim() ? 'pointer' : 'not-allowed', boxShadow: form.name.trim() ? '0 4px 12px rgba(30,95,181,0.3)' : 'none', fontFamily: 'var(--font-body)' }}>
          ✦ Add Agent
        </button>
      </div>
    </div>
  );
};

// ─── Main page ─────────────────────────────────────────────────────────────────
const AgentsPage = () => {
  const { humanAgents, addHumanAgent, updateAgentStatus, removeHumanAgent, getAgentLoad, getSortedAgents, conversations, agentMode } = useApp();
  const [showForm,  setShowForm]  = useState(false);
  const [search,    setSearch]    = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const sortedAgents = getSortedAgents();

  const filtered = sortedAgents.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.role.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterStatus === 'all' || a.status === filterStatus;
    return matchSearch && matchFilter;
  });

  const onlineCount = humanAgents.filter(a => a.status === 'online').length;
  const busyCount   = humanAgents.filter(a => a.status === 'busy').length;
  const totalLoad   = sortedAgents.reduce((sum, a) => sum + a.load, 0);

  const handleAdd = (agent) => {
    addHumanAgent(agent);
    setShowForm(false);
  };

  return (
    <Layout
      title="Human Agents"
      subtitle={`${humanAgents.length} agents · ${onlineCount} online · ${busyCount} busy · ${totalLoad} active conversations`}
      actions={
        <button
          onClick={() => setShowForm(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#1e5fb5,#2979d8)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', boxShadow: '0 4px 12px rgba(30,95,181,0.3)' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Add Agent
        </button>
      }
    >
      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Agents', value: humanAgents.length, color: '#1e5fb5', bg: '#eff6ff' },
          { label: 'Online Now',   value: onlineCount,         color: '#10b981', bg: '#d1fae5' },
          { label: 'Busy',         value: busyCount,           color: '#f59e0b', bg: '#fef3c7' },
          { label: 'Total Active Convos', value: totalLoad,    color: '#7c3aed', bg: '#ede9fe' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}25`, borderRadius: 12, padding: '14px 18px' }}>
            <p style={{ fontSize: 24, fontFamily: 'var(--font-display)', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 4 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Add agent form */}
      {showForm && (
        <div style={{ marginBottom: 24 }}>
          <AddAgentForm onSave={handleAdd} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input placeholder="Search agents..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '9px 12px 9px 34px', border: '1px solid var(--gray-200)', borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-body)', outline: 'none', background: '#fff', color: 'var(--gray-800)', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['all','online','busy','away','offline'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: filterStatus === s ? 'linear-gradient(135deg,#1e5fb5,#2979d8)' : '#fff', color: filterStatus === s ? '#fff' : 'var(--gray-600)', border: `1px solid ${filterStatus === s ? 'transparent' : 'var(--gray-200)'}`, cursor: 'pointer', fontFamily: 'var(--font-body)', textTransform: 'capitalize' }}>
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Agent grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--gray-700)', fontSize: 16 }}>No agents found</p>
          <p style={{ color: 'var(--gray-400)', fontSize: 13, marginTop: 8 }}>Try a different search or filter</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              load={agent.load}
              onStatusChange={updateAgentStatus}
              onRemove={removeHumanAgent}
            />
          ))}
        </div>
      )}
    </Layout>
  );
};

export default AgentsPage;
