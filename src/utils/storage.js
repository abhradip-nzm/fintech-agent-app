// ─── Agently Cloud Storage ───────────────────────────────────────────────────
// Provider : JSONBin.io — free forever, no credit card needed
// Docs     : https://jsonbin.io
//
// Setup (2 min):
//   1. Sign up at jsonbin.io (free, no CC)
//   2. Copy your Master Key from the dashboard
//   3. In Agently → Super Admin → click "Local Only" pill → paste the key → Connect
//   4. Done! All agent cards now sync to the cloud across devices.
//
// Without a key: data persists in localStorage (browser-only).
// ─────────────────────────────────────────────────────────────────────────────

const JSONBIN_API    = 'https://api.jsonbin.io/v3';
const LS_AGENTS      = 'agently_agents_v1';
const LS_BIN_ID      = 'agently_bin_id';
const LS_API_KEY     = 'agently_jsonbin_key';
const LS_INDUSTRIES  = 'agently_industries_v1';

// ─── Default industries ───────────────────────────────────────────────────────
export const DEFAULT_INDUSTRIES = [
  { id: 'ind_fintech',       name: 'FinTech' },
  { id: 'ind_banking',       name: 'Banking' },
  { id: 'ind_healthcare',    name: 'Healthcare' },
  { id: 'ind_insurance',     name: 'Insurance' },
  { id: 'ind_ecommerce',     name: 'E-Commerce' },
  { id: 'ind_retail',        name: 'Retail' },
  { id: 'ind_logistics',     name: 'Logistics' },
  { id: 'ind_education',     name: 'Education' },
  { id: 'ind_realestate',    name: 'Real Estate' },
  { id: 'ind_manufacturing', name: 'Manufacturing' },
];

// ─── Default seed data ───────────────────────────────────────────────────────
export const DEFAULT_AGENTS = [
  {
    id: 'default_001',
    agentNumber: '01',
    title: 'Customer Onboarding & Underwriting',
    subtitle: 'Intelligent end-to-end KYC verification, risk scoring, and credit underwriting — fully automated with zero manual intervention.',
    features: ['Auto KYC Verification', 'Risk Scoring Engine', 'Instant Credit Decision', 'Document Intelligence'],
    metricValue: '3.2s',
    metricLabel: 'Avg. KYC Time',
    iconType: 'onboarding',
    isInternal: false,
    appUrl: 'https://claims-ai.netlify.app/',
    internalPath: '',
    accentColor: 'blue',
  },
  {
    id: 'default_002',
    agentNumber: '02',
    title: 'Smart Customer Engagement & Chatbot',
    subtitle: 'Proactive issue detection and resolution via WhatsApp — AI-first with seamless human handoff for complex cases.',
    features: ['WhatsApp AI Bot', 'Issue Detection', 'Human Handoff', 'Live Analytics'],
    metricValue: '78%',
    metricLabel: 'AI Resolution',
    iconType: 'chat',
    isInternal: true,
    appUrl: '',
    internalPath: '/engagement',
    accentColor: 'cyan',
  },
];

// ─── Config helpers ───────────────────────────────────────────────────────────
export const getApiKey        = ()    => localStorage.getItem(LS_API_KEY) || '';
export const setApiKey        = (key) => localStorage.setItem(LS_API_KEY, key.trim());
export const getBinId         = ()    => localStorage.getItem(LS_BIN_ID)  || '';
export const isCloudConnected = ()    => !!(getApiKey() && getBinId());
export const clearCloudConfig = ()    => {
  localStorage.removeItem(LS_API_KEY);
  localStorage.removeItem(LS_BIN_ID);
};

const _setBinId   = (id) => localStorage.setItem(LS_BIN_ID, id);
const _readLocal  = ()   => { try { const r = localStorage.getItem(LS_AGENTS); return r ? JSON.parse(r) : null; } catch { return null; } };
const _writeLocal = (a)  => localStorage.setItem(LS_AGENTS, JSON.stringify(a));

// ─── Public API ───────────────────────────────────────────────────────────────

/** Read agents — tries cloud first, falls back to localStorage, then built-in defaults. */
export const readAgents = async () => {
  const apiKey = getApiKey();
  const binId  = getBinId();

  if (apiKey && binId) {
    try {
      const res = await fetch(`${JSONBIN_API}/b/${binId}/latest`, {
        headers: { 'X-Master-Key': apiKey },
      });
      if (res.ok) {
        const { record } = await res.json();
        if (Array.isArray(record?.agents)) {
          _writeLocal(record.agents);
          return record.agents;
        }
      }
    } catch (e) {
      console.warn('[Agently Storage] Cloud read failed, using local cache:', e.message);
    }
  }

  return _readLocal() ?? DEFAULT_AGENTS;
};

// ─── Industries helpers ───────────────────────────────────────────────────────
/** Read industries from localStorage; returns DEFAULT_INDUSTRIES if none saved. */
export const readIndustries = () => {
  try {
    const r = localStorage.getItem(LS_INDUSTRIES);
    return r ? JSON.parse(r) : DEFAULT_INDUSTRIES;
  } catch { return DEFAULT_INDUSTRIES; }
};

/** Write industries to localStorage. */
export const writeIndustries = (industries) => {
  localStorage.setItem(LS_INDUSTRIES, JSON.stringify(industries));
};

/**
 * Write agents — always saves to localStorage immediately,
 * then syncs to JSONBin if an API key is configured.
 *
 * Returns { success: boolean, storage: 'local'|'cloud', error?: string }
 */
export const writeAgents = async (agents) => {
  _writeLocal(agents);

  const apiKey = getApiKey();
  if (!apiKey) return { success: true, storage: 'local' };

  let binId = getBinId();

  try {
    if (!binId) {
      // First-time cloud write — create a new bin
      const res = await fetch(`${JSONBIN_API}/b`, {
        method: 'POST',
        headers: {
          'X-Master-Key': apiKey,
          'Content-Type': 'application/json',
          'X-Bin-Name': 'agently-agents',
          'X-Bin-Private': 'false',
        },
        body: JSON.stringify({ agents }),
      });
      const data = await res.json();
      if (data.metadata?.id) {
        _setBinId(data.metadata.id);
        return { success: true, storage: 'cloud', binId: data.metadata.id };
      }
      return { success: false, error: data.message || 'Bin creation failed' };
    } else {
      // Subsequent writes — full-replace PUT
      const res = await fetch(`${JSONBIN_API}/b/${binId}`, {
        method: 'PUT',
        headers: {
          'X-Master-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agents }),
      });
      if (res.ok) return { success: true, storage: 'cloud' };
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.message || `HTTP ${res.status}` };
    }
  } catch (e) {
    return { success: false, error: e.message };
  }
};
