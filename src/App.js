import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import HomePage from './pages/home/HomePage';
import AdminPanel from './pages/admin/AdminPanel';
import Dashboard from './pages/engagement/dashboard/Dashboard';
import Customers from './pages/engagement/customers/Customers';
import Issues from './pages/engagement/issues/Issues';
import ChatList from './pages/engagement/chat/ChatList';
import ChatPage from './pages/engagement/chat/ChatPage';
import AgentsPage from './pages/engagement/agents/AgentsPage';
import NotificationsPage from './pages/notifications/NotificationsPage';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Home */}
          <Route path="/" element={<HomePage />} />

          {/* Super Admin */}
          <Route path="/admin" element={<AdminPanel />} />

          {/* Smart Engagement module */}
          <Route path="/engagement" element={<Dashboard />} />
          <Route path="/engagement/customers" element={<Customers />} />
          <Route path="/engagement/issues" element={<Issues />} />
          <Route path="/engagement/chat" element={<ChatList />} />
          <Route path="/engagement/chat/:customerId" element={<ChatPage />} />
          <Route path="/engagement/agents" element={<AgentsPage />} />

          {/* Notifications */}
          <Route path="/notifications" element={<NotificationsPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
