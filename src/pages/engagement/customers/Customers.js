import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../components/Layout';
import { Badge, Avatar, TierBadge, StatusDot, IssueStatusBadge } from '../../../components/UI';
import { useApp } from '../../../context/AppContext';

// ─── Grid view card ───────────────────────────────────────────────────────────
const CustomerCard = ({ customer, onClick }) => {
  const openIssues = customer.issues.filter(i => i.status !== 'resolved');
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)',
        padding: '20px', cursor: 'pointer', transition: 'all 0.2s ease',
        boxShadow: 'var(--shadow-sm)'
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'var(--blue-300)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--gray-200)'; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
        <Avatar initials={customer.avatar} color={customer.avatarColor} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', color: 'var(--gray-900)' }}>{customer.name}</h3>
            <TierBadge tier={customer.tier} />
          </div>
          <p style={{ fontSize: '12px', color: 'var(--gray-400)', marginTop: '2px' }}>{customer.accountNumber}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <StatusDot status={customer.status} />
          <span style={{ fontSize: '11px', color: 'var(--gray-500)', textTransform: 'capitalize' }}>
            {customer.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px', fontSize: '12px' }}>
        <div>
          <span style={{ color: 'var(--gray-400)' }}>Balance</span>
          <p style={{ fontWeight: 700, color: 'var(--gray-800)', fontFamily: 'var(--font-display)', fontSize: '14px' }}>
            ₹{customer.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <span style={{ color: 'var(--gray-400)' }}>KYC Status</span>
          <p style={{ marginTop: '2px' }}>
            <Badge variant={customer.kycStatus === 'verified' ? 'success' : 'warning'} size="sm">
              {customer.kycStatus === 'verified' ? '✓ Verified' : '⏳ Pending'}
            </Badge>
          </p>
        </div>
        <div>
          <span style={{ color: 'var(--gray-400)' }}>Phone</span>
          <p style={{ fontWeight: 500, color: 'var(--gray-700)', marginTop: '1px' }}>{customer.phone}</p>
        </div>
        <div>
          <span style={{ color: 'var(--gray-400)' }}>Member Since</span>
          <p style={{ fontWeight: 500, color: 'var(--gray-700)', marginTop: '1px' }}>{new Date(customer.joinDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' })}</p>
        </div>
      </div>

      {openIssues.length > 0 ? (
        <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: '12px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--gray-500)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Open Issues ({openIssues.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {openIssues.map(issue => (
              <div key={issue.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--gray-600)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {issue.title}
                </span>
                <IssueStatusBadge status={issue.status} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#10b981' }}>✓</span>
          <span style={{ fontSize: '12px', color: 'var(--gray-400)' }}>No open issues</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
        <button style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, background: 'var(--blue-50)', color: 'var(--blue-500)', border: '1px solid var(--blue-100)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
          💬 Chat
        </button>
        <button style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, background: 'var(--gray-50)', color: 'var(--gray-600)', border: '1px solid var(--gray-200)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
          📋 Profile
        </button>
      </div>
    </div>
  );
};

// ─── List view row ────────────────────────────────────────────────────────────
const CustomerRow = ({ customer, onClick }) => {
  const openIssues = customer.issues.filter(i => i.status !== 'resolved');
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '13px 18px',
        background: hovered ? '#f8faff' : '#fff',
        borderBottom: '1px solid var(--gray-100)',
        cursor: 'pointer', transition: 'background 0.15s',
      }}
    >
      {/* Avatar */}
      <Avatar initials={customer.avatar} color={customer.avatarColor} size={38} />

      {/* Name + account */}
      <div style={{ width: 200, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13.5px', color: 'var(--gray-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{customer.name}</span>
          <TierBadge tier={customer.tier} />
        </div>
        <p style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '1px' }}>{customer.accountNumber}</p>
      </div>

      {/* Phone */}
      <div style={{ width: 140, fontSize: '12px', color: 'var(--gray-600)', fontWeight: 500, flexShrink: 0 }}>
        {customer.phone}
      </div>

      {/* Balance */}
      <div style={{ width: 110, flexShrink: 0 }}>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px', color: 'var(--gray-800)' }}>
          ₹{customer.balance.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
        </p>
        <p style={{ fontSize: '10px', color: 'var(--gray-400)' }}>Balance</p>
      </div>

      {/* Status */}
      <div style={{ width: 90, display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
        <StatusDot status={customer.status} />
        <span style={{ fontSize: '11px', color: 'var(--gray-500)', textTransform: 'capitalize' }}>
          {customer.status.replace('_', ' ')}
        </span>
      </div>

      {/* KYC */}
      <div style={{ width: 90, flexShrink: 0 }}>
        <Badge variant={customer.kycStatus === 'verified' ? 'success' : 'warning'} size="sm">
          {customer.kycStatus === 'verified' ? '✓ KYC' : '⏳ KYC'}
        </Badge>
      </div>

      {/* Issues */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {openIssues.length > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', whiteSpace: 'nowrap' }}>
              {openIssues.length} open issue{openIssues.length > 1 ? 's' : ''}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--gray-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {openIssues[0].title}
            </span>
          </div>
        ) : (
          <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 500 }}>✓ No open issues</span>
        )}
      </div>

      {/* Chat button */}
      <button
        onClick={e => { e.stopPropagation(); onClick(); }}
        style={{
          flexShrink: 0, padding: '6px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
          background: hovered ? 'linear-gradient(135deg, #1e5fb5, #2979d8)' : 'var(--blue-50)',
          color: hovered ? '#fff' : 'var(--blue-500)',
          border: '1px solid var(--blue-100)',
          cursor: 'pointer', fontFamily: 'var(--font-body)',
          transition: 'all 0.15s',
        }}
      >
        💬 Chat
      </button>
    </div>
  );
};

// ─── View toggle icons ────────────────────────────────────────────────────────
const ListIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <circle cx="3" cy="6" r="1" fill="currentColor" stroke="none"/>
    <circle cx="3" cy="12" r="1" fill="currentColor" stroke="none"/>
    <circle cx="3" cy="18" r="1" fill="currentColor" stroke="none"/>
  </svg>
);
const GridIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
    <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
  </svg>
);

// ─── Main page ─────────────────────────────────────────────────────────────────
const Customers = () => {
  const navigate   = useNavigate();
  const { customers } = useApp();
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'

  const filtered = customers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) || c.accountNumber.includes(search);
    const matchFilter = filter === 'all' ? true :
      filter === 'issues'    ? c.issues.some(i => i.status !== 'resolved') :
      filter === 'at_risk'   ? c.status === 'at_risk' :
      filter === 'no_issues' ? !c.issues.some(i => i.status !== 'resolved') : true;
    return matchSearch && matchFilter;
  });

  return (
    <Layout
      title="Customer Directory"
      subtitle={`${customers.length} registered customers · ${customers.filter(c => c.issues.some(i => i.status !== 'resolved')).length} with active issues`}
      actions={<Badge variant="info">{filtered.length} shown</Badge>}
    >
      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search by name, phone, or account..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', fontSize: '13px', fontFamily: 'var(--font-body)', background: '#fff', outline: 'none', color: 'var(--gray-800)', boxSizing: 'border-box' }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { value: 'all',       label: 'All' },
            { value: 'issues',    label: 'Has Issues' },
            { value: 'at_risk',   label: 'At Risk' },
            { value: 'no_issues', label: 'Healthy' },
          ].map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)} style={{
              padding: '7px 14px', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: 600,
              background: filter === f.value ? 'linear-gradient(135deg, #1e5fb5, #2979d8)' : '#fff',
              color: filter === f.value ? '#fff' : 'var(--gray-600)',
              border: `1px solid ${filter === f.value ? 'transparent' : 'var(--gray-200)'}`,
              cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s',
            }}>{f.label}</button>
          ))}
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '10px', padding: '3px', gap: '2px', flexShrink: 0 }}>
          {[
            { mode: 'list', icon: <ListIcon />, label: 'List' },
            { mode: 'grid', icon: <GridIcon />, label: 'Grid' },
          ].map(v => (
            <button
              key={v.mode}
              onClick={() => setViewMode(v.mode)}
              title={`${v.label} view`}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '6px 12px', borderRadius: '8px', border: 'none',
                background: viewMode === v.mode ? '#fff' : 'transparent',
                color: viewMode === v.mode ? '#1e5fb5' : 'var(--gray-400)',
                fontWeight: 600, fontSize: '12px', cursor: 'pointer',
                boxShadow: viewMode === v.mode ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s', fontFamily: 'var(--font-body)',
              }}
            >
              {v.icon}
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--gray-700)' }}>No customers found</h3>
          <p style={{ color: 'var(--gray-400)', fontSize: '14px', marginTop: '8px' }}>Try adjusting your search or filter criteria</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {filtered.map(c => (
            <CustomerCard key={c.id} customer={c} onClick={() => navigate(`/engagement/chat/${c.id}`)} />
          ))}
        </div>
      ) : (
        /* List view */
        <div style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          {/* List header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '9px 18px', background: '#f8fafc', borderBottom: '2px solid var(--gray-200)' }}>
            <div style={{ width: 38, flexShrink: 0 }} />
            <div style={{ width: 200, fontSize: '10px', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Customer</div>
            <div style={{ width: 140, fontSize: '10px', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Phone</div>
            <div style={{ width: 110, fontSize: '10px', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Balance</div>
            <div style={{ width: 90, fontSize: '10px', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Status</div>
            <div style={{ width: 90, fontSize: '10px', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>KYC</div>
            <div style={{ flex: 1, fontSize: '10px', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Issues</div>
            <div style={{ width: 80, fontSize: '10px', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'right' }}>Action</div>
          </div>
          {filtered.map(c => (
            <CustomerRow key={c.id} customer={c} onClick={() => navigate(`/engagement/chat/${c.id}`)} />
          ))}
        </div>
      )}
    </Layout>
  );
};

export default Customers;
