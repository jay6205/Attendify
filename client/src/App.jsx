import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';

import AIAdvisor from './pages/AIAdvisor';

import Analytics from './pages/Analytics';

import Timetable from './pages/Timetable';
import Settings from './pages/Settings';

// Placeholder components
const Placeholder = ({ title }) => (
  <div className="p-8 text-center text-slate-500">
    <h2 className="text-2xl font-bold mb-2">{title}</h2>
    <p>Coming Soon</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
             <Route path="/" element={
                 <MainLayout>
                    <Dashboard />
                 </MainLayout>
             } />
             
             {/* Future Routes */}

             <Route path="/timetable" element={<MainLayout><Timetable /></MainLayout>} />
             <Route path="/analytics" element={<MainLayout><Analytics /></MainLayout>} />
             <Route path="/ai-advisor" element={<MainLayout><AIAdvisor /></MainLayout>} />
             <Route path="/settings" element={<MainLayout><Settings /></MainLayout>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
