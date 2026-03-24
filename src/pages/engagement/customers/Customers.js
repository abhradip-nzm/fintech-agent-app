import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../components/Layout';
import { Card, Badge, Button, Avatar, TierBadge, StatusDot, IssueStatusBadge } from '../../../components/UI';
import { useApp } from '../../../context/AppContext';

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
      {/* Header */}
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

      {/* Details */}
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

      {/* Issues */}
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
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  <IssueStatusBadge status={issue.status} />
                </div>
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

      {/* Action bar */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
        <button style={{
          flex: 1, padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
          background: 'var(--blue-50)', color: 'var(--blue-500)', border: '1px solid var(--blue-100)',
          cursor: 'pointer', fontFamily: 'var(--font-body)'
        }}>💬 Chat</button>
        <button style={{
          flex: 1, padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
          background: 'var(--gray-50)', color: 'var(--gray-600)', border: '1px solid var(--gray-200)',
          cursor: 'pointer', fontFamily: 'var(--font-body)'
        }}>📋 Profile</button>
      </div>
    </div>
  );
};

const Customers = () => {
  const navigate = useNavigate();
  const { customers } = useApp();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = customers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) || c.accountNumber.includes(search);
    const matchFilter = filter === 'all' ? true :
      filter === 'issues' ? c.issues.some(i => i.status !== 'resolved') :
      filter === 'at_risk' ? c.status === 'at_risk' :
      filter === 'no_issues' ? !c.issues.some(i => i.status !== 'resolved') : true;
    return matchSearch && matchFilter;
  });

  return (
    <Layout
      title="Customer Directory"
      subtitle={`${customers.length} registered customers · ${customers.filter(c => c.issues.some(i => i.status !== 'resolved')).length} with active issues`}
      actions={
        <Badge variant="info">{filtered.length} customers shown</Badge>
      }
    >
      {/* Search & filter */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search by name, phone, or account..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px 10px 38px',
              border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)',
              fontSize: '13px', fontFamily: 'var(--font-body)', background: '#fff',
              outline: 'none', color: 'var(--gray-800)'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { value: 'all', label: 'All Customers' },
            { value: 'issues', label: 'Has Issues' },
            { value: 'at_risk', label: 'At Risk' },
            { value: 'no_issues', label: 'Healthy' },
          ].map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)} style={{
              padding: '8px 16px', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: 600,
              background: filter === f.value ? 'linear-gradient(135deg, #1e5fb5, #2979d8)' : '#fff',
              color: filter === f.value ? '#fff' : 'var(--gray-600)',
              border: `1px solid ${filter === f.value ? 'transparent' : 'var(--gray-200)'}`,
              cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s ease'
            }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
        {filtered.map(c => (
          <CustomerCard key={c.id} customer={c} onClick={() => navigate(`/engagement/chat/${c.id}`)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--gray-700)' }}>No customers found</h3>
          <p style={{ color: 'var(--gray-400)', fontSize: '14px', marginTop: '8px' }}>Try adjusting your search or filter criteria</p>
        </div>
      )}
    </Layout>
  );
};

export default Customers;
