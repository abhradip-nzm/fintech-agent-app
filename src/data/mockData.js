// Mock Customer Data
export const customers = [
  {
    id: 'cust_001',
    name: 'Arjun Sharma',
    phone: '+91 9876543210',
    whatsapp: '+919876543210',
    email: 'arjun.sharma@email.com',
    avatar: 'AS',
    avatarColor: '#1e5fb5',
    accountNumber: 'FIN-2024-001',
    balance: 24580.50,
    joinDate: '2023-03-15',
    tier: 'Gold',
    status: 'active',
    kycStatus: 'verified',
    issues: [
      {
        id: 'issue_001',
        type: 'payment_failure',
        title: 'Unable to Complete UPI Payment',
        description: 'Customer failed to make a ₹5000 payment to merchant. Transaction declined 3 times.',
        severity: 'high',
        status: 'open',
        createdAt: '2024-12-18T10:30:00',
        lastActivity: '2024-12-18T14:22:00',
        assignedTo: 'ai_bot',
        category: 'Payment Issues'
      }
    ],
    transactions: [
      { id: 'txn_001', type: 'credit', amount: 15000, description: 'Salary Credit', date: '2024-12-15', status: 'success' },
      { id: 'txn_002', type: 'debit', amount: 5000, description: 'UPI Payment Failed', date: '2024-12-18', status: 'failed' },
      { id: 'txn_003', type: 'debit', amount: 2500, description: 'Bill Payment', date: '2024-12-17', status: 'success' },
    ]
  },
  {
    id: 'cust_002',
    name: 'Priya Patel',
    phone: '+91 8765432109',
    whatsapp: '+918765432109',
    email: 'priya.patel@email.com',
    avatar: 'PP',
    avatarColor: '#7c3aed',
    accountNumber: 'FIN-2024-002',
    balance: 8920.00,
    joinDate: '2023-07-22',
    tier: 'Silver',
    status: 'active',
    kycStatus: 'verified',
    issues: [
      {
        id: 'issue_002',
        type: 'wallet_topup',
        title: 'Wallet Top-up Not Reflected',
        description: 'Customer added ₹2000 to wallet via net banking but balance not updated after 2 hours.',
        severity: 'medium',
        status: 'in_progress',
        createdAt: '2024-12-17T08:15:00',
        lastActivity: '2024-12-18T09:45:00',
        assignedTo: 'ai_bot',
        category: 'Wallet Issues'
      }
    ],
    transactions: [
      { id: 'txn_004', type: 'credit', amount: 2000, description: 'Wallet Top-up (Pending)', date: '2024-12-17', status: 'pending' },
      { id: 'txn_005', type: 'debit', amount: 500, description: 'Online Shopping', date: '2024-12-16', status: 'success' },
    ]
  },
  {
    id: 'cust_003',
    name: 'Rahul Mehta',
    phone: '+91 7654321098',
    whatsapp: '+917654321098',
    email: 'rahul.mehta@email.com',
    avatar: 'RM',
    avatarColor: '#059669',
    accountNumber: 'FIN-2024-003',
    balance: 52340.75,
    joinDate: '2022-11-10',
    tier: 'Platinum',
    status: 'active',
    kycStatus: 'verified',
    issues: [],
    transactions: [
      { id: 'txn_006', type: 'credit', amount: 50000, description: 'FD Maturity', date: '2024-12-10', status: 'success' },
      { id: 'txn_007', type: 'debit', amount: 12000, description: 'Loan EMI', date: '2024-12-05', status: 'success' },
      { id: 'txn_008', type: 'credit', amount: 8000, description: 'Dividend Credit', date: '2024-12-01', status: 'success' },
    ]
  },
  {
    id: 'cust_004',
    name: 'Sneha Gupta',
    phone: '+91 6543210987',
    whatsapp: '+916543210987',
    email: 'sneha.gupta@email.com',
    avatar: 'SG',
    avatarColor: '#dc2626',
    accountNumber: 'FIN-2024-004',
    balance: 3450.20,
    joinDate: '2024-01-05',
    tier: 'Bronze',
    status: 'at_risk',
    kycStatus: 'pending',
    issues: [
      {
        id: 'issue_003',
        type: 'kyc_incomplete',
        title: 'KYC Verification Pending',
        description: 'Customer submitted KYC documents but Aadhaar verification is still pending. Account limits applied.',
        severity: 'high',
        status: 'open',
        createdAt: '2024-12-16T11:00:00',
        lastActivity: '2024-12-16T11:00:00',
        assignedTo: 'human_agent',
        category: 'KYC & Compliance'
      },
      {
        id: 'issue_004',
        type: 'login_issue',
        title: 'Cannot Login to Mobile App',
        description: 'Customer reports app login fails after OTP. Reset required.',
        severity: 'medium',
        status: 'resolved',
        createdAt: '2024-12-15T09:30:00',
        lastActivity: '2024-12-15T12:45:00',
        assignedTo: 'ai_bot',
        category: 'Technical Issues'
      }
    ],
    transactions: [
      { id: 'txn_009', type: 'credit', amount: 5000, description: 'Initial Deposit', date: '2024-01-05', status: 'success' },
      { id: 'txn_010', type: 'debit', amount: 1500, description: 'Debit Card Purchase', date: '2024-12-12', status: 'success' },
    ]
  },
  {
    id: 'cust_005',
    name: 'Vikram Singh',
    phone: '+91 5432109876',
    whatsapp: '+915432109876',
    email: 'vikram.singh@email.com',
    avatar: 'VS',
    avatarColor: '#b45309',
    accountNumber: 'FIN-2024-005',
    balance: 18750.00,
    joinDate: '2023-05-18',
    tier: 'Gold',
    status: 'active',
    kycStatus: 'verified',
    issues: [
      {
        id: 'issue_005',
        type: 'payment_failure',
        title: 'International Transfer Blocked',
        description: 'Customer attempting to send $200 to USA. Transaction flagged by fraud detection.',
        severity: 'high',
        status: 'in_progress',
        createdAt: '2024-12-18T13:00:00',
        lastActivity: '2024-12-18T15:30:00',
        assignedTo: 'human_agent',
        category: 'Payment Issues'
      }
    ],
    transactions: [
      { id: 'txn_011', type: 'debit', amount: 16500, description: 'International Transfer (Blocked)', date: '2024-12-18', status: 'failed' },
      { id: 'txn_012', type: 'credit', amount: 25000, description: 'Salary', date: '2024-12-01', status: 'success' },
    ]
  },
  {
    id: 'cust_006',
    name: 'Anjali Reddy',
    phone: '+91 4321098765',
    whatsapp: '+914321098765',
    email: 'anjali.reddy@email.com',
    avatar: 'AR',
    avatarColor: '#0891b2',
    accountNumber: 'FIN-2024-006',
    balance: 71200.80,
    joinDate: '2022-08-30',
    tier: 'Platinum',
    status: 'active',
    kycStatus: 'verified',
    issues: [],
    transactions: [
      { id: 'txn_013', type: 'credit', amount: 30000, description: 'Business Income', date: '2024-12-15', status: 'success' },
      { id: 'txn_014', type: 'debit', amount: 5000, description: 'SIP Investment', date: '2024-12-10', status: 'success' },
      { id: 'txn_015', type: 'debit', amount: 8000, description: 'Insurance Premium', date: '2024-12-05', status: 'success' },
    ]
  }
];

