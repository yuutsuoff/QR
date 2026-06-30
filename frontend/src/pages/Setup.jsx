import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, User, ShieldCheck } from 'lucide-react';
import api from '../api';

export default function Setup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // If setup not needed, redirect to login
    api.get('/auth/setup-needed').then(res => {
      if (!res.data.setup_needed) navigate('/login');
    }).catch(() => navigate('/login'));
  }, []);

  const handleSetup = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Parollar mos kelmaydi!");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/register_admin', { name, email, password, role: 'admin' });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || "Xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 overflow-hidden relative bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Gold Ambient Glow */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vh] bg-gold-600/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40vw] h-[40vh] bg-zinc-800/20 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="glass-card w-full max-w-md p-10 rounded-2xl z-10 relative bg-[var(--bg-card)] border-[var(--border-color)] shadow-2xl"
      >
        <div className="flex justify-center mb-8">
          <img src="/logo.png" alt="Smart Start Logo" className="w-20 h-20 object-contain" />
        </div>
        
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black tracking-tighter uppercase italic mb-1">Dastlabki <span className="text-gold-600">Sozlash</span></h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Create Root Administrator</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-gold-600/10 border border-gold-600/20 text-gold-500 p-4 rounded-lg mb-6 text-xs font-bold uppercase tracking-tight">
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSetup} className="space-y-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-[var(--text-secondary)] group-focus-within:text-gold-500 transition-colors" />
            </div>
            <input type="text" required value={name} onChange={e => setName(e.target.value)}
              className="block w-full pl-12 pr-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg focus:border-gold-600 outline-none transition-all text-sm font-medium text-[var(--text-primary)]"
              placeholder="TO'LIQ ISM" />
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-[var(--text-secondary)] group-focus-within:text-gold-500 transition-colors" />
            </div>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="block w-full pl-12 pr-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg focus:border-gold-600 outline-none transition-all text-sm font-medium text-[var(--text-primary)]"
              placeholder="EMAIL MANZIL" />
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-[var(--text-secondary)] group-focus-within:text-gold-500 transition-colors" />
            </div>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="block w-full pl-12 pr-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg focus:border-gold-600 outline-none transition-all text-sm font-medium text-[var(--text-primary)]"
              placeholder="PAROL" />
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-[var(--text-secondary)] group-focus-within:text-gold-500 transition-colors" />
            </div>
            <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
              className="block w-full pl-12 pr-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg focus:border-gold-600 outline-none transition-all text-sm font-medium text-[var(--text-primary)]"
              placeholder="PAROLNI TASDIQLASH" />
          </div>

          <div className="pt-4">
            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 px-4 rounded-lg text-white font-black uppercase tracking-widest bg-gold-600 hover:bg-gold-700 shadow-lg shadow-gold-600/20 transition-all text-xs disabled:opacity-50"
            >
              {loading ? 'Kutib turing...' : 'Admin Yaratish va Boshlash'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
