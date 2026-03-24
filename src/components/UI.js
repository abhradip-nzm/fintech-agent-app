import React from 'react';

// Badge component
export const Badge = ({ children, variant = 'default', size = 'md' }) => {
  const variants = {
    default: { bg: '#e2e8f0', color: '#475569' },
    success: { bg: '#d1fae5', color: '#065f46' },
    warning: { bg: '#fef3c7', color: '#92400e' },
    danger: { bg: '#fee2e2', color: '#991b1b' },
    info: { bg: '#dbeafe', color: '#1e40af' },
    purple: { bg: '#ede9fe', color: '#5b21b6' },
    gold: { bg: '#fef9c3', color: '#854d0e' },
    platinum: { bg: '#f1f5f9', color: '#334155' },
  };
  const sizes = { sm: '10px', md: '11px', lg: '12px' };
  const padding = { sm: '2px 6px', md: '3px 8px', lg: '4px 10px' };
  const v = variants[variant] || variants.default;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      background: v.bg, color: v.color,
      fontSize: sizes[size], fontWeight: 600, fontFamily: 'var(--font-body)',
      padding: padding[size], borderRadius: '20px', whiteSpace: 'nowrap'
    }}>
      {children}
    </span>
  );
};

// Status dot
export const StatusDot = ({ status }) => {
  const colors = {
    active: '#10b981', at_risk: '#f59e0b', inactive: '#94a3b8',
    open: '#ef4444', in_progress: '#f59e0b', resolved: '#10b981'
  };
  return (
    <span style={{
      display: 'inline-block', width: '8px', height: '8px',
      borderRadius: '50%', background: colors[status] || '#94a3b8',
      flexShrink: 0
    }} />
  );
};

// Avatar
export const Avatar = ({ initials, color = '#1e5fb5', size = 40 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: `${color}20`, border: `2px solid ${color}40`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: color, fontSize: size * 0.35, fontWeight: 700,
    fontFamily: 'var(--font-display)', flexShrink: 0
  }}>
    {initials}
  </div>
);

// Card
export const Card = ({ children, style = {}, onClick, hover = false }) => (
  <div
    onClick={onClick}
    style={{
      background: '#ffffff', borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--gray-200)', padding: '24px',
      boxShadow: 'var(--shadow-sm)',
      transition: 'all 0.2s ease',
      cursor: onClick ? 'pointer' : 'default',
      ...style
    }}
    onMouseEnter={hover && onClick ? (e) => {
      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      e.currentTarget.style.borderColor = 'var(--blue-300)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    } : undefined}
    onMouseLeave={hover && onClick ? (e) => {
      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      e.currentTarget.style.borderColor = 'var(--gray-200)';
      e.currentTarget.style.transform = 'translateY(0)';
    } : undefined}
  >
    {children}
  </div>
);

// Button
export const Button = ({ children, variant = 'primary', size = 'md', onClick, disabled, style = {}, icon }) => {
  const variants = {
    primary: { bg: 'linear-gradient(135deg, #1e5fb5, #2979d8)', color: '#fff', border: 'none', hover: '#1a4a8a' },
    secondary: { bg: '#fff', color: '#1e5fb5', border: '1.5px solid #1e5fb5', hover: '#eff6ff' },
    danger: { bg: '#fee2e2', color: '#dc2626', border: '1.5px solid #fca5a5', hover: '#fecaca' },
    ghost: { bg: 'transparent', color: '#475569', border: '1px solid #e2e8f0', hover: '#f1f5f9' },
    success: { bg: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7', hover: '#a7f3d0' },
  };
  const sizes = {
    sm: { padding: '6px 12px', fontSize: '12px' },
    md: { padding: '9px 18px', fontSize: '13px' },
    lg: { padding: '12px 24px', fontSize: '14px' },
  };
  const v = variants[variant];
  const s = sizes[size];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        background: v.bg, color: v.color, border: v.border,
        padding: s.padding, fontSize: s.fontSize,
        fontWeight: 600, fontFamily: 'var(--font-body)',
        borderRadius: 'var(--radius-sm)', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
        ...style
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = '0.85'; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.opacity = '1'; }}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </button>
  );
};

// Spinner
export const Spinner = ({ size = 20, color = '#1e5fb5' }) => (
  <div style={{
    width: size, height: size, border: `2px solid ${color}30`,
    borderTop: `2px solid ${color}`, borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  }} />
);

// Stat Card
export const StatCard = ({ label, value, icon, change, color = '#1e5fb5', sub }) => (
  <Card style={{ padding: '20px' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <p style={{ fontSize: '12px', color: 'var(--gray-500)', fontWeight: 500, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
        <p style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--gray-900)', lineHeight: 1.2 }}>{value}</p>
        {sub && <p style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '2px' }}>{sub}</p>}
        {change !== undefined && (
          <p style={{ fontSize: '11px', color: change >= 0 ? '#10b981' : '#ef4444', marginTop: '4px', fontWeight: 600 }}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% vs last week
          </p>
        )}
      </div>
      <div style={{
        width: 44, height: 44, borderRadius: 'var(--radius-md)',
        background: `${color}15`, display: 'flex', alignItems: 'center',
        justifyContent: 'center', color, flexShrink: 0
      }}>
        {icon}
      </div>
    </div>
  </Card>
);

// Empty state
export const EmptyState = ({ icon, title, description }) => (
  <div style={{ textAlign: 'center', padding: '48px 24px' }}>
    <div style={{ fontSize: '48px', marginBottom: '16px' }}>{icon}</div>
    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--gray-700)', marginBottom: '8px' }}>{title}</h3>
    <p style={{ color: 'var(--gray-400)', fontSize: '14px' }}>{description}</p>
  </div>
);

// Severity badge
export const SeverityBadge = ({ severity }) => {
  const map = { high: 'danger', medium: 'warning', low: 'success' };
  return <Badge variant={map[severity] || 'default'}>{severity?.toUpperCase()}</Badge>;
};

// Issue status badge
export const IssueStatusBadge = ({ status }) => {
  const map = { open: 'danger', in_progress: 'warning', resolved: 'success' };
  const labels = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved' };
  return <Badge variant={map[status] || 'default'}>{labels[status] || status}</Badge>;
};

// Tier badge
export const TierBadge = ({ tier }) => {
  const map = { Bronze: 'default', Silver: 'info', Gold: 'gold', Platinum: 'platinum' };
  return <Badge variant={map[tier] || 'default'}>{tier}</Badge>;
};
