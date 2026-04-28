import React, { useState, useEffect } from 'react';

function GizmoCinema({ userEmail }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [ytUrl, setYtUrl] = useState('');
  const [ytTitle, setYtTitle] = useState('');
  
  // ==========================================
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxlJ3Qp36h6oDwYJ3aR45K5AqB9SQuqUrO2ElN_b3LdWVwItF3Lb5xiLSIe6DcnY3CCOQ/exec';
  // ==========================================

  const fetchContent = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${SCRIPT_URL}?userEmail=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      
      const filtered = data.filter(f => 
        f.mimeType.includes('video') || f.name.startsWith('ytlink_')
      );
      setItems(filtered);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchContent(); }, [userEmail]);

  // HÀM MỚI: TỰ ĐỘNG LẤY TIÊU ĐỀ YOUTUBE NẾU BỎ TRỐNG
  const saveYoutubeLink = async (e) => {
    e.preventDefault();
    if (!ytUrl.includes('youtube.com') && !ytUrl.includes('youtu.be')) {
      alert("Vui lòng nhập link YouTube hợp lệ!");
      return;
    }
    setLoading(true);

    let finalTitle = ytTitle;
    
    // Nếu người dùng không tự nhập tên, tự động fetch tên từ YouTube
    if (!finalTitle.trim()) {
      try {
        const response = await fetch(`https://noembed.com/embed?dataType=json&url=${ytUrl}`);
        const data = await response.json();
        if (data.title) {
          finalTitle = data.title;
        } else {
          finalTitle = "YouTube Video";
        }
      } catch (error) {
        finalTitle = "YouTube Video"; // Fallback nếu lỗi mạng
      }
    }

    // Gửi tên đã xử lý lên Google Drive
    await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        action: 'save_yt',
        userEmail: userEmail,
        url: ytUrl,
        title: finalTitle
      })
    });
    
    setYtUrl(''); 
    setYtTitle('');
    fetchContent();
  };

  // Hàm trích xuất ID Video YouTube cực chuẩn (Hỗ trợ cả Shorts)
  const getYTId = (url) => {
    if (!url) return null;
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regExp);
    return (match && match[1].length === 11) ? match[1] : null;
  };

  // HÀM MỞ VIDEO ĐÃ SỬA LỖI
  const playVideo = (item) => {
    if (item.name.startsWith('ytlink_')) {
      setSelectedVideo({ 
        type: 'youtube', 
        id: item.id, 
        name: item.name.replace('ytlink_', '').replace('.txt', ''),
        url: item.ytUrl // Thuộc tính này do App Script mới trả về
      });
    } else {
      setSelectedVideo({ 
        type: 'drive', 
        id: item.id, 
        name: item.name 
      });
    }
  };

  return (
    <div className="flex flex-col h-full gap-6 p-4 animate-fade-in">
      {/* HEADER & FORM NHẬP LINK */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-3xl font-black text-red-500 flex items-center gap-2">🎬 Gizmo Cinema</h2>
        
        <form onSubmit={saveYoutubeLink} className="flex gap-2 w-full md:w-auto">
          <input 
            type="text" placeholder="Tên (Để trống tự fetch)..." value={ytTitle} onChange={e => setYtTitle(e.target.value)}
            className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-sm outline-none focus:border-red-500 w-1/3 md:w-auto"
          />
          <input 
            type="text" placeholder="Dán link YouTube..." value={ytUrl} onChange={e => setYtUrl(e.target.value)}
            className="flex-grow md:w-64 px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-sm outline-none focus:border-red-500"
            required
          />
          <button type="submit" className="bg-red-600 px-4 py-2 rounded-xl font-bold text-white shadow-lg shadow-red-600/20 hover:scale-105 transition-transform">Lưu</button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow overflow-hidden">
        
        {/* DANH SÁCH VIDEO (CỘT TRÁI) */}
        <div className="lg:col-span-1 glass-panel rounded-3xl p-4 overflow-y-auto border border-white/10 flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase opacity-40 mb-2">Thư viện của bạn</h3>
          {loading ? <div className="text-center py-10 animate-pulse italic opacity-50">Đang đồng bộ kho phim...</div> : 
            items.length === 0 ? <div className="text-center py-10 italic opacity-30 text-sm">Chưa có video nào</div> :
            items.map(item => (
              <button 
                key={item.id} 
                onClick={() => playVideo(item)}
                className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center gap-3 group
                  ${selectedVideo?.id === item.id ? 'bg-red-600/20 border-red-500 shadow-inner' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">
                  {item.name.startsWith('ytlink_') ? '🔴' : '🎥'}
                </span>
                <div className="truncate">
                  <p className="font-bold text-sm truncate">{item.name.replace('ytlink_', '').replace('.txt', '')}</p>
                  <p className="text-[10px] opacity-50 uppercase tracking-tighter mt-0.5">
                    {item.name.startsWith('ytlink_') ? 'YouTube Link' : 'Cloud Video'}
                  </p>
                </div>
              </button>
            ))
          }
        </div>

        {/* TRÌNH PHÁT VIDEO (CỘT PHẢI) */}
        <div className="lg:col-span-2 glass-panel rounded-3xl border border-white/10 bg-black/60 overflow-hidden flex flex-col items-center justify-center relative min-h-[300px] shadow-2xl">
          {!selectedVideo ? (
            <div className="text-center opacity-30 animate-fade-in">
              <span className="text-6xl block mb-4">🍿</span>
              <p className="font-bold">Chọn một video để bắt đầu thưởng thức</p>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col animate-fade-in">
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40">
                <span className="font-bold text-sm truncate mr-4 flex items-center gap-2">
                  {selectedVideo.type === 'youtube' ? '🔴' : '🎥'} {selectedVideo.name}
                </span>
                <button onClick={() => setSelectedVideo(null)} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-red-500 hover:text-white transition-all">Đóng ✕</button>
              </div>
              
              <div className="flex-grow w-full h-full p-2 md:p-4">
                {/* HIỂN THỊ VIDEO TỪ GOOGLE DRIVE */}
                {selectedVideo.type === 'drive' ? (
                  <iframe 
                    src={`https://drive.google.com/file/d/${selectedVideo.id}/preview`}
                    className="w-full h-full rounded-2xl shadow-2xl border-none"
                    allow="autoplay"
                    allowFullScreen
                  ></iframe>
                ) : 
                /* HIỂN THỊ VIDEO TỪ YOUTUBE */
                selectedVideo.type === 'youtube' && selectedVideo.url ? (
                  <iframe 
                    src={`https://www.youtube.com/embed/${getYTId(selectedVideo.url)}?autoplay=1`}
                    className="w-full h-full rounded-2xl shadow-2xl border-none"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm opacity-50 italic">
                    Đang tải dữ liệu hoặc Link bị lỗi...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GizmoCinema;