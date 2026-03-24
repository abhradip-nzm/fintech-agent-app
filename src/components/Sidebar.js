import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const navItems = [
  { path: '/engagement',           icon: '◈', label: 'Dashboard',  exact: true },
  { path: '/engagement/customers', icon: '◉', label: 'Customers' },
  { path: '/engagement/issues',    icon: '◎', label: 'Issues' },
  { path: '/engagement/chat',      icon: '◆', label: 'Live Chat' },
  { path: '/engagement/agents',    icon: '👥', label: 'Agents' },
  { path: '/notifications',        icon: null,  label: 'Notifications', isBell: true },
];

const Sidebar = () => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { unreadCount } = useApp();

  const isActive = (path, exact) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <aside style={{
      width: '220px', minHeight: '100vh', flexShrink: 0,
      background: 'linear-gradient(180deg, #0a1628 0%, #0d2045 100%)',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100,
    }}>
      {/* ── Logo ── */}
      <div style={{ padding: '28px 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <svg width="36" height="36" viewBox="0 0 42 42" fill="none">
            <defs>
              <linearGradient id="sbLogoGrad" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#4f7cf7"/>
                <stop offset="100%" stopColor="#7c3aed"/>
              </linearGradient>
              <linearGradient id="sbLogoShine" x1="0" y1="0" x2="0" y2="21" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="rgba(255,255,255,0.22)"/>
                <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
              </linearGradient>
            </defs>
            <rect width="42" height="42" rx="11" fill="url(#sbLogoGrad)"/>
            <rect width="42" height="21" rx="10" fill="url(#sbLogoShine)"/>
            <path d="M 10 31 C 14 26 17 23 21 19 C 25 15 28 13 32 10" stroke="rgba(255,255,255,0.93)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <circle cx="10" cy="31" r="3.1" fill="white" opacity="0.9"/>
            <circle cx="21" cy="19" r="3.1" fill="white" opacity="0.9"/>
            <circle cx="32" cy="10" r="3.1" fill="white" opacity="0.9"/>
          </svg>
          <div>
            <p style={{ color: '#fff', fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>Agently</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', letterSpacing: '0.12em' }}>BY NEXTZEN MINDS</p>
          </div>
        </div>
      </div>

      {/* ── Home button ── */}
      <div style={{ padding: '12px 12px 0' }}>
        <button
          onClick={() => navigate('/')}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', fontFamily: 'var(--font-body)', fontSize: '13.5px', fontWeight: 400 }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
        >
          <span style={{ fontSize: '14px' }}>⌂</span>
          Home
        </button>
      </div>

      {/* ── Section label ── */}
      <div style={{ padding: '20px 20px 8px' }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Smart Engagement
        </p>
      </div>

      {/* ── Nav items ── */}
      <nav style={{ flex: 1, padding: '4px 12px', overflowY: 'auto' }}>
        {navItems.map(item => {
          const active = isActive(item.path, item.exact);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '10px', marginBottom: '3px',
                background: active ? 'linear-gradient(135deg, rgba(0,198,255,0.15), rgba(0,114,255,0.1))' : 'transparent',
                border: active ? '1px solid rgba(0,198,255,0.2)' : '1px solid transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                fontFamily: 'var(--font-body)', fontSize: '13.5px', fontWeight: active ? 600 : 400,
                position: 'relative',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; } }}
            >
              {/* Bell icon for notifications */}
              {item.isBell ? (
                <span style={{ fontSize: '15px', position: 'relative' }}>
                  🔔
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute', top: -6, right: -8,
                      minWidth: 16, height: 16, borderRadius: 10,
                      background: '#ef4444', color: '#fff',
                      fontSize: 9, fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 4px', lineHeight: 1, border: '1.5px solid #0a1628',
                    }}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </span>
              ) : (
                <span style={{ fontSize: '14px', opacity: active ? 1 : 0.6 }}>{item.icon}</span>
              )}

              {item.label}

              {/* Unread badge in row (for Notifications only) */}
              {item.isBell && unreadCount > 0 && (
                <span style={{ marginLeft: 'auto', padding: '1px 7px', borderRadius: 10, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 800 }}>
                  {unreadCount}
                </span>
              )}

              {/* Active dot for other items */}
              {active && !item.isBell && (
                <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#00c6ff' }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── WhatsApp status ── */}
      <div style={{ padding: '16px', margin: '0 12px 8px', borderRadius: '12px', background: 'rgba(0,198,255,0.08)', border: '1px solid rgba(0,198,255,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '14px' }}>📱</span>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', fontWeight: 600 }}>WhatsApp Channel</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          <p style={{ color: '#10b981', fontSize: '10px', fontWeight: 500 }}>Active · Whapi.Cloud</p>
        </div>
      </div>

      {/* ── Current user ── */}
      <div style={{ padding: '14px 20px 18px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #4f7cf7, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff' }}>RK</div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', fontWeight: 600 }}>Ravi Kumar</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>Senior Agent</p>
          </div>
          {/* Online dot */}
          <span style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
