import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { setToken } from './api';
import NavBar from './components/NavBar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Workers from './pages/Workers';
import Attendance from './pages/Attendance';
import Expenses from './pages/Expenses';
import Maintenance from './pages/Maintenance';

function App() {
  const [user, setUser] = useState(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('societyhub-user') : null;
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (!user) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('societyhub-token') : null;
      const stored = typeof window !== 'undefined' ? localStorage.getItem('societyhub-user') : null;
      if (token && stored) {
        setUser(JSON.parse(stored));
        setToken(token);
      }
    }
  }, [user]);

  const login = (userData, token) => {
    localStorage.setItem('societyhub-token', token);
    localStorage.setItem('societyhub-user', JSON.stringify(userData));
    setToken(token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('societyhub-token');
    localStorage.removeItem('societyhub-user');
    setToken(null);
    setUser(null);
  };

  const requireAuth = (element) => {
    return user ? element : <Navigate to="/login" replace />;
  };

  return (
    <BrowserRouter>
      <NavBar user={user} onLogout={logout} />
      <div className="container py-4">
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
          <Route path="/dashboard" element={requireAuth(<Dashboard user={user} />)} />
          <Route path="/members" element={requireAuth(<Members user={user} />)} />
          <Route path="/workers" element={requireAuth(<Workers user={user} />)} />
          <Route path="/attendance" element={requireAuth(<Attendance user={user} />)} />
          <Route path="/expenses" element={requireAuth(<Expenses user={user} />)} />
          <Route path="/maintenance" element={requireAuth(<Maintenance user={user} />)} />
          <Route path="/login" element={<Login onLogin={login} />} />
          <Route path="/register" element={<Register onRegister={login} />} />
          <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
