import React, { useState, useEffect } from 'react';
import GizmoGallery from './components/GizmoGallery';
import GizmoCloud from './components/GizmoCloud';

function App() {
  // --- STATES ---
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login', 'register', 'forgot'
  const [activeTab, setActiveTab] = useState('gallery'); // 'gallery', 'cloud'
  
  // State quản lý dung lượng (Mặc định 5TB của bạn)
  const [storage, setStorage] = useState({
    limit: 5497558138880, // 5TB tính bằng Bytes
    usage: 644245094400,  // Giả lập bạn đã dùng 600GB
    percent: 11.7
  });

  // --- CONFIG ---
  // Đảm bảo bạn đã dán API Key vào đây nếu muốn dùng cho các tính năng mở rộng
  const API_KEY = 'YOUR_API_KEY_HERE'; 

  // --- EFFECTS ---
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Giả lập cập nhật dung lượng real-time mỗi khi vào app
  useEffect(() => {
    if (isLoggedIn) {
      // Trong tương lai, bạn sẽ gọi API fetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota...')
      // Hiện tại chúng ta duy trì logic hiển thị cho 5TB
      const used = 644245094400; // Có thể thay bằng con số bạn muốn hiển thị
      const total = 5497558138880;
      setStorage({
        limit: total,
        usage: used,
        percent: ((used / total) * 100).toFixed(1)
      });
    }
  }, [isLoggedIn]);

  // --- UTILS ---
  const formatSize = (bytes) => {
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // --- RENDER ---
  return (
    <div className={`min-h-screen w-full flex flex-col transition-colors duration-500
      ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-black to-blue-900 text-white' : 'bg-gradient-to-br from-blue-50 via-white to-purple-100 text-gray-800'}`}>
      
      {/* NÚT DARKMODE NỔI */}
      <div className="fixed top-6 right-6 z-50">
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="glass-panel px-5 py-2.5 rounded-full font-bold text-sm transition-all hover:scale-110 active:scale-95 flex items-center gap-2 border border-white/20 shadow-xl"
        >
          {isDarkMode ? '☀️ LIGHT' : '🌙 DARK'}
        </button>
      </div>

      {!isLoggedIn ? (
        // --- GIAO DIỆN XÁC THỰC (AUTHENTICATION) ---
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="glass-panel p-10 rounded-[2.5rem] w-full max-w-md border-white/20 shadow-2xl animate-fade-in relative overflow-hidden">
            <div className="text-center mb-10">
              <h1 className="text-5xl font-black mb-3 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                Gizmo Pro
              </h1>
              <p className="opacity-60 text-sm uppercase tracking-[0.2em] font-semibold">
                {authMode === 'login' && 'Đăng Nhập Hệ Thống'}
                {authMode === 'register' && 'Tạo Tài Khoản Mới'}
                {authMode === 'forgot' && 'Khôi Phục Mật Khẩu'}
              </p>
            </div>
            
            <form onSubmit={(e) => {e.preventDefault(); setIsLoggedIn(true)}} className="space-y-5">
              {authMode === 'register' && (
                <input type="text" placeholder="Họ và tên" className="w-full px-6 py-4 rounded-2xl bg-white/20 dark:bg-black/30 border border-white/10 outline-none backdrop-blur-xl focus:border-blue-500 transition-all" required />
              )}
              
              <input type="email" placeholder="Email" className="w-full px-6 py-4 rounded-2xl bg-white/20 dark:bg-black/30 border border-white/10 outline-none backdrop-blur-xl focus:border-blue-500 transition-all" required />
              
              {authMode !== 'forgot' && (
                <input type="password" placeholder="Mật khẩu" className="w-full px-6 py-4 rounded-2xl bg-white/20 dark:bg-black/30 border border-white/10 outline-none backdrop-blur-xl focus:border-blue-500 transition-all" required />
              )}

              {authMode === 'login' && (
                <div className="text-right">
                  <button type="button" onClick={() => setAuthMode('forgot')} className="text-xs text-blue-500 font-semibold hover:underline">Quên mật khẩu?</button>
                </div>
              )}

              <button type="submit" className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold shadow-lg hover:opacity-90 transition-all uppercase tracking-widest text-sm">
                {authMode === 'login' ? 'Vào Hệ Thống' : authMode === 'register' ? 'Đăng Ký Ngay' : 'Gửi Yêu Cầu'}
              </button>
            </form>

            <div className="text-center mt-8 pt-6 border-t border-white/10">
              {authMode === 'login' ? (
                <p className="text-sm opacity-70">Chưa có tài khoản? <button onClick={() => setAuthMode('register')} className="text-blue-500 font-bold hover:underline">Đăng ký</button></p>
              ) : (
                <button onClick={() => setAuthMode('login')} className="text-sm opacity-70 font-bold hover:underline">← Quay lại Đăng nhập</button>
              )}
            </div>
          </div>
        </div>
      ) : (
        // --- GIAO DIỆN TRANG CHỦ (DASHBOARD) ---
        <div className="w-full max-w-7xl mx-auto p-6 md:p-10 flex flex-col gap-8 animate-fade-in">
          
          {/* Header */}
          <header className="glass-panel rounded-[2rem] p-6 flex flex-col md:flex-row justify-between items-center gap-6 border border-white/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30">G</div>
              <div>
                <h2 className="text-2xl font-bold leading-tight">Gizmo Dashboard</h2>
                <p className="text-xs opacity-50 font-medium uppercase tracking-widest italic">Xin chào, Admin • Cloud v1.0</p>
              </div>
            </div>
            <button onClick={() => setIsLoggedIn(false)} className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-red-500/20 hover:text-red-500 border border-white/10 transition-all font-bold text-xs uppercase tracking-widest">Đăng Xuất</button>
          </header>

          <main className="space-y-8">
            {/* Widget Dung lượng Real-time */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="glass-panel p-8 rounded-[2.5rem] border border-white/10 col-span-2 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 text-8xl font-black italic">5TB</div>
                <div className="relative z-10">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <p className="text-xs opacity-50 font-bold uppercase tracking-widest mb-1">Dung lượng Google Drive</p>
                      <h3 className="text-4xl font-black">{formatSize(storage.usage)} <span className="text-lg font-normal opacity-30">/ {formatSize(storage.limit)}</span></h3>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-blue-500">{storage.percent}%</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-white/5 h-4 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="bg-gradient-to-r from-blue-600 via-blue-400 to-purple-500 h-full transition-all duration-1000 shadow-[0_0_20px_rgba(37,99,235,0.4)]" 
                      style={{ width: `${storage.percent}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-8 rounded-[2.5rem] border border-white/10 flex flex-col justify-center">
                <p className="text-xs opacity-50 font-bold uppercase tracking-widest mb-2">Trạng thái API</p>
                <div className="flex items-center gap-4">
                  <span className="w-4 h-4 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_#22c55e]"></span>
                  <div>
                    <p className="text-xl font-black text-green-500 tracking-tight">LIVE SYNC</p>
                    <p className="text-[10px] opacity-40 font-bold uppercase">Phản hồi: 24ms</p>
                  </div>
                </div>
              </div>
            </div>

            {/* HỆ THỐNG TAB TÍNH NĂNG */}
            <div className="flex flex-col gap-6">
              <div className="flex p-1.5 glass-panel rounded-2xl w-fit border border-white/10 shadow-inner">
                <button 
                  onClick={() => setActiveTab('gallery')}
                  className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'gallery' ? 'bg-blue-600 text-white shadow-xl scale-105' : 'opacity-40 hover:opacity-100'}`}
                >
                  🖼️ Gallery
                </button>
                <button 
                  onClick={() => setActiveTab('cloud')}
                  className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'cloud' ? 'bg-blue-600 text-white shadow-xl scale-105' : 'opacity-40 hover:opacity-100'}`}
                >
                  ☁️ Gizmo Cloud
                </button>
              </div>

              {/* KHU VỰC HIỂN THỊ NỘI DUNG */}
              <div className="transition-all duration-500">
                {activeTab === 'gallery' ? <GizmoGallery /> : <GizmoCloud />}
              </div>
            </div>
          </main>

          <footer className="mt-16 pb-10 text-center">
            <p className="opacity-20 text-[10px] tracking-[0.6em] font-black uppercase italic">
              Gizmo Pro Enterprise • Powered by Google Drive API & Vercel
            </p>
          </footer>
        </div>
      )}
    </div>
  );
}

export default App;