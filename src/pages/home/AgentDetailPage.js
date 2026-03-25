import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { readAgents, readIndustries } from '../../utils/storage';
import './AgentDetailPage.css';

// ─── Accent color system ──────────────────────────────────────────────────────
const ACCENT = {
  blue:   { p: '#1e5fb5', s: '#2979d8', bg1: '#eef4ff', bg2: '#dbeafe', blob1: 'rgba(30,95,181,0.1)',  blob2: 'rgba(79,124,247,0.06)',  accentBg: 'rgba(30,95,181,0.06)'  },
  cyan:   { p: '#0072ff', s: '#00c6ff', bg1: '#e8f4ff', bg2: '#cce8ff', blob1: 'rgba(0,114,255,0.08)', blob2: 'rgba(0,198,255,0.06)',   accentBg: 'rgba(0,114,255,0.06)'  },
  purple: { p: '#7c3aed', s: '#9f67fa', bg1: '#f3eeff', bg2: '#ede9fe', blob1: 'rgba(124,58,237,0.1)', blob2: 'rgba(159,103,250,0.06)', accentBg: 'rgba(124,58,237,0.06)' },
  green:  { p: '#059669', s: '#10b981', bg1: '#edfff6', bg2: '#d1fae5', blob1: 'rgba(5,150,105,0.1)',  blob2: 'rgba(16,185,129,0.06)',  accentBg: 'rgba(5,150,105,0.06)'  },
  orange: { p: '#d97706', s: '#f59e0b', bg1: '#fffbeb', bg2: '#fef3c7', blob1: 'rgba(217,119,6,0.1)',  blob2: 'rgba(245,158,11,0.06)',  accentBg: 'rgba(217,119,6,0.06)'  },
};

// ─── Card icon library ────────────────────────────────────────────────────────
const CARD_ICONS = {
  onboarding: <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>,
  chat:       <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  analytics:  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  payment:    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  security:   <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  document:   <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  robot:      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><line x1="12" y1="7" x2="12" y2="11"/><circle cx="8" cy="16" r="1" fill="currentColor"/><circle cx="16" cy="16" r="1" fill="currentColor"/></svg>,
  search:     <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
};

