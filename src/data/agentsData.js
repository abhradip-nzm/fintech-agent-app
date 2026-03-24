// Human agent roster
export const initialHumanAgents = [
  {
    id: 'agent_ravi',
    name: 'Ravi Kumar',
    avatar: 'RK',
    avatarColor: '#1e5fb5',
    role: 'Senior Support Specialist',
    email: 'ravi.kumar@agently.io',
    phone: '+91 9000000001',
    status: 'online',        // 'online' | 'busy' | 'away' | 'offline'
    skills: ['Payment Issues', 'Account Issues', 'Escalations'],
    joinedAt: '2023-01-15',
  },
  {
    id: 'agent_meera',
    name: 'Meera Joshi',
    avatar: 'MJ',
    avatarColor: '#7c3aed',
    role: 'KYC & Compliance Specialist',
    email: 'meera.joshi@agently.io',
    phone: '+91 9000000002',
    status: 'online',
    skills: ['KYC', 'Compliance', 'Documentation'],
    joinedAt: '2023-03-20',
  },
  {
    id: 'agent_karan',
    name: 'Karan Singh',
    avatar: 'KS',
    avatarColor: '#059669',
    role: 'Technical Support Engineer',
    email: 'karan.singh@agently.io',
    phone: '+91 9000000003',
    status: 'busy',
    skills: ['Technical Issues', 'App Support', 'Login Issues'],
    joinedAt: '2023-06-10',
  },
  {
    id: 'agent_priyanka',
    name: 'Priyanka Das',
    avatar: 'PD',
    avatarColor: '#d97706',
    role: 'Customer Success Agent',
    email: 'priyanka.das@agently.io',
    phone: '+91 9000000004',
    status: 'away',
    skills: ['General Queries', 'Wallet Issues', 'Escalations'],
    joinedAt: '2024-01-05',
  },
];

export const STATUS_META = {
  online:  { label: 'Online',  color: '#10b981', bg: '#d1fae5' },
  busy:    { label: 'Busy',    color: '#f59e0b', bg: '#fef3c7' },
  away:    { label: 'Away',    color: '#94a3b8', bg: '#f1f5f9' },
  offline: { label: 'Offline', color: '#e2e8f0', bg: '#f8fafc' },
};
