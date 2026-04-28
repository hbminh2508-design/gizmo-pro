import React, { useState, useEffect } from 'react';
import GizmoGallery from './components/GizmoGallery';
import GizmoCloud from './components/GizmoCloud';
import GizmoVideo from './components/GizmoVideo'; // Component mới

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState('login'); 
  const [activeTab, setActiveTab] = useState('gallery'); // 'gallery', 'cloud', 'video'

  // KHOẢN NÀY LÀ ĐỂ LƯU LỊCH SỬ ĐĂNG NHẬP
  useEffect(() => {
    const savedLogin = localStorage.getItem('gizmo_logged_in');
    if (savedLogin === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Hàm xử lý đăng nhập
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setIsLoggedIn(true);
    localStorage.setItem('gizmo_logged_in', 'true'); // Lưu vào trình duyệt
  };

  // Hàm xử lý đăng xuất
  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('gizmo_logged_in'); // Xóa khỏi trình duyệt
  };

  return (
    <div className={`min-h-screen w-full flex flex-col transition-colors duration-500
      ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-black to-blue-900 text-white' : 'bg-gradient-to-br from-blue-50 via-white to-purple-100 text-gray-800'}`}>
      
      <div className="fixed top-6 right-6 z-50">
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="glass-panel px-5 py-2.5 rounded-full font-bold text-sm transition-all hover:scale-110 active:scale-95 flex items-center gap-2 border border-white/20 shadow-xl">
          {isDarkMode ? '☀️ LIGHT' : '🌙 DARK'}
        </button>
      </div>

      {!isLoggedIn ? (
        // GIAO DIỆN ĐĂNG NHẬP
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="glass-panel p-10 rounded-[2.5rem] w-full max-w-md border-white/20 shadow-2xl animate-fade-in">
            <div className="text-center mb-10">
              <h1 className="text-5xl font-black mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">Gizmo Pro</h1>
              <p className="opacity-60 text-sm uppercase font-semibold">Management Suite</p>
            </div>
            
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <input type="email" placeholder="Email" className="w-full px-6 py-4 rounded-2xl bg-white/20 dark:bg-black/30 border border-white/10 outline-none focus:border-blue-500 transition-all" required />
              <input type="password" placeholder="Mật khẩu" className="w-full px-6 py-4 rounded-2xl bg-white/20 dark:bg-black/30 border border-white/10 outline-none focus:border-blue-500 transition-all" required />
              <button type="submit" className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold shadow-lg hover:opacity-90 transition-all uppercase">
                Vào Hệ Thống
              </button>
            </form>
          </div>
        </div>
      ) : (
        // GIAO DIỆN TRANG CHỦ
        <div className="w-full max-w-7xl mx-auto p-6 md:p-10 flex flex-col gap-8 animate-fade-in">
          <header className="glass-panel rounded-[2rem] p-6 flex justify-between items-center border border-white/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">G</div>
              <div>
                <h2 className="text-2xl font-bold">Gizmo Dashboard</h2>
                <p className="text-xs opacity-50 uppercase tracking-widest italic">Xin chào, Admin</p>
              </div>
            </div>
            <button onClick={handleLogout} className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-red-500/20 hover:text-red-500 border border-white/10 font-bold text-xs uppercase">
              Đăng Xuất
            </button>
          </header>

          <main className="space-y-8">
            {/* Thanh Tabs - Đã thêm mục Video */}
            <div className="flex flex-wrap gap-4 p-1.5 glass-panel rounded-2xl w-fit border border-white/10 shadow-inner">
              <button onClick={() => setActiveTab('gallery')} className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'gallery' ? 'bg-blue-600 text-white shadow-xl scale-105' : 'opacity-40 hover:opacity-100'}`}>
                🖼️ Gallery
              </button>
              <button onClick={() => setActiveTab('video')} className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'video' ? 'bg-blue-600 text-white shadow-xl scale-105' : 'opacity-40 hover:opacity-100'}`}>
                🎬 Video Station
              </button>
              <button onClick={() => setActiveTab('cloud')} className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'cloud' ? 'bg-blue-600 text-white shadow-xl scale-105' : 'opacity-40 hover:opacity-100'}`}>
                ☁️ Gizmo Cloud
              </button>
            </div>

            {/* Khu vực hiển thị */}
            <div className="transition-all duration-500">
              {activeTab === 'gallery' && <GizmoGallery />}
              {activeTab === 'video' && <GizmoVideo />}
              {activeTab === 'cloud' && <GizmoCloud />}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}

export default App;