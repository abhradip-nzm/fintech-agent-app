import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children, title, subtitle, actions }) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--gray-50)' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: '220px', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Top header */}
        {(title || actions) && (
          <header style={{
            padding: '20px 32px',
            background: '#fff',
            borderBottom: '1px solid var(--gray-200)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            position: 'sticky', top: 0, zIndex: 50,
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
          }}>
            <div>
              {title && <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '20px', color: 'var(--gray-900)', lineHeight: 1.2 }}>{title}</h1>}
              {subtitle && <p style={{ color: 'var(--gray-500)', fontSize: '13px', marginTop: '2px' }}>{subtitle}</p>}
            </div>
            {actions && <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>{actions}</div>}
          </header>
        )}
        {/* Content */}
        <div style={{ flex: 1, padding: '28px 32px', animation: 'fadeIn 0.35s ease-out' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
