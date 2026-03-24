import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import HomePage from './pages/home/HomePage';
import Dashboard from './pages/engagement/dashboard/Dashboard';
import Customers from './pages/engagement/customers/Customers';
import Issues from './pages/engagement/issues/Issues';
import ChatList from './pages/engagement/chat/ChatList';
import ChatPage from './pages/engagement/chat/ChatPage';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Home */}
          <Route path="/" element={<HomePage />} />

          {/* Smart Engagement module */}
          <Route path="/engagement" element={<Dashboard />} />
          <Route path="/engagement/customers" element={<Customers />} />
          <Route path="/engagement/issues" element={<Issues />} />
          <Route path="/engagement/chat" element={<ChatList />} />
          <Route path="/engagement/chat/:customerId" element={<ChatPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
