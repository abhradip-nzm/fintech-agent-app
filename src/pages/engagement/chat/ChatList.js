import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../components/Layout';
import { Badge, Avatar, IssueStatusBadge } from '../../../components/UI';
import { useApp } from '../../../context/AppContext';

const ChatList = () => {
  const navigate = useNavigate();
  const { customers, conversations, agentMode } = useApp();

  // Customers who have conversations
  const customersWithChats = customers.filter(c => conversations[c.id]?.length > 0);
  const allCustomers = [...customersWithChats, ...customers.filter(c => !conversations[c.id]?.length)];

  return (
    <Layout
      title="Live Chat"
      subtitle="All WhatsApp conversations — AI-assisted and human agent threads"
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '14px' }}>
        {allCustomers.map(customer => {
          const msgs = conversations[customer.id] || [];
          const lastMsg = msgs[msgs.length - 1];
          const openIssues = customer.issues.filter(i => i.status !== 'resolved');
          const isHuman = agentMode[customer.id] === 'human';
          const unread = msgs.filter(m => m.sender === 'customer' && !m.read).length;

          return (
            <div
              key={customer.id}
              onClick={() => navigate(`/engagement/chat/${customer.id}`)}
              style={{
                background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)',
                padding: '16px', cursor: 'pointer', transition: 'all 0.2s ease',
                position: 'relative', overflow: 'hidden'
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'var(--blue-300)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--gray-200)'; e.currentTarget.style.transform = 'none'; }}
            >
              {/* Unread indicator */}
              {unread > 0 && (
                <div style={{
                  position: 'absolute', top: 12, right: 12,
                  width: 20, height: 20, borderRadius: '50%',
                  background: '#ef4444', color: '#fff', fontSize: '10px',
                  fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>{unread}</div>
              )}

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ position: 'relative' }}>
                  <Avatar initials={customer.avatar} color={customer.avatarColor} size={44} />
                  <span style={{
                    position: 'absolute', bottom: 0, right: 0, width: 12, height: 12,
                    borderRadius: '50%', background: msgs.length > 0 ? '#10b981' : '#94a3b8',
                    border: '2px solid #fff'
                  }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px', color: 'var(--gray-900)' }}>{customer.name}</h4>
                    {lastMsg && (
                      <span style={{ fontSize: '10px', color: 'var(--gray-400)' }}>
                        {new Date(lastMsg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <Badge variant={isHuman ? 'purple' : 'info'} size="sm">
                      {isHuman ? '👤 Human Mode' : '🤖 AI Mode'}
                    </Badge>
                    {openIssues.length > 0 && <Badge variant="danger" size="sm">{openIssues.length} issue{openIssues.length > 1 ? 's' : ''}</Badge>}
                  </div>
                  {lastMsg ? (
                    <p style={{ fontSize: '12px', color: 'var(--gray-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 500, color: lastMsg.sender === 'customer' ? 'var(--gray-600)' : 'var(--blue-500)' }}>
                        {lastMsg.sender === 'customer' ? customer.name.split(' ')[0] : lastMsg.sender === 'ai_bot' ? '🤖' : '👤'}:
                      </span>{' '}
                      {lastMsg.message}
                    </p>
                  ) : (
                    <p style={{ fontSize: '12px', color: 'var(--gray-300)', fontStyle: 'italic' }}>No messages yet — click to start</p>
                  )}
                </div>
              </div>

              {/* Open issues preview */}
              {openIssues.length > 0 && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--gray-100)' }}>
                  {openIssues.slice(0, 2).map(issue => (
                    <div key={issue.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: issue.severity === 'high' ? '#ef4444' : '#f59e0b', flexShrink: 0 }} />
                      <span style={{ fontSize: '11px', color: 'var(--gray-500)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.title}</span>
                      <IssueStatusBadge status={issue.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Layout>
  );
};

export default ChatList;
