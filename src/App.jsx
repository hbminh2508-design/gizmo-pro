import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import GizmoGallery from './components/GizmoGallery';
import GizmoCloud from './components/GizmoCloud';
import GizmoVideo from './components/GizmoVideo';
import GizmoChat from './components/GizmoChat';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('gizmo_theme') === 'dark');
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login'); // 'login' hoặc 'register'
  const [activeTab, setActiveTab] = useState('chat'); // Mặc định mở tab Chat

  // --- QUẢN LÝ PHIÊN ĐĂNG NHẬP BẰNG SUPABASE ---
  useEffect(() => {
    // Kiểm tra session hiện tại khi mở app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Lắng nghe sự thay đổi đăng nhập/đăng xuất
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- QUẢN LÝ DARK MODE ---
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('gizmo_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('gizmo_theme', 'light');
    }
  }, [isDarkMode]);

  // --- HÀM ĐĂNG NHẬP / ĐĂNG KÝ ---
  const handleAuth = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    setLoading(true);

    if (authMode === 'register') {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert(error.message);
      else alert('Đăng ký thành công! Hãy kiểm tra email để xác thực.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert('Sai email hoặc mật khẩu!');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Nếu đang kiểm tra đăng nhập
  if (loading && !session) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Đang tải...</div>;
  }

  return (
    <div className={`min-h-screen w-full flex transition-colors duration-500 overflow-hidden
      ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-black to-blue-900 text-white' : 'bg-gradient-to-br from-blue-50 via-white to-purple-100 text-gray-800'}`}>
      
      {!session ? (
        // --- GIAO DIỆN ĐĂNG NHẬP MỚI ---
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="glass-panel p-10 rounded-[2.5rem] w-full max-w-md border-white/20 shadow-2xl animate-fade-in relative">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="absolute top-6 right-6 text-xl">{isDarkMode ? '☀️' : '🌙'}</button>
            <div className="text-center mb-10">
              <h1 className="text-5xl font-black mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Gizmo Chat</h1>
              <p className="opacity-60 text-sm uppercase font-semibold">Bảo mật đa nền tảng</p>
            </div>
            
            <form onSubmit={handleAuth} className="space-y-5">
              <input type="email" name="email" placeholder="Email của bạn" className="w-full px-6 py-4 rounded-2xl bg-white/20 dark:bg-black/30 border border-white/10 outline-none focus:border-blue-500 transition-all" required />
              <input type="password" name="password" placeholder="Mật khẩu (từ 6 ký tự)" className="w-full px-6 py-4 rounded-2xl bg-white/20 dark:bg-black/30 border border-white/10 outline-none focus:border-blue-500 transition-all" required minLength="6" />
              <button type="submit" disabled={loading} className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold shadow-lg hover:opacity-90 transition-all uppercase disabled:opacity-50">
                {loading ? 'Đang xử lý...' : (authMode === 'login' ? 'Đăng Nhập' : 'Tạo Tài Khoản')}
              </button>
            </form>

            <div className="text-center mt-6">
              <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="text-sm opacity-70 hover:underline hover:text-blue-500 font-bold">
                {authMode === 'login' ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Quay lại đăng nhập'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        // --- GIAO DIỆN APP CHÍNH (LAYOUT SIDEBAR MỚI) ---
        <div className="flex w-full h-screen p-4 gap-4 animate-fade-in">
          
          {/* SIDEBAR BÊN TRÁI */}
          <aside className="w-20 md:w-64 glass-panel rounded-3xl border border-white/20 flex flex-col items-center md:items-start py-8 px-4 justify-between transition-all flex-shrink-0 shadow-xl z-10">
            <div className="w-full">
              <div className="flex items-center gap-3 mb-10 px-2 justify-center md:justify-start">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">G</div>
                <h2 className="text-xl font-bold hidden md:block tracking-tight">Gizmo Chat</h2>
              </div>

              <nav className="flex flex-col gap-3 w-full">
                <MenuButton icon="💬" label="Nhắn Tin" isActive={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
                <MenuButton icon="☁️" label="Cloud Drive" isActive={activeTab === 'cloud'} onClick={() => setActiveTab('cloud')} />
                <MenuButton icon="🖼️" label="Gallery" isActive={activeTab === 'gallery'} onClick={() => setActiveTab('gallery')} />
                <MenuButton icon="🎬" label="Video" isActive={activeTab === 'video'} onClick={() => setActiveTab('video')} />
              </nav>
            </div>

            <div className="w-full flex flex-col gap-4">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-full p-3 rounded-xl hover:bg-white/10 transition-all flex justify-center md:justify-start items-center gap-3">
                <span className="text-xl">{isDarkMode ? '☀️' : '🌙'}</span>
                <span className="font-bold text-sm hidden md:block opacity-70">Giao diện</span>
              </button>
              <div className="w-full border-t border-white/10 pt-4 flex items-center gap-3 justify-center md:justify-start px-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0">
                  {session.user.email.substring(0, 2).toUpperCase()}
                </div>
                <div className="hidden md:block truncate">
                  <p className="text-xs opacity-50 truncate w-32">{session.user.email}</p>
                  <button onClick={handleLogout} className="text-xs text-red-500 font-bold hover:underline">Đăng xuất</button>
                </div>
              </div>
            </div>
          </aside>

          {/* KHU VỰC NỘI DUNG CHÍNH */}
          <main className="flex-grow h-full overflow-hidden glass-panel rounded-3xl border border-white/20 shadow-xl relative">
             {/* ĐÃ TÍCH HỢP GIZMO CHAT TẠI ĐÂY */}
             {activeTab === 'chat' && (
                <div className="p-4 md:p-6 h-full w-full">
                  <GizmoChat session={session} />
                </div>
             )}
             
             {/* CÁC TAB KHÁC */}
             {activeTab === 'cloud' && <div className="p-6 h-full overflow-y-auto"><GizmoCloud userEmail={session.user.email} /></div>}
             {activeTab === 'gallery' && <div className="p-6 h-full overflow-y-auto"><GizmoGallery /></div>}
             {activeTab === 'video' && <div className="p-6 h-full overflow-y-auto"><GizmoVideo /></div>}
          </main>
        </div>
      )}
    </div>
  );
}

// Component phụ cho Nút Menu Sidebar
function MenuButton({ icon, label, isActive, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full p-3 rounded-2xl transition-all flex items-center gap-3 justify-center md:justify-start
        ${isActive ? 'bg-blue-600 text-white shadow-lg scale-105' : 'hover:bg-white/10 opacity-60 hover:opacity-100'}`}
    >
      <span className="text-xl">{icon}</span>
      <span className="font-bold text-sm hidden md:block uppercase tracking-wider">{label}</span>
    </button>
  );
}

export default App;