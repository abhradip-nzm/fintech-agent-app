import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { customers as initialCustomers, conversations as initialConversations } from '../data/mockData';
import { initialHumanAgents } from '../data/agentsData';

const AppContext = createContext(null);

// Round-robin counter (module level — survives re-renders)
let rrIndex = 0;

export const AppProvider = ({ children }) => {
  const [customers,          setCustomers]          = useState(initialCustomers);
  const [conversations,      setConversations]      = useState(initialConversations);
  const [activeConversation, setActiveConversation] = useState(null);
  const [agentMode,          setAgentMode]          = useState({});          // customerId → 'ai' | 'human'
  const [humanAgents,        setHumanAgents]        = useState(initialHumanAgents);
  const [agentAssignments,   setAgentAssignments]   = useState({});          // customerId → agentId
  const [notifications,      setNotifications]      = useState([]);          // [{id, type, ...}]
  const [triageStates,       setTriageStates]       = useState({});          // customerId → {issueType, state}

  // ── Messages ────────────────────────────────────────────────────────────────
  const sendMessage = useCallback((customerId, message, sender = 'human_agent', senderName = 'Support Agent', timestamp = null, waId = null) => {
    const newMsg = {
      id:        waId || `msg_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
      waId,
      sender,
      senderName,
      message,
      timestamp: timestamp || new Date().toISOString(),
      channel:   'whatsapp',
      read:      true,
      source:    waId ? 'whatsapp_live' : 'app',
    };
    setConversations(prev => ({
      ...prev,
      [customerId]: [...(prev[customerId] || []), newMsg],
    }));
    return newMsg;
  }, []);

  // ── Issues ──────────────────────────────────────────────────────────────────
  const resolveIssue = useCallback((customerId, issueId) => {
    setCustomers(prev => prev.map(c => {
      if (c.id !== customerId) return c;
      return { ...c, issues: c.issues.map(i => i.id === issueId ? { ...i, status: 'resolved' } : i) };
    }));
  }, []);

  // ── Agent mode ──────────────────────────────────────────────────────────────
  const toggleAgentMode = useCallback((customerId) => {
    setAgentMode(prev => ({
      ...prev,
      [customerId]: prev[customerId] === 'human' ? 'ai' : 'human',
    }));
  }, []);

  const setCustomerAgentMode = useCallback((customerId, mode) => {
    setAgentMode(prev => ({ ...prev, [customerId]: mode }));
  }, []);

  // ── Phone ───────────────────────────────────────────────────────────────────
  const updateCustomerPhone = useCallback((customerId, newPhone) => {
    const cleanPhone = newPhone.replace(/\D/g, '');
    setCustomers(prev => prev.map(c =>
      c.id !== customerId ? c : { ...c, phone: '+' + cleanPhone, whatsapp: cleanPhone }
    ));
  }, []);

  // ── Getters ─────────────────────────────────────────────────────────────────
  const getCustomerById  = useCallback((id) => customers.find(c => c.id === id), [customers]);
  const getConversation  = useCallback((customerId) => conversations[customerId] || [], [conversations]);

  // ── Human agents ────────────────────────────────────────────────────────────
  const addHumanAgent = useCallback((agent) => {
    const newAgent = { ...agent, id: `agent_${Date.now()}`, status: 'online' };
    setHumanAgents(prev => [...prev, newAgent]);
  }, []);

  const updateAgentStatus = useCallback((agentId, status) => {
    setHumanAgents(prev => prev.map(a => a.id === agentId ? { ...a, status } : a));
  }, []);

  const removeHumanAgent = useCallback((agentId) => {
    setHumanAgents(prev => prev.filter(a => a.id !== agentId));
  }, []);

  /** How many active (human-mode) conversations is this agent handling? */
  const getAgentLoad = useCallback((agentId) => {
    return Object.entries(agentAssignments).filter(([, aid]) => aid === agentId).length;
  }, [agentAssignments]);

  /** Sorted list of agents by load (lowest first), with load attached */
  const getSortedAgents = useCallback(() => {
    return humanAgents
      .map(a => ({ ...a, load: getAgentLoad(a.id) }))
      .sort((a, b) => {
        const order = { online: 0, busy: 1, away: 2, offline: 3 };
        if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
        return a.load - b.load;
      });
  }, [humanAgents, getAgentLoad]);

  /** Round-robin: pick the most available online agent */
  const getRecommendedAgent = useCallback(() => {
    const available = getSortedAgents().filter(a => a.status === 'online' || a.status === 'busy');
    if (!available.length) return getSortedAgents()[0] || null;
    // Among equally loaded agents do round-robin
    const minLoad = available[0].load;
    const candidates = available.filter(a => a.load === minLoad);
    const agent = candidates[rrIndex % candidates.length];
    rrIndex++;
    return agent;
  }, [getSortedAgents]);

  /** Assign a human agent to a conversation */
  const assignAgent = useCallback((customerId, agentId) => {
    setAgentAssignments(prev => ({ ...prev, [customerId]: agentId }));
    setAgentMode(prev => ({ ...prev, [customerId]: 'human' }));
  }, []);

  /** Release assignment (back to bot) */
  const releaseAgent = useCallback((customerId) => {
    setAgentAssignments(prev => { const n = { ...prev }; delete n[customerId]; return n; });
    setAgentMode(prev => ({ ...prev, [customerId]: 'ai' }));
  }, []);

  // ── Notifications ────────────────────────────────────────────────────────────
  const addNotification = useCallback((notif) => {
    setNotifications(prev => [{
      id:        `notif_${Date.now()}_${Math.random().toString(36).slice(2,5)}`,
      timestamp: new Date().toISOString(),
      read:      false,
      ...notif,
    }, ...prev]);
  }, []);

  const markNotificationRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => setNotifications([]), []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // ── Triage state ─────────────────────────────────────────────────────────────
  const setTriageState = useCallback((customerId, triageState) => {
    setTriageStates(prev => ({ ...prev, [customerId]: triageState }));
  }, []);

  const getTriageState = useCallback((customerId) => {
    return triageStates[customerId] || null;
  }, [triageStates]);

  return (
    <AppContext.Provider value={{
      // customers
      customers, getCustomerById, updateCustomerPhone,
      // conversations
      conversations, sendMessage, getConversation, activeConversation, setActiveConversation,
      // agent mode
      agentMode, toggleAgentMode, setCustomerAgentMode,
      // issues
      resolveIssue,
      // human agents
      humanAgents, addHumanAgent, updateAgentStatus, removeHumanAgent,
      getAgentLoad, getSortedAgents, getRecommendedAgent,
      // assignments
      agentAssignments, assignAgent, releaseAgent,
      // notifications
      notifications, unreadCount, addNotification,
      markNotificationRead, markAllRead, clearNotifications,
      // triage
      triageStates, setTriageState, getTriageState,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
