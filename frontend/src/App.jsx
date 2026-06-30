import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Setup from './pages/Setup';
import Dashboard from './pages/Dashboard';
import { ThemeProvider } from './ThemeContext';
import api from './api';

const AutoLoginWrapper = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthenticated(true);
      return;
    }

    // Auto login
    const formData = new URLSearchParams();
    formData.append('username', 'admin@itlive.uz');
    formData.append('password', 'Admin1234');

    api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    .then(res => {
      localStorage.setItem('token', res.data.access_token);
      setAuthenticated(true);
    })
    .catch(err => {
      console.error("Auto login failed:", err);
      setError("API ulanish xatoligi yoki login xizmati ishlamayapti.");
    });
  }, []);

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', color: 'white', backgroundColor: '#121212', fontFamily: 'sans-serif' }}>
        <h3 style={{ color: '#e5c158', marginBottom: '8px' }}>Tizimga kirib bo'lmadi</h3>
        <p style={{ color: '#ccc', margin: '4px 0 16px 0', fontSize: '14px' }}>Backend API ga ulanishda xatolik yuz berdi (Connection Timeout/Error).</p>
        <div style={{ padding: '12px', background: '#222', border: '1px solid #333', borderRadius: '6px', fontSize: '12px' }}>
          <strong>Sozlangan Backend URL:</strong> <code>{api.defaults.baseURL}</code>
        </div>
        <p style={{ color: 'gray', fontSize: '11px', marginTop: '20px' }}>Maslahat: Railway-da frontend uchun <b>VITE_API_URL</b> o'zgaruvchisini backend manzilingizga sozlang va qayta deploy qiling.</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white', backgroundColor: '#121212', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ color: '#e5c158', marginBottom: '4px' }}>Yuklanmoqda...</h3>
          <p style={{ color: 'gray', fontSize: '12px' }}>Smart Start tizimi yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return children;
};

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/setup" element={<Setup />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/dashboard" element={
            <AutoLoginWrapper>
              <Dashboard />
            </AutoLoginWrapper>
          } />
          <Route path="/" element={
            <AutoLoginWrapper>
              <Dashboard />
            </AutoLoginWrapper>
          } />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
