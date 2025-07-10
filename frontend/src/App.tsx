import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from './store/store';
import Layout from './components/Layout/Layout';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Agents from './pages/Agents/Agents';
import Tasks from './pages/Tasks/Tasks';
import Chat from './pages/Chat/Chat';
import Analytics from './pages/Analytics/Analytics';
import Settings from './pages/Settings/Settings';
import { WebSocketProvider } from './context/WebSocketContext';

const App: React.FC = () => {
  const authState = useSelector((state: RootState) => state.auth);
  const { isAuthenticated } = authState as any; // TODO: Fix typing issue

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <WebSocketProvider>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Layout>
      </Box>
    </WebSocketProvider>
  );
};

export default App;
