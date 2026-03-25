import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { readAgents, readIndustries } from '../../utils/storage';
import './HomePage.css';

// ─── Agently Logo ─────────────────────────────────────────────────────────────
const AgentlyLogo = ({ size = 42 }) => (
  <svg width={size} height={size} viewBox="0 0 42 42" fill="none">
    <defs>
      <linearGradient id="hpLogoGrad" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#4f7cf7"/>
        <stop offset="100%" stopColor="#7c3aed"/>
      </linearGradient>
      <linearGradient id="hpLogoShine" x1="0" y1="0" x2="0" y2="21" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="rgba(255,255,255,0.22)"/>
        <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
      </linearGradient>
    </defs>
    <rect width="42" height="42" rx="11" fill="url(#hpLogoGrad)"/>
    <rect width="42" height="21" rx="10" fill="url(#hpLogoShine)"/>
    <path d="M 10 31 C 14 26 17 23 21 19 C 25 15 28 13 32 10"
      stroke="rgba(255,255,255,0.93)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <circle cx="10" cy="31" r="3.1" fill="white" opacity="0.9"/>
    <circle cx="21" cy="19" r="3.1" fill="white" opacity="0.9"/>
    <circle cx="32" cy="10" r="3.1" fill="white" opacity="0.9"/>
  </svg>
);

const SunIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

// ─── Card icon library ────────────────────────────────────────────────────────
const CARD_ICONS = {
  onboarding: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>,
  chat:       <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="12" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/></svg>,
  analytics:  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  payment:    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  security:   <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  document:   <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  robot:      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><line x1="12" y1="7" x2="12" y2="11"/><circle cx="8" cy="16" r="1" fill="currentColor"/><circle cx="16" cy="16" r="1" fill="currentColor"/></svg>,
  search:     <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
};

// ─── Accent color system ──────────────────────────────────────────────────────
const ACCENT = {
  blue:   { p: '#1e5fb5', s: '#2979d8', glow: 'rgba(30,95,181,0.28)',   border: 'rgba(41,121,216,0.28)',  tagBg: 'rgba(41,121,216,0.13)',  tagBorder: 'rgba(41,121,216,0.22)',  tagColor: 'rgba(147,197,253,0.9)', btnShadow: 'rgba(30,95,181,0.45)', cardBg: 'rgba(15,52,96,0.75)',  lightGlow: 'rgba(30,95,181,0.12)',  lightTag: '#dbeafe', lightTagColor: '#1e40af' },
  cyan:   { p: '#00c6ff', s: '#0072ff', glow: 'rgba(0,198,255,0.22)',    border: 'rgba(0,198,255,0.24)',   tagBg: 'rgba(0,198,255,0.1)',     tagBorder: 'rgba(0,198,255,0.22)',   tagColor: 'rgba(0,198,255,0.9)',   btnShadow: 'rgba(0,198,255,0.45)', cardBg: 'rgba(7,31,62,0.78)',    lightGlow: 'rgba(0,150,200,0.1)',   lightTag: '#e0f7ff', lightTagColor: '#0369a1' },
  purple: { p: '#7c3aed', s: '#9f67fa', glow: 'rgba(124,58,237,0.28)',   border: 'rgba(124,58,237,0.3)',   tagBg: 'rgba(124,58,237,0.13)',  tagBorder: 'rgba(124,58,237,0.25)', tagColor: 'rgba(196,167,255,0.9)', btnShadow: 'rgba(124,58,237,0.45)', cardBg: 'rgba(30,10,60,0.8)',    lightGlow: 'rgba(124,58,237,0.1)',  lightTag: '#ede9fe', lightTagColor: '#6d28d9' },
  green:  { p: '#059669', s: '#10b981', glow: 'rgba(5,150,105,0.25)',    border: 'rgba(16,185,129,0.28)',  tagBg: 'rgba(16,185,129,0.11)',  tagBorder: 'rgba(16,185,129,0.25)', tagColor: 'rgba(110,231,183,0.9)', btnShadow: 'rgba(5,150,105,0.45)', cardBg: 'rgba(5,30,20,0.82)',    lightGlow: 'rgba(5,150,105,0.1)',   lightTag: '#d1fae5', lightTagColor: '#065f46' },
  orange: { p: '#d97706', s: '#f59e0b', glow: 'rgba(217,119,6,0.25)',    border: 'rgba(245,158,11,0.28)',  tagBg: 'rgba(245,158,11,0.11)',  tagBorder: 'rgba(245,158,11,0.25)', tagColor: 'rgba(252,211,77,0.9)',  btnShadow: 'rgba(217,119,6,0.45)', cardBg: 'rgba(30,18,5,0.82)',    lightGlow: 'rgba(217,119,6,0.1)',   lightTag: '#fef3c7', lightTagColor: '#92400e' },
};