// Mock conversations
export const conversations = {
  'cust_001': [
    {
      id: 'msg_001',
      sender: 'customer',
      senderName: 'Arjun Sharma',
      message: 'Hello, I am unable to make a UPI payment. It keeps getting declined. Please help!',
      timestamp: '2024-12-18T10:30:00',
      channel: 'whatsapp',
      read: true
    },
    {
      id: 'msg_002',
      sender: 'ai_bot',
      senderName: 'FinAgent AI',
      message: "Hello Arjun! I'm sorry to hear you're facing issues with your UPI payment. I can see your transaction history. Could you please tell me which UPI app you're using and the error message you received?",
      timestamp: '2024-12-18T10:31:00',
      channel: 'whatsapp',
      read: true
    },
    {
      id: 'msg_003',
      sender: 'customer',
      senderName: 'Arjun Sharma',
      message: 'I am using Google Pay. The error says "Transaction declined by bank". I tried 3 times already.',
      timestamp: '2024-12-18T10:35:00',
      channel: 'whatsapp',
      read: true
    },
    {
      id: 'msg_004',
      sender: 'ai_bot',
      senderName: 'FinAgent AI',
      message: "I understand your frustration, Arjun. I've checked your account and noticed your daily UPI limit was reached earlier today. Your limit will reset at midnight. Alternatively, you can increase your UPI limit in the app settings. Would you like me to guide you through that process?",
      timestamp: '2024-12-18T10:36:00',
      channel: 'whatsapp',
      read: true
    },
    {
      id: 'msg_005',
      sender: 'customer',
      senderName: 'Arjun Sharma',
      message: "Oh! I didn't know about the limit. Can you help me increase it?",
      timestamp: '2024-12-18T14:20:00',
      channel: 'whatsapp',
      read: true
    },
    {
      id: 'msg_006',
      sender: 'ai_bot',
      senderName: 'FinAgent AI',
      message: "Of course! Here are the steps:\n1. Open the FinAgent app\n2. Go to Settings → Payment Settings\n3. Select 'UPI Daily Limit'\n4. Enter your new limit (max ₹1,00,000 per day)\n5. Authenticate with your PIN\n\nWould you like me to send you a direct deep link to that setting?",
      timestamp: '2024-12-18T14:22:00',
      channel: 'whatsapp',
      read: false
    }
  ],
  'cust_002': [
    {
      id: 'msg_007',
      sender: 'customer',
      senderName: 'Priya Patel',
      message: 'I added ₹2000 to my wallet 2 hours ago but it is not showing in my balance!',
      timestamp: '2024-12-17T08:15:00',
      channel: 'whatsapp',
      read: true
    },
    {
      id: 'msg_008',
      sender: 'ai_bot',
      senderName: 'FinAgent AI',
      message: "Hi Priya! I completely understand how concerning this must be. I can see a pending credit of ₹2,000 from your net banking. Our system shows the transaction is being processed. Net banking top-ups can sometimes take up to 4 hours. Could you share the bank reference number from your net banking statement?",
      timestamp: '2024-12-17T08:16:00',
      channel: 'whatsapp',
      read: true
    },
    {
      id: 'msg_009',
      sender: 'customer',
      senderName: 'Priya Patel',
      message: 'Reference number is SBIN240000234567. It has been deducted from my bank already!',
      timestamp: '2024-12-17T09:00:00',
      channel: 'whatsapp',
      read: true
    },
    {
      id: 'msg_010',
      sender: 'ai_bot',
      senderName: 'FinAgent AI',
      message: "Thank you, Priya. I've located the transaction with reference SBIN240000234567. The money was received at our end but is stuck in reconciliation. I'm escalating this to our technical team with high priority. You should see the amount credited within the next 30 minutes. I'll notify you as soon as it's done! 🙏",
      timestamp: '2024-12-17T09:45:00',
      channel: 'whatsapp',
      read: true
    }
  ],
  'cust_004': [
    {
      id: 'msg_011',
      sender: 'customer',
      senderName: 'Sneha Gupta',
      message: 'I cannot login to the app. I enter OTP but it says invalid session.',
      timestamp: '2024-12-15T09:30:00',
      channel: 'whatsapp',
      read: true
    },
    {
      id: 'msg_012',
      sender: 'ai_bot',
      senderName: 'FinAgent AI',
      message: "Hello Sneha! I'm here to help. OTP session issues can happen due to time sync problems. Please try:\n1. Make sure your phone's time is set to automatic\n2. Clear the app cache\n3. Request a new OTP\n\nIf the issue persists, I'll reset your session immediately.",
      timestamp: '2024-12-15T09:32:00',
      channel: 'whatsapp',
      read: true
    },
    {
      id: 'msg_013',
      sender: 'customer',
      senderName: 'Sneha Gupta',
      message: 'It worked after clearing cache! Thank you so much!',
      timestamp: '2024-12-15T12:40:00',
      channel: 'whatsapp',
      read: true
    },
    {
      id: 'msg_014',
      sender: 'ai_bot',
      senderName: 'FinAgent AI',
      message: "Wonderful! I'm glad that resolved the issue, Sneha! 🎉 Your login is now working perfectly. Is there anything else I can help you with today? Also, a quick reminder that your KYC verification is still pending — would you like help completing that to unlock your full account benefits?",
      timestamp: '2024-12-15T12:45:00',
      channel: 'whatsapp',
      read: true
    }
  ],
  'cust_005': [
    {
      id: 'msg_015',
      sender: 'customer',
      senderName: 'Vikram Singh',
      message: 'My international transfer got blocked! I need to send money urgently to USA.',
      timestamp: '2024-12-18T13:00:00',
      channel: 'whatsapp',
      read: true
    },
    {
      id: 'msg_016',
      sender: 'ai_bot',
      senderName: 'FinAgent AI',
      message: "Hi Vikram! I can see your transfer was flagged by our fraud detection system as a precautionary measure. This happens with first-time international transfers. To verify your identity and process this, I need:\n1. Purpose of transfer\n2. Beneficiary relationship\n3. Source of funds\n\nPlease provide these details to proceed.",
      timestamp: '2024-12-18T13:02:00',
      channel: 'whatsapp',
      read: true
    },
    {
      id: 'msg_017',
      sender: 'human_agent',
      senderName: 'Ravi Kumar (Agent)',
      message: "Hello Vikram, I'm Ravi from the senior support team. I've taken over your case. I can see the AI bot has collected your initial details. For international transfers above $100, we require additional documentation as per RBI guidelines. Please share: 1) Purpose declaration form, 2) Relationship proof with beneficiary. I'll fast-track this for you.",
      timestamp: '2024-12-18T15:30:00',
      channel: 'whatsapp',
      read: true
    }
  ]
};

