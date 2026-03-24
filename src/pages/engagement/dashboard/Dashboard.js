import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import Layout from '../../../components/Layout';
import { StatCard, Card, Button, Badge } from '../../../components/UI';
import { useApp } from '../../../context/AppContext';
import { analyticsData, issueCategories, resolutionTrend } from '../../../data/mockData';

const Dashboard = () => {
  const navigate = useNavigate();
  const { customers } = useApp();
  const openIssues = customers.flatMap(c => c.issues.filter(i => i.status !== 'resolved'));
  const atRiskCustomers = customers.filter(c => c.status === 'at_risk');

  const COLORS = ['#ef4444', '#f59e0b', '#8b5cf6', '#3b82f6', '#10b981'];

  return (
    <Layout
      title="Smart Engagement Dashboard"
      subtitle="Real-time view of customer health, issues, and AI agent performance"
      actions={
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#d1fae5', borderRadius: '8px', border: '1px solid #6ee7b7' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#065f46' }}>AI Agents Active</span>
          </div>
          <Button variant="primary" onClick={() => navigate('/engagement/customers')}>
            View Customers →
          </Button>
        </div>
      }
    >
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <StatCard
          label="Total Customers"
          value={analyticsData.totalCustomers.toLocaleString()}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
          change={analyticsData.monthlyGrowth}
          color="#1e5fb5"
          sub="1,089 active this month"
        />
        <StatCard
          label="Open Issues"
          value={openIssues.length}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
          change={-8.2}
          color="#ef4444"
          sub={`${atRiskCustomers.length} customers at risk`}
        />
        <StatCard
          label="AI Resolution Rate"
          value={`${analyticsData.aiResolutionRate}%`}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/></svg>}
          change={3.1}
          color="#10b981"
          sub="78.5% resolved without human"
        />
        <StatCard
          label="Avg. Resolution"
          value={analyticsData.avgResolutionTime}
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
          change={-12.5}
          color="#f59e0b"
          sub="Down from 2.8hrs last week"
        />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Resolution trend */}
        <Card style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', color: 'var(--gray-900)' }}>Weekly Resolution Trend</h3>
            <p style={{ fontSize: '12px', color: 'var(--gray-400)', marginTop: '2px' }}>AI vs Human agent resolutions this week</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={resolutionTrend} barSize={14} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: '12px' }}
              />
              <Bar dataKey="aiResolved" name="AI Resolved" fill="#1e5fb5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="humanResolved" name="Human Resolved" fill="#93c5fd" radius={[4, 4, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Issue categories pie */}
        <Card style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', color: 'var(--gray-900)' }}>Issue Categories</h3>
            <p style={{ fontSize: '12px', color: 'var(--gray-400)', marginTop: '2px' }}>Distribution of open issues</p>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={issueCategories} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="count">
                {issueCategories.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val) => [val, 'Issues']} contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
            {issueCategories.map((c, i) => (
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '2px', background: COLORS[i], display: 'inline-block' }} />
                  <span style={{ fontSize: '11px', color: 'var(--gray-600)' }}>{c.name}</span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--gray-700)' }}>{c.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent issues & customer activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Active issues */}
        <Card style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', color: 'var(--gray-900)' }}>Active Issues</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/engagement/issues')}>View All →</Button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {openIssues.slice(0, 5).map(issue => {
              const customer = customers.find(c => c.issues.some(i => i.id === issue.id));
              return (
                <div key={issue.id} style={{
                  padding: '12px', borderRadius: '10px', background: 'var(--gray-50)',
                  border: '1px solid var(--gray-100)', cursor: 'pointer',
                  transition: 'border-color 0.15s'
                }}
                  onClick={() => navigate(`/engagement/chat/${customer?.id}`)}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--blue-200)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--gray-100)'}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-800)', marginBottom: '2px' }}>{issue.title}</p>
                      <p style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{customer?.name} · {issue.category}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                      <Badge variant={issue.severity === 'high' ? 'danger' : issue.severity === 'medium' ? 'warning' : 'success'} size="sm">
                        {issue.severity}
                      </Badge>
                      <Badge variant={issue.assignedTo === 'ai_bot' ? 'info' : 'purple'} size="sm">
                        {issue.assignedTo === 'ai_bot' ? '🤖 AI' : '👤 Human'}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* At-risk customers + WhatsApp status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', color: 'var(--gray-900)' }}>At-Risk Customers</h3>
              <Badge variant="danger">{atRiskCustomers.length} flagged</Badge>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {atRiskCustomers.map(c => (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px', borderRadius: '10px', background: '#fff7ed',
                  border: '1px solid #fed7aa', cursor: 'pointer'
                }} onClick={() => navigate(`/engagement/chat/${c.id}`)}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${c.avatarColor}20`, border: `2px solid ${c.avatarColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: c.avatarColor, flexShrink: 0 }}>{c.avatar}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-800)' }}>{c.name}</p>
                    <p style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '1px' }}>{c.issues.filter(i => i.status !== 'resolved').length} open issue(s)</p>
                  </div>
                  <Badge variant="warning" size="sm">At Risk</Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* WhatsApp integration status */}
          <Card style={{ padding: '20px', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #86efac' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontSize: '24px' }}>📱</span>
              <div>
                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px', color: '#065f46' }}>WhatsApp Channel · CallMeBot API</h4>
                <p style={{ fontSize: '11px', color: '#16a34a' }}>Connected & Active</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#166534' }}>
              <div><strong>23</strong><br /><span style={{ color: '#16a34a', fontSize: '10px' }}>Msgs Today</span></div>
              <div><strong>+91 8617269309</strong><br /><span style={{ color: '#16a34a', fontSize: '10px' }}>Demo Number</span></div>
              <div><strong>Free Tier</strong><br /><span style={{ color: '#16a34a', fontSize: '10px' }}>API Plan</span></div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