// ─── Agent Card ───────────────────────────────────────────────────────────────
const AgentCard = ({ agent, onClick, onViewDetails, isDark, industries = [] }) => {
  const ac   = ACCENT[agent.accentColor] || ACCENT.blue;
  const icon = CARD_ICONS[agent.iconType] || CARD_ICONS.robot;
  const [hovered, setHovered] = useState(false);
  const [detailHovered, setDetailHovered] = useState(false);

  const darkCardStyle = {
    background: `linear-gradient(145deg, rgba(10,22,40,0.92) 0%, ${ac.cardBg} 100%)`,
    border: `1px solid ${ac.border}`,
    boxShadow: hovered
      ? `0 20px 60px ${ac.glow}, 0 8px 40px rgba(0,0,0,0.4)`
      : `0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`,
  };
  const lightCardStyle = {
    background: '#ffffff',
    borderTop: `3px solid ${ac.p}`,
    border: `1px solid rgba(0,0,0,0.07)`,
    boxShadow: hovered
      ? `0 20px 56px ${ac.lightGlow}, 0 4px 24px rgba(0,0,0,0.1)`
      : `0 2px 20px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)`,
  };

  const cardStyle    = isDark ? darkCardStyle : lightCardStyle;
  const titleColor   = isDark ? '#fff' : '#0f172a';
  const subColor     = isDark ? 'rgba(255,255,255,0.55)' : '#475569';
  const metricColor  = isDark ? '#fff' : '#0f172a';
  const metricLabel  = isDark ? 'rgba(255,255,255,0.35)' : '#94a3b8';
  const badgeBg      = isDark ? `${ac.p}22` : `${ac.p}12`;
  const badgeBorder  = isDark ? `${ac.p}40` : `${ac.p}28`;
  const badgeColor   = isDark ? 'rgba(255,255,255,0.5)' : '#64748b';
  const tagBg        = isDark ? ac.tagBg    : ac.lightTag;
  const tagBorder    = isDark ? ac.tagBorder : 'transparent';
  const tagColor     = isDark ? ac.tagColor  : ac.lightTagColor;

  const hasDetails   = agent.richContent && agent.richContent.trim().replace(/<[^>]*>/g, '').trim();
  const agentIndustries = (agent.industries || [])
    .map(id => industries.find(i => i.id === id))
    .filter(Boolean);

  return (
    <div
      className="hp-agent-card"
      onClick={onClick}
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...cardStyle,
        transform: hovered ? 'translateY(-8px) scale(1.01)' : 'none',
        transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease',
      }}
    >
      {/* Glow orb (dark only) */}
      {isDark && (
        <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', filter: 'blur(80px)', top: -60, right: -60, background: ac.glow, pointerEvents: 'none' }} />
      )}

      {/* Card header */}
      <div className="hp-card-header">
        <div style={{ width: 56, height: 56, borderRadius: 16, background: `linear-gradient(135deg, ${ac.p}${isDark ? '40' : '18'}, ${ac.p}${isDark ? '20' : '0c'})`, border: `1px solid ${ac.p}${isDark ? '55' : '30'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ac.p }}>
          {icon}
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', padding: '4px 12px', borderRadius: 20, background: badgeBg, border: `1px solid ${badgeBorder}`, color: badgeColor }}>
          Agent {agent.agentNumber}
        </div>
      </div>

      {/* Card body */}
      <div className="hp-card-body">
        <h2 className="hp-card-title" style={{ color: titleColor }}>{agent.title}</h2>
        <p className="hp-card-subtitle" style={{ color: subColor }}>{agent.subtitle}</p>
      </div>

      {/* Industry chips */}
      {agentIndustries.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {agentIndustries.map(ind => (
            <span key={ind.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: `${ac.p}${isDark ? '20' : '12'}`, border: `1px solid ${ac.p}${isDark ? '35' : '25'}`, color: isDark ? 'rgba(255,255,255,0.7)' : ac.p, letterSpacing: '0.02em' }}>
              🏭 {ind.name}
            </span>
          ))}
        </div>
      )}

      {/* Features */}
      {agent.features && agent.features.length > 0 && (
        <div className="hp-card-features">
          {agent.features.slice(0, 4).map(f => (
            <span key={f} className="hp-feature-tag" style={{ background: tagBg, border: `1px solid ${tagBorder}`, color: tagColor }}>
              ✓ {f}
            </span>
          ))}
        </div>
      )}

      {/* View Details button — prominent, only if richContent exists */}
      {hasDetails && (
        <button
          onClick={e => { e.stopPropagation(); onViewDetails(); }}
          onMouseEnter={() => setDetailHovered(true)}
          onMouseLeave={() => setDetailHovered(false)}
          style={{
            width: '100%',
            padding: '11px 16px',
            borderRadius: 12,
            border: `1.5px solid ${ac.p}${detailHovered ? '' : '50'}`,
            background: detailHovered ? `${ac.p}18` : `${ac.p}08`,
            color: ac.p,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.2s ease',
            letterSpacing: '0.01em',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          View Details
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: 'auto' }}>
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      )}

      {/* Card footer */}
      <div className="hp-card-footer" style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
        <div className="hp-card-metric">
          <span className="hp-metric-value" style={{ color: metricColor }}>{agent.metricValue}</span>
          <span className="hp-metric-label" style={{ color: metricLabel }}>{agent.metricLabel}</span>
        </div>
        <button className="hp-card-btn" style={{ background: `linear-gradient(135deg, ${ac.p}, ${ac.s})`, boxShadow: `0 4px 16px ${ac.btnShadow}` }}>
          Launch Agent
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

// ─── Homepage ─────────────────────────────────────────────────────────────────
const HomePage = () => {
  const navigate    = useNavigate();
  const canvasRef   = useRef(null);
  const themeRef    = useRef(null);

  const [agents,           setAgents]          = useState([]);
  const [industries,       setIndustries]      = useState([]);
  const [loading,          setLoading]         = useState(true);
  const [theme,            setTheme]           = useState(() => localStorage.getItem('agently_theme') || 'light');
  const [searchQuery,      setSearchQuery]     = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');

  const isDark = theme === 'dark';

  useEffect(() => { themeRef.current = theme; }, [theme]);

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('agently_theme', next);
  };

  useEffect(() => {
    Promise.all([readAgents(), readIndustries()]).then(([a, inds]) => {
      setAgents(a);
      setIndustries(inds);
      setLoading(false);
    });
  }, []);

  // ── Canvas particle animation ──────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.4,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      opacity: Math.random() * 0.5 + 0.1,
    }));

    let animId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const dark = themeRef.current === 'dark';
      const pc = dark ? '41,121,216' : '79,124,247';
      const pa = dark ? 1 : 0.55;

      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${pc},${p.opacity * pa})`;
        ctx.fill();
      });
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${pc},${0.07 * pa * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  const handleCardClick = (agent) => {
    if (agent.isInternal && agent.internalPath) navigate(agent.internalPath);
    else if (agent.appUrl) window.open(agent.appUrl, '_blank', 'noopener');
  };

  const handleViewDetails = (agent) => {
    navigate(`/agent/${agent.id}`);
  };

  // ── Filter logic ──────────────────────────────────────────────────────────
  const filteredAgents = agents.filter(agent => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      (agent.title    || '').toLowerCase().includes(q) ||
      (agent.subtitle || '').toLowerCase().includes(q) ||
      (agent.features || []).some(f => f.toLowerCase().includes(q)) ||
      (agent.industries || []).some(id => {
        const ind = industries.find(i => i.id === id);
        return ind && ind.name.toLowerCase().includes(q);
      });
    const matchesIndustry = !selectedIndustry ||
      (agent.industries || []).includes(selectedIndustry);
    return matchesSearch && matchesIndustry;
  });

  const gridCols =
    filteredAgents.length === 0 ? '1fr' :
    filteredAgents.length === 1 ? 'minmax(0, 560px)' :
    filteredAgents.length === 2 ? '1fr 1fr' :
    'repeat(auto-fill, minmax(360px, 1fr))';

  // ── Show industry filter bar? ─────────────────────────────────────────────
  // Show industries that are actually used by at least one agent
  const usedIndustries = industries.filter(ind =>
    agents.some(a => (a.industries || []).includes(ind.id))
  );

  // ── Theme variables ───────────────────────────────────────────────────────
  const T = isDark ? {
    pageBg:          'transparent',
    headerBg:        'rgba(10,22,40,0.88)',
    headerBorder:    '1px solid rgba(255,255,255,0.08)',
    headerShadow:    '0 4px 20px rgba(0,0,0,0.3)',
    logoNameColor:   '#ffffff',
    logoSubColor:    'rgba(255,255,255,0.38)',
    chipBg:          'rgba(0,198,255,0.1)',
    chipBorder:      '1px solid rgba(0,198,255,0.25)',
    chipColor:       '#00c6ff',
    titleColor:      '#ffffff',
    subColor:        'rgba(255,255,255,0.58)',
    statsBg:         'rgba(255,255,255,0.04)',
    statsBorder:     '1px solid rgba(255,255,255,0.08)',
    statValueColor:  '#ffffff',
    statLabelColor:  'rgba(255,255,255,0.38)',
    statDivider:     'rgba(255,255,255,0.06)',
    adminBtnBg:      'rgba(255,255,255,0.06)',
    adminBtnBorder:  '1px solid rgba(255,255,255,0.12)',
    adminBtnColor:   'rgba(255,255,255,0.72)',
    themeBtnBg:      'rgba(255,255,255,0.06)',
    themeBtnBorder:  '1px solid rgba(255,255,255,0.12)',
    themeBtnColor:   'rgba(255,255,255,0.72)',
    statusBg:        'rgba(16,185,129,0.1)',
    statusBorder:    '1px solid rgba(16,185,129,0.22)',
    footerColor:     'rgba(255,255,255,0.2)',
    emptyTitle:      'rgba(255,255,255,0.5)',
    emptyText:       'rgba(255,255,255,0.3)',
    loadDot:         'rgba(0,198,255,0.5)',
    loadText:        'rgba(255,255,255,0.3)',
    searchBg:        'rgba(255,255,255,0.06)',
    searchBorder:    '1.5px solid rgba(255,255,255,0.12)',
    searchColor:     '#ffffff',
    searchPlaceholder: 'rgba(255,255,255,0.3)',
    filterLabelColor:'rgba(255,255,255,0.35)',
    filterBtnBg:     'rgba(255,255,255,0.05)',
    filterBtnBorder: 'rgba(255,255,255,0.12)',
    filterBtnColor:  'rgba(255,255,255,0.55)',
    filterActiveBg:  '#4f7cf7',
    filterActiveBorder: '#4f7cf7',
    filterActiveColor: '#ffffff',
    noResultColor:   'rgba(255,255,255,0.4)',
  } : {
    pageBg:          '#f0f4ff',
    headerBg:        'rgba(255,255,255,0.88)',
    headerBorder:    '1px solid rgba(0,0,0,0.07)',
    headerShadow:    '0 2px 24px rgba(30,95,181,0.08)',
    logoNameColor:   '#0f172a',
    logoSubColor:    '#64748b',
    chipBg:          'rgba(79,124,247,0.08)',
    chipBorder:      '1px solid rgba(79,124,247,0.2)',
    chipColor:       '#4f7cf7',
    titleColor:      '#0f172a',
    subColor:        '#475569',
    statsBg:         '#ffffff',
    statsBorder:     '1px solid rgba(0,0,0,0.07)',
    statValueColor:  '#0f172a',
    statLabelColor:  '#94a3b8',
    statDivider:     '#f1f5f9',
    adminBtnBg:      'rgba(79,124,247,0.07)',
    adminBtnBorder:  '1px solid rgba(79,124,247,0.18)',
    adminBtnColor:   '#4f7cf7',
    themeBtnBg:      '#ffffff',
    themeBtnBorder:  '1px solid #e2e8f0',
    themeBtnColor:   '#475569',
    statusBg:        'rgba(16,185,129,0.08)',
    statusBorder:    '1px solid rgba(16,185,129,0.2)',
    footerColor:     '#94a3b8',
    emptyTitle:      '#475569',
    emptyText:       '#94a3b8',
    loadDot:         'rgba(79,124,247,0.45)',
    loadText:        '#94a3b8',
    searchBg:        '#ffffff',
    searchBorder:    '1.5px solid #e2e8f0',
    searchColor:     '#0f172a',
    searchPlaceholder: '#94a3b8',
    filterLabelColor: '#94a3b8',
    filterBtnBg:     '#ffffff',
    filterBtnBorder: '#e2e8f0',
    filterBtnColor:  '#64748b',
    filterActiveBg:  '#4f7cf7',
    filterActiveBorder: '#4f7cf7',
    filterActiveColor: '#ffffff',
    noResultColor:   '#64748b',
  };

  return (
    <div
      className="homepage"
      style={{ background: isDark ? 'linear-gradient(135deg,#050d1a 0%,#0a1628 50%,#0d2045 100%)' : T.pageBg }}
    >
      <canvas ref={canvasRef} className="homepage-canvas" />

      {/* Light theme blobs */}
      {!isDark && <>
        <div style={{ position: 'fixed', top: -100, right: -100, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,124,247,0.12) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'fixed', bottom: -80, left: -80,  width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'fixed', top: '40%', left: '20%',  width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,198,255,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      </>}

      {/* ── Header ── */}
      <header
        className="hp-header"
        style={{ background: T.headerBg, border: T.headerBorder, boxShadow: T.headerShadow, backdropFilter: isDark ? 'none' : 'blur(16px)', WebkitBackdropFilter: isDark ? 'none' : 'blur(16px)' }}
      >
        <div className="hp-logo">
          <AgentlyLogo size={42} />
          <div>
            <span className="hp-logo-name" style={{ color: T.logoNameColor }}>Agently</span>
            <span className="hp-logo-sub"  style={{ color: T.logoSubColor }}>BY NEXTZEN MINDS</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={toggleTheme} className="hp-theme-btn" title={isDark ? 'Switch to light mode' : 'Switch to dark mode'} style={{ background: T.themeBtnBg, border: T.themeBtnBorder, color: T.themeBtnColor }}>
            {isDark ? <SunIcon /> : <MoonIcon />}
            {isDark ? 'Light' : 'Dark'}
          </button>
          <button onClick={() => navigate('/admin')} className="hp-admin-btn" style={{ background: T.adminBtnBg, border: T.adminBtnBorder, color: T.adminBtnColor }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>
            Super Admin
          </button>
          <div className="hp-header-right" style={{ background: T.statusBg, border: T.statusBorder }}>
            <span className="hp-status-dot" />
            <span className="hp-status-text">All Systems Operational</span>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="hp-hero">
        <div className="hp-hero-badge">
          <span className="hp-ai-chip" style={{ background: T.chipBg, border: T.chipBorder, color: T.chipColor }}>
            ✦ Smart Agents Powered by NextZen Minds
          </span>
        </div>
        <h1 className="hp-hero-title" style={{ color: T.titleColor }}>
          AI Agent<br />
          <span style={{ background: 'linear-gradient(135deg, #4f7cf7, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Marketplace</span>
        </h1>
        <p className="hp-hero-sub" style={{ color: T.subColor }}>
          Deploy intelligent agents that handle complex workflows, engage your customers,
          and drive measurable outcomes — across any industry, at any scale.
        </p>
      </section>

      {/* ── Search + Filter bar ── */}
      {!loading && agents.length > 0 && (
        <section style={{ width: '100%', maxWidth: 1140, padding: '0 40px 28px', position: 'relative', zIndex: 10, boxSizing: 'border-box' }}>
          {/* Search input */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: T.searchPlaceholder }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search agents by name, description, features, or industry…"
              style={{
                width: '100%', padding: '12px 16px 12px 44px',
                borderRadius: 12, border: T.searchBorder,
                background: T.searchBg, color: T.searchColor,
                fontSize: 14, fontFamily: 'Inter, sans-serif',
                outline: 'none', boxSizing: 'border-box',
                boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.05)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor = '#4f7cf7'; e.target.style.boxShadow = '0 0 0 3px rgba(79,124,247,0.12)'; }}
              onBlur={e => { e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0'; e.target.style.boxShadow = isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.05)'; }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.filterLabelColor, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 2 }}>✕</button>
            )}
          </div>

          {/* Industry filter pills */}
          {usedIndustries.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: T.filterLabelColor, textTransform: 'uppercase', letterSpacing: '0.1em', flexShrink: 0 }}>Industry:</span>
              {/* All pill */}
              <button
                onClick={() => setSelectedIndustry('')}
                style={{
                  padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  border: `1.5px solid ${selectedIndustry === '' ? T.filterActiveBorder : T.filterBtnBorder}`,
                  background: selectedIndustry === '' ? T.filterActiveBg : T.filterBtnBg,
                  color: selectedIndustry === '' ? T.filterActiveColor : T.filterBtnColor,
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
                }}
              >
                All
              </button>
              {usedIndustries.map(ind => {
                const active = selectedIndustry === ind.id;
                return (
                  <button
                    key={ind.id}
                    onClick={() => setSelectedIndustry(active ? '' : ind.id)}
                    style={{
                      padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      border: `1.5px solid ${active ? T.filterActiveBorder : T.filterBtnBorder}`,
                      background: active ? T.filterActiveBg : T.filterBtnBg,
                      color: active ? T.filterActiveColor : T.filterBtnColor,
                      cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    <span style={{ fontSize: 11 }}>🏭</span>
                    {ind.name}
                  </button>
                );
              })}

              {/* Result count badge */}
              {(searchQuery || selectedIndustry) && (
                <span style={{ fontSize: 11, color: T.filterLabelColor, marginLeft: 4 }}>
                  {filteredAgents.length} result{filteredAgents.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </section>
      )}

      {/* ── Agent Cards ── */}
      <section className="hp-cards" style={{ gridTemplateColumns: gridCols }}>
        {loading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 0' }}>
            <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: T.loadDot, animation: `pulse 1.2s ${i * 0.2}s ease-in-out infinite` }} />
              ))}
            </div>
            <p style={{ color: T.loadText, fontSize: 13, marginTop: 10 }}>Loading agents…</p>
          </div>
        ) : agents.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
            <p style={{ color: T.emptyTitle, fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No agents yet</p>
            <p style={{ color: T.emptyText, fontSize: 13, marginBottom: 24 }}>Visit Super Admin to create your first agent card.</p>
            <button onClick={() => navigate('/admin')} style={{ padding: '10px 24px', borderRadius: 10, background: 'linear-gradient(135deg,#4f7cf7,#7c3aed)', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', boxShadow: '0 4px 16px rgba(79,124,247,0.35)' }}>
              Open Super Admin →
            </button>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>🔍</div>
            <p style={{ color: T.emptyTitle, fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No agents match your search</p>
            <p style={{ color: T.emptyText, fontSize: 13, marginBottom: 20 }}>Try adjusting your search or removing the industry filter.</p>
            <button onClick={() => { setSearchQuery(''); setSelectedIndustry(''); }} style={{ padding: '9px 22px', borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9', color: T.noResultColor, fontSize: 13, fontWeight: 600, border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              Clear Filters
            </button>
          </div>
        ) : filteredAgents.map(agent => (
          <AgentCard
            key={agent.id}
            agent={agent}
            isDark={isDark}
            industries={industries}
            onClick={() => handleCardClick(agent)}
            onViewDetails={() => handleViewDetails(agent)}
          />
        ))}
      </section>

      {/* ── Footer ── */}
      <footer className="hp-footer">
        <p style={{ color: T.footerColor }}>© 2026 Agently · Smart Agents Powered by NextZen Minds</p>
      </footer>
    </div>
  );
};

export default HomePage;