// Analytics summary data
export const analyticsData = {
  totalCustomers: 1248,
  activeCustomers: 1089,
  openIssues: 47,
  resolvedToday: 23,
  aiResolutionRate: 78.5,
  avgResolutionTime: '2.4 hrs',
  customerSatisfaction: 4.6,
  monthlyGrowth: 12.3
};

export const issueCategories = [
  { name: 'Payment Issues', count: 18, color: '#ef4444' },
  { name: 'Wallet Issues', count: 12, color: '#f59e0b' },
  { name: 'KYC & Compliance', count: 8, color: '#8b5cf6' },
  { name: 'Technical Issues', count: 6, color: '#3b82f6' },
  { name: 'Account Queries', count: 3, color: '#10b981' },
];

export const resolutionTrend = [
  { day: 'Mon', aiResolved: 12, humanResolved: 4, total: 16 },
  { day: 'Tue', aiResolved: 15, humanResolved: 5, total: 20 },
  { day: 'Wed', aiResolved: 10, humanResolved: 3, total: 13 },
  { day: 'Thu', aiResolved: 18, humanResolved: 6, total: 24 },
  { day: 'Fri', aiResolved: 14, humanResolved: 4, total: 18 },
  { day: 'Sat', aiResolved: 9, humanResolved: 2, total: 11 },
  { day: 'Sun', aiResolved: 7, humanResolved: 2, total: 9 },
];
