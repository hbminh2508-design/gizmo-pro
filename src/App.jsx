import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import GizmoProfile from './components/GizmoProfile';
import GizmoCloudV2 from './components/GizmoCloudV2'; 
import GizmoChatV2 from './components/GizmoChatV2';   
import GizmoCinema from './components/GizmoCinema';
// IMPORT BỘ ICON CHUYÊN NGHIỆP
import { MessageSquare, Cloud, Film, User, Sun, Moon, LogOut, Hexagon } from 'lucide-react';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('gizmo_theme') === 'dark');
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login'); 
  const [activeTab, setActiveTab] = useState('chat');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('gizmo_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('gizmo_theme', 'light');
    }
  }, [isDarkMode]);

  const handleAuth = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    setLoading(true);

    if (authMode === 'register') {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert(error.message);
      else alert('Đăng ký thành công!');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert('Sai email hoặc mật khẩu!');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading && !session) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  // BẢNG MÀU MỚI: Tối giản, sang trọng hơn
  const themeClass = isDarkMode 
    ? 'bg-[#0B0F19] text-gray-100 selection:bg-blue-500/30' 
    : 'bg-slate-50 text-slate-900 selection:bg-blue-500/20';

  return (
    <div className={`w-full flex transition-colors duration-500 overflow-hidden h-[100dvh] font-sans ${themeClass}`}>
      
      {!session ? (
        // --- GIAO DIỆN ĐĂNG NHẬP MỚI ---
        <div className="flex-grow flex items-center justify-center p-4 relative overflow-hidden">
          {/* Vòng sáng background */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className={`relative p-8 md:p-12 rounded-[2rem] w-full max-w-md shadow-2xl animate-fade-in z-10 backdrop-blur-2xl border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-white shadow-blue-500/5'}`}>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <div className="text-center mb-10">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/30">
                  <Hexagon size={32} />
                </div>
              </div>
              <h1 className="text-3xl font-black tracking-tight">Gizmo<span className="text-blue-600">Pro</span></h1>
              <p className="opacity-60 text-xs uppercase tracking-widest mt-2 font-semibold">Workspace</p>
            </div>
            
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <input type="email" name="email" placeholder="Email của bạn" className={`w-full px-5 py-3.5 rounded-xl border outline-none transition-all text-sm ${isDarkMode ? 'bg-black/20 border-white/10 focus:border-blue-500 focus:bg-black/40' : 'bg-white border-slate-200 focus:border-blue-500 focus:shadow-md'}`} required />
              </div>
              <div>
                <input type="password" name="password" placeholder="Mật khẩu (từ 6 ký tự)" className={`w-full px-5 py-3.5 rounded-xl border outline-none transition-all text-sm ${isDarkMode ? 'bg-black/20 border-white/10 focus:border-blue-500 focus:bg-black/40' : 'bg-white border-slate-200 focus:border-blue-500 focus:shadow-md'}`} required minLength="6" />
              </div>
              <button type="submit" disabled={loading} className="w-full py-3.5 mt-2 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-all disabled:opacity-50 text-sm">
                {loading ? 'Đang xử lý...' : (authMode === 'login' ? 'Đăng Nhập' : 'Tạo Tài Khoản')}
              </button>
            </form>

            <div className="text-center mt-6">
              <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="text-sm opacity-60 hover:opacity-100 transition-opacity">
                {authMode === 'login' ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        // --- GIAO DIỆN APP CHÍNH THỐNG NHẤT ---
        <div className="flex flex-col md:flex-row w-full h-full p-2 md:p-3 gap-2 md:gap-3 animate-fade-in relative">
          
          {/* 1. HEADER MOBILE */}
          <header className={`md:hidden rounded-2xl p-3 flex justify-between items-center z-10 flex-shrink-0 border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md">
                <Hexagon size={18} />
              </div>
              <h2 className="text-base font-bold tracking-tight">Gizmo</h2>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button onClick={() => { if(window.confirm('Đăng xuất?')) handleLogout() }} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-white">
                {session.user.email.substring(0, 2).toUpperCase()}
              </button>
            </div>
          </header>

          {/* 2. SIDEBAR DESKTOP */}
          <aside className={`hidden md:flex w-64 rounded-[1.5rem] flex-col items-start py-6 px-4 justify-between transition-all flex-shrink-0 border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="w-full">
              <div className="flex items-center gap-3 mb-8 px-2">
                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                  <Hexagon size={20} />
                </div>
                <h2 className="text-lg font-black tracking-tight">Gizmo<span className="text-blue-500">Pro</span></h2>
              </div>

              <nav className="flex flex-col gap-1 w-full">
                <MenuButton icon={<User size={18} />} label="Hồ Sơ" isActive={activeTab === 'profile'} onClick={() => setActiveTab('profile')} isDark={isDarkMode} />
                <MenuButton icon={<MessageSquare size={18} />} label="Tin Nhắn" isActive={activeTab === 'chat'} onClick={() => setActiveTab('chat')} isDark={isDarkMode} />
                <MenuButton icon={<Cloud size={18} />} label="Đám Mây" isActive={activeTab === 'cloud'} onClick={() => setActiveTab('cloud')} isDark={isDarkMode} />
                <MenuButton icon={<Film size={18} />} label="Rạp Phim" isActive={activeTab === 'cinema'} onClick={() => setActiveTab('cinema')} isDark={isDarkMode} />
              </nav>
            </div>

            <div className="w-full flex flex-col gap-2">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-full p-3 rounded-xl transition-all flex items-center gap-3 text-sm font-medium ${isDarkMode ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-slate-100 text-slate-600'}`}>
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                <span>Giao diện</span>
              </button>
              <div className={`w-full border-t pt-4 flex items-center gap-3 px-2 ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {session.user.email.substring(0, 2).toUpperCase()}
                </div>
                <div className="truncate flex-grow">
                  <p className="text-xs font-medium truncate w-full">{session.user.email}</p>
                  <button onClick={handleLogout} className="text-[10px] text-red-500 font-bold hover:underline flex items-center gap-1 mt-0.5">
                    <LogOut size={10} /> Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* 3. KHU VỰC NỘI DUNG CHÍNH */}
          <main className={`flex-grow overflow-hidden rounded-[1.5rem] border relative z-0 flex flex-col ${isDarkMode ? 'bg-[#111827] border-white/10 shadow-2xl' : 'bg-white border-slate-200 shadow-sm'}`}>
             {activeTab === 'profile' && <div className="h-full w-full overflow-y-auto"><GizmoProfile session={session} isDark={isDarkMode} /></div>}
             {activeTab === 'chat' && <div className="h-full w-full overflow-hidden"><GizmoChatV2 session={session} isDark={isDarkMode} /></div>}
             {activeTab === 'cloud' && <div className="h-full overflow-y-auto"><GizmoCloudV2 userEmail={session.user.email} isDark={isDarkMode} /></div>}
             {activeTab === 'cinema' && <div className="h-full overflow-y-auto"><GizmoCinema userEmail={session.user.email} isDark={isDarkMode} /></div>}
          </main>

          {/* 4. BOTTOM NAV MOBILE */}
          <nav className={`md:hidden rounded-2xl p-2 flex justify-around items-center z-10 flex-shrink-0 border pb-safe ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-lg'}`}>
            <MobileMenuButton icon={<User size={20} />} label="Tôi" isActive={activeTab === 'profile'} onClick={() => setActiveTab('profile')} isDark={isDarkMode} />
            <MobileMenuButton icon={<MessageSquare size={20} />} label="Chat" isActive={activeTab === 'chat'} onClick={() => setActiveTab('chat')} isDark={isDarkMode} />
            <MobileMenuButton icon={<Cloud size={20} />} label="Cloud" isActive={activeTab === 'cloud'} onClick={() => setActiveTab('cloud')} isDark={isDarkMode} />
            <MobileMenuButton icon={<Film size={20} />} label="Phim" isActive={activeTab === 'cinema'} onClick={() => setActiveTab('cinema')} isDark={isDarkMode} />
          </nav>

        </div>
      )}
    </div>
  );
}

function MenuButton({ icon, label, isActive, onClick, isDark }) {
  const activeClass = isDark 
    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50' 
    : 'bg-blue-50 text-blue-600 font-semibold';
  const inactiveClass = isDark
    ? 'text-gray-400 hover:text-gray-100 hover:bg-white/5'
    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50';

  return (
    <button 
      onClick={onClick}
      className={`w-full p-3 rounded-xl transition-all flex items-center gap-3 text-sm font-medium ${isActive ? activeClass : inactiveClass}`}
    >
      <div className={isActive ? '' : 'opacity-70'}>{icon}</div>
      <span>{label}</span>
    </button>
  );
}

function MobileMenuButton({ icon, label, isActive, onClick, isDark }) {
  const activeClass = isDark ? 'text-blue-400' : 'text-blue-600';
  const inactiveClass = isDark ? 'text-gray-500' : 'text-slate-400';

  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all w-16 gap-1 ${isActive ? activeClass : inactiveClass}`}
    >
      <div className={`transition-transform ${isActive ? 'scale-110' : ''}`}>{icon}</div>
      <span className="text-[10px] font-semibold">{label}</span>
    </button>
  );
}

export default App;