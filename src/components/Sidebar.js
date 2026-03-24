import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/engagement', icon: '◈', label: 'Dashboard', exact: true },
  { path: '/engagement/customers', icon: '◉', label: 'Customers' },
  { path: '/engagement/issues', icon: '◎', label: 'Issues' },
  { path: '/engagement/chat', icon: '◆', label: 'Live Chat' },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path, exact) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <aside style={{
      width: '220px', minHeight: '100vh', flexShrink: 0,
      background: 'linear-gradient(180deg, #0a1628 0%, #0d2045 100%)',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100
    }}>
      {/* Logo */}
      <div style={{ padding: '28px 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          onClick={() => navigate('/')}>
          <div style={{
            width: 36, height: 36, borderRadius: '10px',
            background: 'linear-gradient(135deg, #00c6ff, #0072ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: 800, color: '#fff',
            fontFamily: 'var(--font-display)'
          }}>F</div>
          <div>
            <p style={{ color: '#fff', fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>FinAgent</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.1em' }}>AI PLATFORM</p>
          </div>
        </div>
      </div>

      {/* Home button */}
      <div style={{ padding: '12px 12px 0' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.55)',
            cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease',
            fontFamily: 'var(--font-body)', fontSize: '13.5px', fontWeight: 400
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
        >
          <span style={{ fontSize: '14px' }}>⌂</span>
          Home
        </button>
      </div>

      {/* Module label */}
      <div style={{ padding: '20px 20px 8px' }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Smart Engagement
        </p>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '4px 12px' }}>
        {navItems.map(item => {
          const active = isActive(item.path, item.exact);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '10px', marginBottom: '4px',
                background: active ? 'linear-gradient(135deg, rgba(0,198,255,0.15), rgba(0,114,255,0.1))' : 'transparent',
                border: active ? '1px solid rgba(0,198,255,0.2)' : '1px solid transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease',
                fontFamily: 'var(--font-body)', fontSize: '13.5px', fontWeight: active ? 600 : 400
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; } }}
            >
              <span style={{ fontSize: '14px', opacity: active ? 1 : 0.6 }}>{item.icon}</span>
              {item.label}
              {active && <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#00c6ff' }} />}
            </button>
          );
        })}
      </nav>

      {/* WhatsApp status */}
      <div style={{ padding: '16px', margin: '12px', borderRadius: '12px', background: 'rgba(0,198,255,0.08)', border: '1px solid rgba(0,198,255,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '14px' }}>📱</span>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', fontWeight: 600 }}>WhatsApp Channel</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          <p style={{ color: '#10b981', fontSize: '10px', fontWeight: 500 }}>Active · CallMeBot API</p>
        </div>
      </div>

      {/* Bottom */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #00c6ff, #0072ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 700, color: '#fff'
          }}>RA</div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', fontWeight: 600 }}>Ravi Kumar</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>Senior Agent</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