// ─── Agently Logo ─────────────────────────────────────────────────────────────
const AgentlyLogo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 42 42" fill="none">
    <defs>
      <linearGradient id="adpLogoGrad" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#4f7cf7"/><stop offset="100%" stopColor="#7c3aed"/>
      </linearGradient>
      <linearGradient id="adpLogoShine" x1="0" y1="0" x2="0" y2="21" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="rgba(255,255,255,0.22)"/><stop offset="100%" stopColor="rgba(255,255,255,0)"/>
      </linearGradient>
    </defs>
    <rect width="42" height="42" rx="11" fill="url(#adpLogoGrad)"/>
    <rect width="42" height="21" rx="10" fill="url(#adpLogoShine)"/>
    <path d="M 10 31 C 14 26 17 23 21 19 C 25 15 28 13 32 10" stroke="rgba(255,255,255,0.93)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <circle cx="10" cy="31" r="3.1" fill="white" opacity="0.9"/>
    <circle cx="21" cy="19" r="3.1" fill="white" opacity="0.9"/>
    <circle cx="32" cy="10" r="3.1" fill="white" opacity="0.9"/>
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────
const AgentDetailPage = () => {
  const { agentId } = useParams();
  const navigate    = useNavigate();
  const [agent,      setAgent]      = useState(null);
  const [industries, setIndustries] = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    Promise.all([readAgents(), readIndustries()]).then(([agents, inds]) => {
      const found = agents.find(a => a.id === agentId);
      setAgent(found || null);
      setIndustries(inds);
      setLoading(false);
    });
  }, [agentId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4ff' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: '#4f7cf7', animation: `pulse 1.2s ${i * 0.2}s ease-in-out infinite` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f0f4ff', gap: 16 }}>
        <div style={{ fontSize: 52 }}>🤖</div>
        <p style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Agent not found</p>
        <button onClick={() => navigate('/')} style={{ padding: '10px 24px', borderRadius: 10, background: 'linear-gradient(135deg,#4f7cf7,#7c3aed)', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>← Back to Marketplace</button>
      </div>
    );
  }

  const ac = ACCENT[agent.accentColor] || ACCENT.blue;
  const icon = CARD_ICONS[agent.iconType] || CARD_ICONS.robot;
  const agentIndustries = (agent.industries || [])
    .map(id => industries.find(i => i.id === id))
    .filter(Boolean);

  const handleLaunch = () => {
    if (agent.isInternal && agent.internalPath) navigate(agent.internalPath);
    else if (agent.appUrl) window.open(agent.appUrl, '_blank', 'noopener');
  };

  return (
    <div
      className="adp-root"
      style={{
        background: `linear-gradient(160deg, ${ac.bg1} 0%, ${ac.bg2} 40%, #ffffff 70%)`,
        '--adp-accent': ac.p,
        '--adp-accent-bg': ac.accentBg,
      }}
    >
      {/* Decorative blobs */}
      <div style={{ position: 'fixed', top: -120, right: -120, width: 560, height: 560, borderRadius: '50%', background: `radial-gradient(circle, ${ac.blob1} 0%, transparent 70%)`, pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: -80, left: -80, width: 420, height: 420, borderRadius: '50%', background: `radial-gradient(circle, ${ac.blob2} 0%, transparent 70%)`, pointerEvents: 'none', zIndex: 0 }} />

      {/* ── Top bar ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', background: 'rgba(255,255,255,0.8)', borderBottom: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              className="adp-back-btn"
              onClick={() => navigate('/')}
              style={{ background: 'rgba(0,0,0,0.04)', color: '#475569', border: '1px solid rgba(0,0,0,0.08)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              Back to Marketplace
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AgentlyLogo size={26} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Agently</span>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 32px 80px', position: 'relative', zIndex: 1 }}>

        {/* ── Agent Hero Card ── */}
        <div style={{ background: '#ffffff', borderRadius: 24, padding: '40px 44px', boxShadow: `0 8px 48px ${ac.blob1}, 0 2px 16px rgba(0,0,0,0.06)`, border: `1px solid ${ac.p}22`, marginBottom: 32, borderTop: `4px solid ${ac.p}` }}>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
            {/* Icon */}
            <div style={{ width: 72, height: 72, borderRadius: 20, background: `linear-gradient(135deg, ${ac.p}20, ${ac.p}0c)`, border: `1.5px solid ${ac.p}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ac.p, flexShrink: 0 }}>
              {icon}
            </div>

            {/* Title block */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', padding: '4px 12px', borderRadius: 20, background: `${ac.p}14`, border: `1px solid ${ac.p}28`, color: '#64748b' }}>
                  Agent {agent.agentNumber}
                </span>
                {agent.richContent && (
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', padding: '4px 10px', borderRadius: 20, background: '#d1fae5', border: '1px solid #a7f3d0', color: '#065f46' }}>
                    ✦ Full Details
                  </span>
                )}
              </div>
              <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginBottom: 12, letterSpacing: '-0.01em' }}>
                {agent.title}
              </h1>
              <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.7, marginBottom: 20 }}>
                {agent.subtitle}
              </p>

              {/* Industry chips */}
              {agentIndustries.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                  {agentIndustries.map(ind => (
                    <span key={ind.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 20, background: `${ac.p}12`, border: `1px solid ${ac.p}28`, color: ac.p }}>
                      <span style={{ fontSize: 13 }}>🏭</span>
                      {ind.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Feature tags */}
              {agent.features && agent.features.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {agent.features.map(f => (
                    <span key={f} style={{ fontSize: 12, fontWeight: 500, padding: '4px 12px', borderRadius: 8, background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569' }}>
                      ✓ {f}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Metric + CTA */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 16, flexShrink: 0, minWidth: 140 }}>
              {agent.metricValue && (
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 36, fontWeight: 800, color: ac.p, lineHeight: 1 }}>{agent.metricValue}</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{agent.metricLabel}</p>
                </div>
              )}
              {(agent.isInternal ? agent.internalPath : agent.appUrl) && (
                <button
                  onClick={handleLaunch}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, background: `linear-gradient(135deg, ${ac.p}, ${ac.s})`, color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', boxShadow: `0 6px 20px ${ac.blob1}`, whiteSpace: 'nowrap' }}
                  onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                  onMouseLeave={e => e.currentTarget.style.filter = 'none'}
                >
                  Launch Agent
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Rich Content Section ── */}
        {agent.richContent && (
          <div>
            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${ac.p}40, transparent)` }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: ac.p, letterSpacing: '0.12em', textTransform: 'uppercase', background: `${ac.p}10`, padding: '4px 14px', borderRadius: 20, border: `1px solid ${ac.p}25`, whiteSpace: 'nowrap' }}>
                Detailed Information
              </span>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, ${ac.p}40, transparent)` }} />
            </div>

            {/* Rich content card */}
            <div style={{ background: '#ffffff', borderRadius: 20, padding: '40px 44px', boxShadow: '0 4px 32px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.07)' }}>
              <div
                className="adp-rich-content"
                dangerouslySetInnerHTML={{ __html: agent.richContent }}
              />
            </div>

            {/* Bottom CTA */}
            {(agent.isInternal ? agent.internalPath : agent.appUrl) && (
              <div style={{ textAlign: 'center', marginTop: 40 }}>
                <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>Ready to get started?</p>
                <button
                  onClick={handleLaunch}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 36px', borderRadius: 14, background: `linear-gradient(135deg, ${ac.p}, ${ac.s})`, color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', boxShadow: `0 8px 28px ${ac.blob1}` }}
                  onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'none'; }}
                >
                  Launch Agent
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentDetailPage;
