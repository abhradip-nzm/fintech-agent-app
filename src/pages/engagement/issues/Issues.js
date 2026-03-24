import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../components/Layout';
import { Card, Badge, Button, SeverityBadge, IssueStatusBadge } from '../../../components/UI';
import { useApp } from '../../../context/AppContext';

const Issues = () => {
  const navigate = useNavigate();
  const { customers, resolveIssue } = useApp();
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Flatten all issues with customer info
  const allIssues = customers.flatMap(c =>
    c.issues.map(issue => ({ ...issue, customer: c }))
  );

  const categories = ['all', ...new Set(allIssues.map(i => i.category))];

  const filtered = allIssues.filter(issue => {
    const statusMatch = filter === 'all' ? true : issue.status === filter;
    const catMatch = categoryFilter === 'all' ? true : issue.category === categoryFilter;
    return statusMatch && catMatch;
  });

  const counts = {
    all: allIssues.length,
    open: allIssues.filter(i => i.status === 'open').length,
    in_progress: allIssues.filter(i => i.status === 'in_progress').length,
    resolved: allIssues.filter(i => i.status === 'resolved').length,
  };

  return (
    <Layout
      title="Issues Management"
      subtitle="Track, assign, and resolve customer issues across all channels"
      actions={
        <div style={{ display: 'flex', gap: '8px' }}>
          <Badge variant="danger">{counts.open} Open</Badge>
          <Badge variant="warning">{counts.in_progress} In Progress</Badge>
          <Badge variant="success">{counts.resolved} Resolved</Badge>
        </div>
      }
    >
      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { value: 'all', label: `All (${counts.all})` },
            { value: 'open', label: `Open (${counts.open})` },
            { value: 'in_progress', label: `In Progress (${counts.in_progress})` },
            { value: 'resolved', label: `Resolved (${counts.resolved})` },
          ].map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)} style={{
              padding: '8px 16px', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: 600,
              background: filter === f.value ? 'linear-gradient(135deg, #1e5fb5, #2979d8)' : '#fff',
              color: filter === f.value ? '#fff' : 'var(--gray-600)',
              border: `1px solid ${filter === f.value ? 'transparent' : 'var(--gray-200)'}`,
              cursor: 'pointer', fontFamily: 'var(--font-body)'
            }}>{f.label}</button>
          ))}
        </div>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          style={{
            padding: '8px 12px', borderRadius: 'var(--radius-md)', fontSize: '12px',
            border: '1px solid var(--gray-200)', background: '#fff', fontFamily: 'var(--font-body)',
            color: 'var(--gray-700)', outline: 'none', cursor: 'pointer'
          }}
        >
          {categories.map(c => (
            <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
          ))}
        </select>
      </div>

      {/* Issues table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                {['Customer', 'Issue', 'Category', 'Severity', 'Status', 'Assigned To', 'Last Activity', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-500)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((issue, idx) => (
                <tr key={issue.id} style={{
                  borderBottom: '1px solid var(--gray-100)',
                  background: idx % 2 === 0 ? '#fff' : 'var(--gray-50)',
                  transition: 'background 0.1s'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--blue-50)'}
                  onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : 'var(--gray-50)'}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${issue.customer.avatarColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: issue.customer.avatarColor, flexShrink: 0 }}>
                        {issue.customer.avatar}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{issue.customer.name}</p>
                        <p style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{issue.customer.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', maxWidth: '200px' }}>
                    <p style={{ fontWeight: 600, color: 'var(--gray-800)', marginBottom: '2px' }}>{issue.title}</p>
                    <p style={{ fontSize: '11px', color: 'var(--gray-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.description}</p>
                  </td>
                  <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                    <Badge variant="default" size="sm">{issue.category}</Badge>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <SeverityBadge severity={issue.severity} />
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <IssueStatusBadge status={issue.status} />
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <Badge variant={issue.assignedTo === 'ai_bot' ? 'info' : 'purple'} size="sm">
                      {issue.assignedTo === 'ai_bot' ? '🤖 AI Bot' : '👤 Human Agent'}
                    </Badge>
                  </td>
                  <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', color: 'var(--gray-400)', fontSize: '12px' }}>
                    {new Date(issue.lastActivity).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => navigate(`/engagement/chat/${issue.customer.id}`)}
                        style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: 'var(--blue-50)', color: 'var(--blue-500)', border: '1px solid var(--blue-100)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                      >View Chat</button>
                      {issue.status !== 'resolved' && (
                        <button
                          onClick={() => resolveIssue(issue.customer.id, issue.id)}
                          style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                        >Resolve</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--gray-400)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
            <p style={{ fontWeight: 600, color: 'var(--gray-600)' }}>No issues found for the selected filters</p>
          </div>
        )}
      </Card>
    </Layout>
  );
};

export default Issues;
