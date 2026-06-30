import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, Building, ClipboardList, LogOut, QrCode, Plus, X, Lock, Mail, User, Sun, Moon, Edit, Trash2 } from 'lucide-react';
import api from '../api';
import { useTheme } from '../ThemeContext';
import AttendanceCalendar from '../components/AttendanceCalendar';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({ total_users: 0, total_offices: 0, total_attendance: 0 });
  const [users, setUsers] = useState([]);
  const [offices, setOffices] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [qrModal, setQrModal] = useState({ isOpen: false, data: null, office: null, svg: null });
  const [qrLoading, setQrLoading] = useState(null); // stores office.id being loaded
  const [userModal, setUserModal] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'employee', shift_type: 'full_day' });
  const [editingUser, setEditingUser] = useState(null); // When editing, this holds the user object
  const [userFormLoading, setUserFormLoading] = useState(false);
  const [userFormError, setUserFormError] = useState(null);
  
  const [officeAddModal, setOfficeAddModal] = useState(false);
  const [officeForm, setOfficeForm] = useState({ id: '', name: '', location: '' });
  const [officeFormLoading, setOfficeFormLoading] = useState(false);
  const [officeFormError, setOfficeFormError] = useState(null);

  // Calendar state
  const [calendarModal, setCalendarModal] = useState({ isOpen: false, user: null, attendance: [] });
  const [calendarLoading, setCalendarLoading] = useState(false);

  const { isDarkMode, toggleTheme } = useTheme();
  
  const [isAccessDenied, setIsAccessDenied] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const resStats = await api.get('/admin/stats');
        setStats(resStats.data);
      } else if (activeTab === 'users') {
        const resUsers = await api.get('/admin/users');
        setUsers(resUsers.data);
      } else if (activeTab === 'offices') {
        const resOff = await api.get('/admin/offices');
        setOffices(resOff.data);
      } else if (activeTab === 'attendance') {
        const resAtt = await api.get('/admin/attendance');
        setAttendance(resAtt.data);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else if (err.response?.status === 403) {
        setIsAccessDenied(true);
      } else {
        alert("Ma'lumotlarni yuklashda xatolik: " + (err.response?.data?.detail || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setUserFormLoading(true);
    setUserFormError(null);
    try {
      if (editingUser) {
        // Update logic
        const updatePayload = { ...userForm };
        if (!updatePayload.password) delete updatePayload.password; // Don't send empty password
        await api.put(`/admin/users/${editingUser.id}`, updatePayload);
      } else {
        // Register logic
        await api.post('/auth/register_user', userForm);
      }
      setUserModal(false);
      setEditingUser(null);
      setUserForm({ name: '', email: '', password: '', role: 'employee', shift_type: 'full_day' });
      fetchData();
    } catch (err) {
      setUserFormError(err.response?.data?.detail || 'Xatolik yuz berdi.');
    } finally {
      setUserFormLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Haqiqatan ham ushbu xodimni o'chirmoqchimisiz?")) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      fetchData();
    } catch (err) {
      alert("O'chirishda xatolik: " + (err.response?.data?.detail || err.message));
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      password: '', // Leave empty unless changing
      role: user.role,
      shift_type: user.shift_type || 'full_day'
    });
    setUserFormError(null);
    setUserModal(true);
  };

  const handleAddOffice = async (e) => {
    e.preventDefault();
    setOfficeFormLoading(true);
    setOfficeFormError(null);
    try {
      const payload = {
        id: officeForm.id,
        name: officeForm.name,
        location: officeForm.location
      };
      await api.post('/admin/offices/add', payload);
      setOfficeAddModal(false);
      setOfficeForm({ id: '', name: '', location: '' });
      fetchData();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Xatolik yuz berdi.';
      setOfficeFormError(errorMsg);
    } finally {
      setOfficeFormLoading(false);
    }
  };


  const generateQR = async (office) => {
    setQrLoading(office.id);
    try {
      const res = await api.post('/qr/generate', null, { 
        params: { office_id: office.id } 
      });
      
      const tokenValue = res.data?.token;
      if (tokenValue) {
        setQrModal({ 
          isOpen: true, 
          data: String(tokenValue), 
          office: office,
          svg: res.data?.qr_svg 
        });
      } else {
        alert('Server javob berdi, lekin token topilmadi.');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Noma\'lum xatolik';
      alert(`Xatolik: ${msg}`);
    } finally {
      setQrLoading(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const openUserCalendar = async (user) => {
    setCalendarLoading(true);
    try {
      const res = await api.get(`/admin/users/${user.id}/attendance`);
      setCalendarModal({ isOpen: true, user, attendance: res.data });
    } catch (err) {
      alert("Davomatni yuklashda xatolik: " + (err.response?.data?.detail || err.message));
    } finally {
      setCalendarLoading(false);
    }
  };

  // Render Sidebar
  const Sidebar = () => (
    <div className="w-64 glass-panel border-r border-[var(--border-color)] h-screen flex flex-col pt-8 pb-4 relative z-20 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600" />
      <div className="px-6 mb-10 flex items-center gap-3">
        <img src="/logo.png" alt="Smart Start Logo" className="w-12 h-12 object-contain" />
        <div>
          <h1 className="text-lg font-black text-[var(--text-primary)] leading-tight tracking-tighter uppercase italic">
            Smart <span className="text-[var(--accent-gold)]">Start</span>
          </h1>
          <p className="text-[8px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em]">Xususiy Maktabi</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        <NavItem id="dashboard" icon={<LayoutDashboard size={18} />} label="Asosiy Panel" />
        <NavItem id="users" icon={<Users size={18} />} label="Xodimlar" />
        <NavItem id="offices" icon={<Building size={18} />} label="Ofislar" />
        <NavItem id="attendance" icon={<ClipboardList size={18} />} label="Davomat Tarixi" />
      </nav>

      <div className="px-4 mt-auto space-y-2">
        <button 
          onClick={toggleTheme} 
          className="flex items-center gap-3 w-full px-4 py-3 text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)] rounded-lg transition-all font-medium text-sm group"
        >
          {isDarkMode ? <Sun size={18} className="group-hover:rotate-45 transition-transform" /> : <Moon size={18} className="group-hover:-rotate-12 transition-transform" />}
          <span>{isDarkMode ? 'Kunduzgi rejim' : 'Tungi rejim'}</span>
        </button>
        <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-[var(--text-secondary)] hover:bg-red-600/10 hover:text-red-500 rounded-lg transition-all font-medium text-sm group">
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span>Chiqish</span>
        </button>
      </div>
    </div>
  );

  const NavItem = ({ id, icon, label }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all duration-200 ${isActive ? 'bg-[var(--accent-gold)] text-[var(--bg-primary)] font-bold shadow-lg shadow-gold-600/20' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 font-medium text-sm'}`}
      >
        <span className={isActive ? 'text-[var(--bg-primary)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors'}>{icon}</span>
        {label}
      </button>
    );
  };

  if (isAccessDenied) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-primary)] flex-col font-sans p-4">
        <div className="w-20 h-20 bg-red-600/10 border border-red-600/20 rounded-full flex items-center justify-center shadow-2xl mb-4">
          <Lock size={40} className="text-red-500" />
        </div>
        <h2 className="text-3xl font-black text-[var(--text-primary)] mb-2 mt-4 text-center uppercase tracking-tighter">Ruxsat Yo'q!</h2>
        <p className="text-[var(--text-secondary)] mb-8 max-w-md text-center text-lg">Xodimlar uchun dashboard mavjud emas.</p>
        <button onClick={handleLogout} className="flex items-center gap-2 bg-[var(--accent-red)] hover:bg-[var(--accent-red-hover)] text-white px-8 py-3 rounded-lg font-bold shadow-lg transition-all uppercase text-sm tracking-widest">
          <LogOut size={20} /> Tizimdan chiqish
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)] font-sans text-[var(--text-primary)]">
      {/* Subtle Background Elements */}
      <div className="absolute top-0 right-0 w-[40vw] h-[40vh] bg-gold-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[30vw] h-[30vh] bg-[var(--bg-secondary)] blur-[100px] rounded-full pointer-events-none" />

      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8 relative z-10">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
              <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <div>
                  <div className="flex justify-between items-end mb-10">
                    <div>
                      <p className="text-[var(--accent-gold)] font-bold text-xs uppercase tracking-[0.2em] mb-1">Overview</p>
                      <h2 className="text-4xl font-black text-[var(--text-primary)] tracking-tighter uppercase italic">Umumiy <span className="text-[var(--accent-gold)]">Statistika</span></h2>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title="Jami Xodimlar" value={stats.total_users} icon={<Users className="text-[var(--bg-primary)]" size={24} />} />
                    <StatCard title="Jami Ofislar" value={stats.total_offices} icon={<Building className="text-[var(--bg-primary)]" size={24} />} />
                    <StatCard title="Bugungi Davomat" value={stats.total_attendance} icon={<ClipboardList className="text-[var(--bg-primary)]" size={24} />} />
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div className="glass-card rounded-2xl overflow-hidden shadow-2xl">
                   <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-white/[0.02]">
                     <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight uppercase">Xodimlar Ro'yxati</h2>
                     <button
                       onClick={() => { setUserModal(true); setUserFormError(null); }}
                       className="flex items-center gap-2 bg-[var(--accent-gold)] text-white px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-[var(--accent-gold-hover)] transition-all shadow-lg shadow-gold-600/20"
                     >
                       <Plus size={16} /> Qo'shish
                     </button>
                   </div>
                   <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                       <thead>
                         <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)] text-[10px] uppercase tracking-[0.2em]">
                           <th className="p-6 font-bold">Ism</th>
                           <th className="p-6 font-bold">Email</th>
                           <th className="p-6 font-bold">Smena</th>
                           <th className="p-6 font-bold">Rol</th>
                           <th className="p-6 font-bold text-right">Amallar</th>
                         </tr>
                       </thead>
                       <tbody className="text-sm">
                         {users.map(u => (
                           <tr key={u.id} className="border-b border-[var(--border-color)] hover:bg-white/[0.02] transition-colors group">
                             <td className="p-6 text-[var(--text-primary)] font-medium group-hover:text-[var(--accent-gold)] transition-colors flex items-center gap-2 cursor-pointer" onClick={() => openUserCalendar(u)}>
                               {u.name}
                               {calendarLoading && <div className="w-3 h-3 border border-[var(--accent-gold)] border-t-transparent rounded-full animate-spin" />}
                             </td>
                             <td className="p-6 text-[var(--text-secondary)]">{u.email}</td>
                             <td className="p-6 text-[var(--text-secondary)]">
                               <span className="text-[10px] font-bold uppercase tracking-wider bg-zinc-800 px-2 py-0.5 rounded">
                                 {u.shift_type === 'morning_shift' ? 'Ertalabki' : u.shift_type === 'afternoon_shift' ? 'Kechki' : 'To\'liq kun'}
                               </span>
                             </td>
                             <td className="p-6">
                               <span className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-gold-600/20 text-gold-500 border border-gold-500/20' : 'bg-transparent text-[var(--text-secondary)] border border-[var(--border-color)]'}`}>
                                 {u.role}
                               </span>
                             </td>
                             <td className="p-6 text-right">
                               <div className="flex justify-end gap-2">
                                 <button onClick={() => openEditModal(u)} className="p-2 hover:bg-white/10 rounded-lg text-blue-500 transition-colors"><Edit size={16} /></button>
                                 <button onClick={() => handleDeleteUser(u.id)} className="p-2 hover:bg-white/10 rounded-lg text-red-500 transition-colors"><Trash2 size={16} /></button>
                               </div>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                </div>
              )}

              {activeTab === 'offices' && (
                <div className="glass-card rounded-2xl overflow-hidden shadow-2xl">
                   <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-white/[0.02]">
                     <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight uppercase">Ofislar</h2>
                     <button 
                       onClick={() => { setOfficeAddModal(true); setOfficeFormError(null); }}
                       className="flex items-center gap-2 bg-[var(--accent-gold)] text-white px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-[var(--accent-gold-hover)] transition-all shadow-lg shadow-gold-600/20">
                       <Plus size={16} /> Yangi Qo'shish
                     </button>
                   </div>
                   <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                       <thead>
                         <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)] text-[10px] uppercase tracking-[0.2em]">
                           <th className="p-6 font-bold">ID</th>
                           <th className="p-6 font-bold">Nomi</th>
                           <th className="p-6 font-bold">Manzil</th>
                           <th className="p-6 font-bold text-right">Amallar</th>
                         </tr>
                       </thead>
                       <tbody className="text-sm">
                         {offices.map(o => (
                           <tr key={o.id} className="border-b border-[var(--border-color)] hover:bg-white/[0.02] transition-colors">
                             <td className="p-6 text-[var(--accent-gold)] font-bold">{o.id}</td>
                             <td className="p-6 text-[var(--text-primary)] font-bold">{o.name}</td>
                             <td className="p-6 text-[var(--text-secondary)] font-medium">{o.location}</td>
                             <td className="p-6 text-right">
                               <button 
                                  onClick={() => generateQR(o)}
                                  disabled={qrLoading === o.id}
                                  className="inline-flex items-center gap-2 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[var(--accent-gold)] hover:border-[var(--accent-gold)] transition-all disabled:opacity-50"
                                >
                                  {qrLoading === o.id ? (
                                    <><div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> ...</>
                                  ) : (
                                    <><QrCode size={14} /> QR</>
                                  )}
                                </button>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                </div>
              )}

              {activeTab === 'attendance' && (
                <div className="glass-card rounded-2xl overflow-hidden shadow-2xl">
                   <div className="p-6 border-b border-[var(--border-color)] bg-white/[0.02]">
                     <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight uppercase">Davomat Tarixi</h2>
                   </div>
                   <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                       <thead>
                         <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)] text-[10px] uppercase tracking-[0.2em]">
                           <th className="p-6 font-bold">Xodim</th>
                           <th className="p-6 font-bold">Sana</th>
                           <th className="p-6 font-bold">Kelgan</th>
                           <th className="p-6 font-bold">Ketgan</th>
                           <th className="p-6 font-bold">Holat</th>
                         </tr>
                       </thead>
                       <tbody className="text-sm">
                         {attendance.map(a => (
                           <tr key={a.id} className="border-b border-[var(--border-color)] hover:bg-white/[0.02] transition-colors">
                             <td className="p-6 text-[var(--text-primary)] font-medium">{a.user_name || a.user_id}</td>
                             <td className="p-6 text-[var(--text-secondary)]">{a.date}</td>
                             <td className="p-6 text-[var(--accent-gold)] font-bold">{a.check_in || '---'}</td>
                             <td className="p-6 text-[var(--accent-gold)] font-bold">{a.check_out || '---'}</td>
                             <td className="p-6">
                               <span className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest ${a.status === 'present' ? 'bg-green-600/20 text-green-500' : 'bg-orange-600/20 text-orange-500'}`}>
                                 {a.status}
                               </span>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </main>

      <AnimatePresence>
        {qrModal.isOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/40">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-[320px] rounded-xl p-6 relative shadow-2xl flex flex-col items-center"
            >
              <button 
                onClick={() => setQrModal({ isOpen: false, data: null, office: null, svg: null })}
                className="absolute top-3 right-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
              >
                <X size={18} />
              </button>
              
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  {qrModal.office?.name}
                </h3>
                <p className="text-[10px] font-bold text-[var(--accent-gold)] uppercase tracking-widest">Aktiv QR Kod</p>
              </div>
              
              <div 
                className="w-48 h-48 bg-[var(--bg-secondary)] p-2 rounded-lg border border-[var(--border-color)] mb-4 flex items-center justify-center overflow-hidden"
                dangerouslySetInnerHTML={{ __html: qrModal.svg }}
              />
              
              <div className="w-full bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border-color)]">
                <p className="text-[8px] text-[var(--text-secondary)] mb-1 font-bold uppercase tracking-widest text-center">Xavfsiz Token</p>
                <p className="text-[9px] text-[var(--text-primary)] break-all font-mono text-center font-medium">
                  {qrModal.data}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(userModal || officeAddModal) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => {setUserModal(false); setOfficeAddModal(false)}} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[var(--bg-card)] border border-[var(--border-color)] w-full max-w-md rounded-2xl p-8 relative z-10 shadow-2xl">
              <button onClick={() => {setUserModal(false); setOfficeAddModal(false)}} className="absolute top-5 right-5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"><X size={20} /></button>
              
              {userModal ? (
                <>
                   <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight mb-6">{editingUser ? "Xodimni Tahrirlash" : "Yangi Xodim"}</h3>
                   {userFormError && <div className="bg-gold-600/10 border border-gold-600/20 text-gold-500 rounded-lg p-3 mb-5 text-xs">{userFormError}</div>}
                   <form onSubmit={handleAddUser} className="space-y-4">
                     <div className="space-y-1">
                       <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Ism sharif</label>
                       <input type="text" required placeholder="Ism sharif" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-gold-600 outline-none transition-all text-sm" />
                     </div>
                     <div className="space-y-1">
                       <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Email</label>
                       <input type="email" required placeholder="Email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-gold-600 outline-none transition-all text-sm" />
                     </div>
                     <div className="space-y-1">
                       <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{editingUser ? "Parol (O'zgartirish uchun kiriting)" : "Parol"}</label>
                       <input type="password" required={!editingUser} placeholder="Parol" minLength={6} value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-gold-600 outline-none transition-all text-sm" />
                     </div>
                     
                     <div className="space-y-2">
                       <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Smena Rejimi</label>
                       <select 
                         value={userForm.shift_type} 
                         onChange={e => setUserForm({...userForm, shift_type: e.target.value})}
                         className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-gold-600 outline-none transition-all text-sm appearance-none"
                       >
                         <option value="full_day">To'liq kun (08:30 - 17:30)</option>
                         <option value="morning_shift">Ertalabki smena (08:30 - 12:00)</option>
                         <option value="afternoon_shift">Kechki smena (12:00 - 17:30)</option>
                       </select>
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Rol</label>
                        <div className="flex gap-2">
                          {['employee', 'admin'].map(role => (
                            <button type="button" key={role} onClick={() => setUserForm({...userForm, role})} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${userForm.role === role ? 'bg-[var(--accent-gold)] border-[var(--accent-gold)] text-[var(--bg-primary)]' : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-gold)]'}`}>{role}</button>
                          ))}
                        </div>
                     </div>

                     <button type="submit" disabled={userFormLoading} className="w-full py-3 rounded-lg text-[var(--bg-primary)] font-black uppercase tracking-widest bg-[var(--accent-gold)] hover:bg-[var(--accent-gold-hover)] transition-all text-xs shadow-lg shadow-gold-600/20">{userFormLoading ? '...' : (editingUser ? "Saqlash" : "Qo'shish")}</button>
                   </form>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight mb-6">Yangi Ofis</h3>
                  {officeFormError && <div className="bg-gold-600/10 border border-gold-600/20 text-gold-500 rounded-lg p-3 mb-5 text-xs">{officeFormError}</div>}
                  <form onSubmit={handleAddOffice} className="space-y-4">
                    <input type="text" required placeholder="Ofis ID (Masalan: OF001)" value={officeForm.id} onChange={e => setOfficeForm({...officeForm, id: e.target.value})} className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:border-gold-600 outline-none transition-all text-sm" />
                    <input type="text" required placeholder="Ofis Nomi" value={officeForm.name} onChange={e => setOfficeForm({...officeForm, name: e.target.value})} className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:border-gold-600 outline-none transition-all text-sm" />
                    <input type="text" required placeholder="Manzil" value={officeForm.location} onChange={e => setOfficeForm({...officeForm, location: e.target.value})} className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:border-gold-600 outline-none transition-all text-sm" />
                    <button type="submit" disabled={officeFormLoading} className="w-full py-3 rounded-lg text-[var(--bg-primary)] font-black uppercase tracking-widest bg-[var(--accent-gold)] hover:bg-[var(--accent-gold-hover)] transition-all text-xs shadow-lg shadow-gold-600/20">{officeFormLoading ? '...' : "Ofis Qo'shish"}</button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {calendarModal.isOpen && (
          <AttendanceCalendar 
            user={calendarModal.user} 
            attendance={calendarModal.attendance} 
            onClose={() => setCalendarModal({ isOpen: false, user: null, attendance: [] })} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const StatCard = ({ title, value, icon }) => (
  <motion.div 
    whileHover={{ y: -2 }}
    className="bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-2xl shadow-xl relative overflow-hidden group"
  >
    <div className="absolute top-0 right-0 w-16 h-16 bg-gold-600/10 blur-2xl rounded-full group-hover:bg-gold-600/20 transition-all" />
    <div className="flex justify-between items-start relative z-10">
      <div>
        <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-4xl font-black text-[var(--text-primary)] tracking-tighter italic">{value}</h3>
      </div>
      <div className="bg-gold-600/10 border border-gold-600/20 p-3 rounded-xl text-[var(--accent-gold)] group-hover:bg-[var(--accent-gold)] group-hover:text-[var(--bg-primary)] transition-all">{icon}</div>
    </div>
  </motion.div>
);
