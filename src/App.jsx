import React, { useState, useEffect } from 'react';
import GizmoGallery from './components/GizmoGallery';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // State mới để quản lý màn hình: 'login', 'register', hoặc 'forgot'
  const [authMode, setAuthMode] = useState('login'); 

  // Xử lý logic Dark Mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Các hàm xử lý giả lập (Sẽ thay bằng Firebase/Supabase sau này)
  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoggedIn(true);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    alert("Đăng ký thành công! Đang tự động đăng nhập...");
    setIsLoggedIn(true);
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    alert("Một liên kết khôi phục mật khẩu đã được gửi đến email của bạn!");
    setAuthMode('login'); // Gửi xong thì quay lại trang đăng nhập
  };

  return (
    <div className={`min-h-screen w-full flex flex-col transition-colors duration-500
      ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-black to-blue-900 text-white' : 'bg-gradient-to-br from-blue-50 via-white to-purple-100 text-gray-800'}`}>
      
      {/* NÚT DARKMODE */}
      <div className="fixed top-6 right-6 z-50">
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="glass-panel px-5 py-2.5 rounded-full font-bold text-sm tracking-wide transition-all hover:scale-110 active:scale-95 flex items-center gap-2 border border-white/20 shadow-xl"
        >
          {isDarkMode ? '☀️ LIGHT' : '🌙 DARK'}
        </button>
      </div>

      {!isLoggedIn ? (
        // --- KHU VỰC XÁC THỰC (LOGIN / REGISTER / FORGOT PASSWORD) ---
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="glass-panel p-10 rounded-[2.5rem] w-full max-w-md border-white/20 shadow-2xl relative overflow-hidden">
            
            {/* Tiêu đề chung */}
            <div className="text-center mb-8">
              <h1 className="text-5xl font-black mb-3 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 transition-all">
                Gizmo Pro
              </h1>
              <p className="opacity-60 text-sm uppercase tracking-[0.2em] font-semibold">
                {authMode === 'login' && 'Management Suite'}
                {authMode === 'register' && 'Tạo Tài Khoản Mới'}
                {authMode === 'forgot' && 'Khôi Phục Mật Khẩu'}
              </p>
            </div>
            
            {/* FORM ĐĂNG NHẬP */}
            {authMode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-6 animate-fade-in">
                <div>
                  <input type="email" placeholder="Email" required
                    className="w-full px-6 py-4 rounded-2xl bg-white/20 dark:bg-black/30 border border-white/20 focus:border-blue-500 outline-none backdrop-blur-xl transition-all placeholder:text-gray-400 dark:text-white"
                  />
                </div>
                <div>
                  <input type="password" placeholder="Mật khẩu" required
                    className="w-full px-6 py-4 rounded-2xl bg-white/20 dark:bg-black/30 border border-white/20 focus:border-blue-500 outline-none backdrop-blur-xl transition-all placeholder:text-gray-400 dark:text-white"
                  />
                </div>
                <div className="flex justify-end">
                  <button type="button" onClick={() => setAuthMode('forgot')} className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    Quên mật khẩu?
                  </button>
                </div>
                <button type="submit" className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold transition-all shadow-[0_10px_30px_-10px_rgba(37,99,235,0.5)] hover:shadow-blue-500/40">
                  Đăng Nhập
                </button>
                <div className="text-center mt-6">
                  <p className="text-sm opacity-70">Chưa có tài khoản?{' '}
                    <button type="button" onClick={() => setAuthMode('register')} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                      Đăng ký ngay
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* FORM ĐĂNG KÝ */}
            {authMode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-5 animate-fade-in">
                <div>
                  <input type="text" placeholder="Họ và tên" required
                    className="w-full px-6 py-4 rounded-2xl bg-white/20 dark:bg-black/30 border border-white/20 focus:border-blue-500 outline-none backdrop-blur-xl transition-all placeholder:text-gray-400 dark:text-white"
                  />
                </div>
                <div>
                  <input type="email" placeholder="Email" required
                    className="w-full px-6 py-4 rounded-2xl bg-white/20 dark:bg-black/30 border border-white/20 focus:border-blue-500 outline-none backdrop-blur-xl transition-all placeholder:text-gray-400 dark:text-white"
                  />
                </div>
                <div>
                  <input type="password" placeholder="Mật khẩu" required
                    className="w-full px-6 py-4 rounded-2xl bg-white/20 dark:bg-black/30 border border-white/20 focus:border-blue-500 outline-none backdrop-blur-xl transition-all placeholder:text-gray-400 dark:text-white"
                  />
                </div>
                <button type="submit" className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold transition-all shadow-[0_10px_30px_-10px_rgba(147,51,234,0.5)] hover:shadow-purple-500/40 mt-2">
                  Hoàn Tất Đăng Ký
                </button>
                <div className="text-center mt-6">
                  <p className="text-sm opacity-70">Đã có tài khoản?{' '}
                    <button type="button" onClick={() => setAuthMode('login')} className="text-purple-600 dark:text-purple-400 font-bold hover:underline">
                      Đăng nhập
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* FORM QUÊN MẬT KHẨU */}
            {authMode === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-6 animate-fade-in">
                <p className="text-center text-sm opacity-80 mb-6">
                  Đừng lo lắng! Nhập email của bạn và chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.
                </p>
                <div>
                  <input type="email" placeholder="Nhập email của bạn" required
                    className="w-full px-6 py-4 rounded-2xl bg-white/20 dark:bg-black/30 border border-white/20 focus:border-blue-500 outline-none backdrop-blur-xl transition-all placeholder:text-gray-400 dark:text-white"
                  />
                </div>
                <button type="submit" className="w-full py-4 rounded-2xl bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white font-bold transition-all shadow-lg mt-2">
                  Gửi Liên Kết Khôi Phục
                </button>
                <div className="text-center mt-6">
                  <button type="button" onClick={() => setAuthMode('login')} className="text-sm text-gray-500 dark:text-gray-400 font-bold hover:underline flex items-center justify-center gap-2 w-full">
                    <span>←</span> Quay lại đăng nhập
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>

      ) : (
        // --- GIAO DIỆN TRANG CHỦ (DASHBOARD) ---
        <div className="w-full max-w-7xl mx-auto p-6 md:p-10 flex flex-col gap-8 animate-fade-in">
          
          <header className="glass-panel rounded-[2rem] p-6 flex flex-col md:flex-row justify-between items-center gap-6 border border-white/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30">G</div>
              <div>
                <h2 className="text-2xl font-bold leading-tight">Gizmo Dashboard</h2>
                <p className="text-xs opacity-50 font-medium uppercase tracking-widest">Xin chào, Admin</p>
              </div>
            </div>
            
            <button 
              onClick={() => setIsLoggedIn(false)}
              className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-red-500/20 hover:text-red-500 border border-white/10 transition-all font-semibold text-sm"
            >
              Đăng Xuất
            </button>
          </header>

          <main className="space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="glass-panel p-6 rounded-3xl border border-white/10">
                <p className="text-sm opacity-60 mb-1">Tổng dung lượng Drive</p>
                <p className="text-3xl font-bold">5.0 TB</p>
                <div className="mt-4 w-full bg-gray-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full w-[12%] shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                </div>
              </div>
              <div className="glass-panel p-6 rounded-3xl border border-white/10">
                <p className="text-sm opacity-60 mb-1">Trạng thái API</p>
                <p className="text-3xl font-bold text-green-500 flex items-center gap-3">
                  <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span>
                  Đã kết nối
                </p>
              </div>
              <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col justify-center">
                <p className="text-sm opacity-60 mb-1">Đồng bộ hóa</p>
                <p className="text-xl font-semibold italic text-blue-500">Google Drive Real-time</p>
              </div>
            </div>

            <section className="mt-4">
              <GizmoGallery />
            </section>
          </main>

          <footer className="mt-16 pb-8 text-center opacity-30 text-xs tracking-[0.3em] font-bold uppercase">
            Gizmo Pro v1.0 • Powered by Google Drive API
          </footer>
        </div>
      )}
    </div>
  );
}

export default App;