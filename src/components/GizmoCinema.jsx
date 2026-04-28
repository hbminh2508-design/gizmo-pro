import React, { useState, useEffect } from 'react';

function GizmoCinema({ userEmail }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [ytUrl, setYtUrl] = useState('');
  const [ytTitle, setYtTitle] = useState('');
  
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxlJ3Qp36h6oDwYJ3aR45K5AqB9SQuqUrO2ElN_b3LdWVwItF3Lb5xiLSIe6DcnY3CCOQ/exec';

  const fetchContent = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${SCRIPT_URL}?userEmail=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      
      // Lọc lấy video hoặc file link youtube
      const filtered = data.filter(f => 
        f.mimeType.includes('video') || f.name.startsWith('ytlink_')
      );
      setItems(filtered);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchContent(); }, [userEmail]);

  const saveYoutubeLink = async (e) => {
    e.preventDefault();
    if (!ytUrl.includes('youtube.com') && !ytUrl.includes('youtu.be')) {
      alert("Vui lòng nhập link YouTube hợp lệ!");
      return;
    }
    setLoading(true);
    await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        action: 'save_yt',
        userEmail: userEmail,
        url: ytUrl,
        title: ytTitle || "Video mới"
      })
    });
    setYtUrl(''); setYtTitle('');
    fetchContent();
  };

  // Hàm lấy ID video YouTube từ link
  const getYTId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const playVideo = async (item) => {
    if (item.name.startsWith('ytlink_')) {
      // Đọc nội dung file txt để lấy link (thực tế script doGet nên trả về content nếu là link)
      // Để đơn giản, ta coi như name chứa title, và ta cần fetch content của file đó
      // Ở bản demo này, ta sẽ giả định link được lưu trực tiếp hoặc fetch thêm
      alert("Đang mở trình phát YouTube...");
      // Tính năng nâng cao: Fetch nội dung file txt để lấy URL
      // Hiện tại ta sẽ hiển thị placeholder cho đến khi script trả về link
      setSelectedVideo({ type: 'youtube', id: item.id, name: item.name.replace('ytlink_', '').replace('.txt', '') });
    } else {
      setSelectedVideo({ type: 'drive', id: item.id, name: item.name });
    }
  };

  return (
    <div className="flex flex-col h-full gap-6 p-4 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-3xl font-black text-red-500 flex items-center gap-2">🎬 Gizmo Cinema</h2>
        
        <form onSubmit={saveYoutubeLink} className="flex gap-2 w-full md:w-auto">
          <input 
            type="text" placeholder="Tên video..." value={ytTitle} onChange={e => setYtTitle(e.target.value)}
            className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-sm outline-none focus:border-red-500"
          />
          <input 
            type="text" placeholder="Dán link YouTube..." value={ytUrl} onChange={e => setYtUrl(e.target.value)}
            className="flex-grow md:w-64 px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-sm outline-none focus:border-red-500"
          />
          <button type="submit" className="bg-red-600 px-4 py-2 rounded-xl font-bold text-white shadow-lg shadow-red-600/20">Lưu</button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow overflow-hidden">
        {/* DANH SÁCH VIDEO */}
        <div className="lg:col-span-1 glass-panel rounded-3xl p-4 overflow-y-auto border border-white/10 flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase opacity-40 mb-2">Thư viện của bạn</h3>
          {loading ? <div className="text-center py-10 animate-pulse italic">Đang tìm phim...</div> : 
            items.map(item => (
              <button 
                key={item.id} 
                onClick={() => playVideo(item)}
                className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-red-600/20 hover:border-red-600/30 transition-all text-left flex items-center gap-3 group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">
                  {item.name.startsWith('ytlink_') ? '🔴' : '🎥'}
                </span>
                <div className="truncate">
                  <p className="font-bold text-sm truncate">{item.name.replace('ytlink_', '').replace('.txt', '')}</p>
                  <p className="text-[10px] opacity-50 uppercase tracking-tighter">
                    {item.name.startsWith('ytlink_') ? 'YouTube Link' : 'Cloud Video'}
                  </p>
                </div>
              </button>
            ))
          }
        </div>

        {/* TRÌNH PHÁT VIDEO */}
        <div className="lg:col-span-2 glass-panel rounded-3xl border border-white/10 bg-black/40 overflow-hidden flex flex-col items-center justify-center relative min-h-[300px]">
          {!selectedVideo ? (
            <div className="text-center opacity-30">
              <span className="text-6xl block mb-4">🍿</span>
              <p className="font-bold">Chọn một video để bắt đầu thưởng thức</p>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col">
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
                <span className="font-bold text-sm truncate mr-4"> đang phát: {selectedVideo.name}</span>
                <button onClick={() => setSelectedVideo(null)} className="text-xs opacity-50 hover:text-white">Đóng ✕</button>
              </div>
              <div className="flex-grow flex items-center justify-center p-2">
                {selectedVideo.type === 'drive' ? (
                  <video 
                    controls 
                    className="max-w-full max-h-full rounded-xl shadow-2xl"
                    src={`https://drive.google.com/uc?id=${selectedVideo.id}&export=download`}
                  />
                ) : (
                  <p className="text-xs italic opacity-50">Lưu ý: Để phát YouTube trực tiếp, cần fetch link từ file txt. Hiện tại hãy dùng link gốc trên Drive.</p>
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