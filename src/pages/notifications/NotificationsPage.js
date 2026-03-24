import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useApp } from '../../context/AppContext';

// ─── Notification type config ─────────────────────────────────────────────────
const TYPE_META = {
  new_message:     { icon: '💬', label: 'New Message',     color: '#1e5fb5', bg: '#eff6ff' },
  customer_reply:  { icon: '📱', label: 'Customer Reply',  color: '#059669', bg: '#d1fae5' },
  issue_created:   { icon: '🚨', label: 'New Issue',       color: '#dc2626', bg: '#fee2e2' },
  agent_assigned:  { icon: '👤', label: 'Agent Assigned',  color: '#7c3aed', bg: '#ede9fe' },
  bot_initiated:   { icon: '🤖', label: 'Bot Initiated',   color: '#0891b2', bg: '#e0f7ff' },
  issue_resolved:  { icon: '✅', label: 'Issue Resolved',  color: '#10b981', bg: '#d1fae5' },
  general:         { icon: '🔔', label: 'Notification',    color: '#94a3b8', bg: '#f8fafc' },
};

const timeAgo = (ts) => {
  const diff = Date.now() - new Date(ts).getTime();
  const sec  = Math.floor(diff / 1000);
  const min  = Math.floor(sec / 60);
  const hr   = Math.floor(min / 60);
  const day  = Math.floor(hr  / 24);
  if (day  > 0) return `${day}d ago`;
  if (hr   > 0) return `${hr}h ago`;
  if (min  > 0) return `${min}m ago`;
  return 'Just now';
};

// ─── Single notification row ──────────────────────────────────────────────────
const NotifRow = ({ notif, onClick, onMarkRead }) => {
  const meta  = TYPE_META[notif.type] || TYPE_META.general;
  const [hov, setHov] = useState(false);

  return (
    <div
      onClick={() => onClick(notif)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 18px',
        background: hov ? '#f8faff' : notif.read ? '#fff' : '#f0f7ff',
        borderLeft: notif.read ? '3px solid transparent' : '3px solid #1e5fb5',
        borderBottom: '1px solid var(--gray-100)',
        cursor: 'pointer', transition: 'background 0.15s',
      }}
    >
      {/* Type icon */}
      <div style={{ width: 40, height: 40, borderRadius: 12, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
        {meta.icon}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: meta.bg, color: meta.color }}>{meta.label}</span>
          {!notif.read && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1e5fb5', display: 'inline-block' }} />}
          {notif.customerName && (
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-700)' }}>{notif.customerName}</span>
          )}
        </div>
        <p style={{ fontSize: 13, color: 'var(--gray-700)', lineHeight: 1.5, marginBottom: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {notif.message}
        </p>
        <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{timeAgo(notif.timestamp)}</span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0, alignItems: 'flex-end' }}>
        {!notif.read && (
          <button
            onClick={e => { e.stopPropagation(); onMarkRead(notif.id); }}
            style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 6, background: '#eff6ff', color: '#1e5fb5', border: '1px solid #bfdbfe', cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
            Mark read
          </button>
        )}
        {notif.customerId && (
          <span style={{ fontSize: 10, color: 'var(--gray-400)', fontWeight: 500 }}>→ Open chat</span>
        )}
      </div>
    </div>
  );
};

// ─── Notifications page ───────────────────────────────────────────────────────
const NotificationsPage = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markNotificationRead, markAllRead, clearNotifications } = useApp();
  const [filter, setFilter] = useState('all');   // 'all' | 'unread' | type key

  const typeFilters = ['all', 'unread', ...Object.keys(TYPE_META)];

  const filtered = notifications.filter(n => {
    if (filter === 'all')    return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  const handleNotifClick = (notif) => {
    markNotificationRead(notif.id);
    if (notif.customerId) navigate(`/engagement/chat/${notif.customerId}`);
  };

  return (
    <Layout
      title="Notifications"
      subtitle={`${notifications.length} total · ${unreadCount} unread`}
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{ padding: '7px 16px', borderRadius: 8, background: '#eff6ff', color: '#1e5fb5', border: '1px solid #bfdbfe', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              ✓ Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={clearNotifications} style={{ padding: '7px 16px', borderRadius: 8, background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              🗑 Clear all
            </button>
          )}
        </div>
      }
    >
      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {typeFilters.map(f => {
          const meta  = TYPE_META[f];
          const count = f === 'all' ? notifications.length : f === 'unread' ? unreadCount : notifications.filter(n => n.type === f).length;
          if (f !== 'all' && f !== 'unread' && count === 0) return null;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 13px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)',
                background: filter === f ? (meta ? meta.bg : '#eff6ff') : '#fff',
                color:      filter === f ? (meta ? meta.color : '#1e5fb5') : 'var(--gray-500)',
                border:     `1px solid ${filter === f ? (meta ? `${meta.color}35` : '#bfdbfe') : 'var(--gray-200)'}`,
              }}
            >
              {meta && <span>{meta.icon}</span>}
              {f === 'all' ? 'All' : f === 'unread' ? 'Unread' : meta?.label}
              {count > 0 && (
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: filter === f ? (meta?.color || '#1e5fb5') : 'var(--gray-200)', color: filter === f ? '#fff' : 'var(--gray-500)', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notification list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔔</div>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--gray-700)', marginBottom: 8 }}>
            {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
          </p>
          <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>
            {filter === 'unread' ? 'No unread notifications.' : 'New messages and events will appear here.'}
          </p>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          {filtered.map((n, i) => (
            <NotifRow
              key={n.id}
              notif={n}
              onClick={handleNotifClick}
              onMarkRead={markNotificationRead}
            />
          ))}
        </div>
      )}
    </Layout>
  );
};

export default NotificationsPage;
