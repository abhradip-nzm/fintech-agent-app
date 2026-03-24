import React, { createContext, useContext, useState, useCallback } from 'react';
import { customers as initialCustomers, conversations as initialConversations } from '../data/mockData';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [customers, setCustomers] = useState(initialCustomers);
  const [conversations, setConversations] = useState(initialConversations);
  const [activeConversation, setActiveConversation] = useState(null);
  const [agentMode, setAgentMode] = useState({}); // customerId -> 'ai' | 'human'

  const sendMessage = useCallback((customerId, message, sender = 'human_agent', senderName = 'Support Agent') => {
    const newMsg = {
      id: `msg_${Date.now()}`,
      sender,
      senderName,
      message,
      timestamp: new Date().toISOString(),
      channel: 'whatsapp',
      read: true
    };
    setConversations(prev => ({
      ...prev,
      [customerId]: [...(prev[customerId] || []), newMsg]
    }));
    return newMsg;
  }, []);

  const resolveIssue = useCallback((customerId, issueId) => {
    setCustomers(prev => prev.map(c => {
      if (c.id !== customerId) return c;
      return {
        ...c,
        issues: c.issues.map(i => i.id === issueId ? { ...i, status: 'resolved' } : i)
      };
    }));
  }, []);

  const toggleAgentMode = useCallback((customerId) => {
    setAgentMode(prev => ({
      ...prev,
      [customerId]: prev[customerId] === 'human' ? 'ai' : 'human'
    }));
  }, []);

  const getCustomerById = useCallback((id) => {
    return customers.find(c => c.id === id);
  }, [customers]);

  const getConversation = useCallback((customerId) => {
    return conversations[customerId] || [];
  }, [conversations]);

  return (
    <AppContext.Provider value={{
      customers,
      conversations,
      activeConversation,
      setActiveConversation,
      agentMode,
      sendMessage,
      resolveIssue,
      toggleAgentMode,
      getCustomerById,
      getConversation
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
