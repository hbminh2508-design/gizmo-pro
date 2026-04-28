import React, { useState, useEffect } from 'react';

function GizmoVideo() {
  const [driveVideos, setDriveVideos] = useState([]);
  const [ytLinks, setYtLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newYtLink, setNewYtLink] = useState('');

  // ⚠️ THAY THẾ BẰNG KEY VÀ ID CỦA BẠN (Cùng thông tin với Gallery)
  const API_KEY = 'AIzaSyDxyuPImrEe9RxLdsbVSSYAA3wHTrhpCWY';
  const FOLDER_ID = '1S-KzX2Z9lRfLFEMa3VAWpLgHjV-l1e9Z';

  // Lấy Video từ Drive và Links từ LocalStorage
  useEffect(() => {
    // 1. Lấy links YouTube đã lưu
    const savedLinks = JSON.parse(localStorage.getItem('gizmo_yt_links')) || [];
    setYtLinks(savedLinks);

    // 2. Lấy video từ Drive
    const fetchDriveVideos = async () => {
      try {
        const url = `https://www.googleapis.com/drive/v3/files?q='${FOLDER_ID}'+in+parents+and+trashed=false&key=${API_KEY}&fields=files(id,name,mimeType)&pageSize=50`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.files) {
          const videosOnly = data.files.filter(item => item.mimeType.includes('video'));
          setDriveVideos(videosOnly);
        }
        setLoading(false);
      } catch (error) {
        console.error("Lỗi tải video Drive:", error);
        setLoading(false);
      }
    };

    fetchDriveVideos();
  }, []);

  // Hàm trích xuất ID từ link YouTube
  const extractYtId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Thêm link YouTube mới
  const handleAddYtLink = (e) => {
    e.preventDefault();
    const videoId = extractYtId(newYtLink);
    if (videoId) {
      const newLinks = [{ id: Date.now(), videoId: videoId, url: newYtLink }, ...ytLinks];
      setYtLinks(newLinks);
      localStorage.setItem('gizmo_yt_links', JSON.stringify(newLinks));
      setNewYtLink('');
    } else {
      alert("Link YouTube không hợp lệ!");
    }
  };

  // Xóa link YouTube
  const removeYtLink = (idToRemove) => {
    const updatedLinks = ytLinks.filter(item => item.id !== idToRemove);
    setYtLinks(updatedLinks);
    localStorage.setItem('gizmo_yt_links', JSON.stringify(updatedLinks));
  };

  return (
    <div className="w-full animate-fade-in flex flex-col gap-10">
      
      {/* KHU VỰC YOUTUBE */}
      <div className="glass-panel p-8 rounded-[2.5rem] border border-white/20 shadow-xl">
        <h2 className="text-2xl font-bold mb-6 text-red-500 flex items-center gap-2">
          <span>▶️</span> YouTube Station
        </h2>
        
        <form onSubmit={handleAddYtLink} className="flex gap-4 mb-8">
          <input 
            type="text" 
            value={newYtLink}
            onChange={(e) => setNewYtLink(e.target.value)}
            placeholder="Dán link YouTube vào đây..."
            className="flex-grow px-6 py-4 rounded-2xl bg-white/10 border border-white/10 outline-none focus:border-red-500 transition-all"
            required
          />
          <button type="submit" className="px-8 py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow-lg">
            Thêm Video
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ytLinks.map((yt) => (
            <div key={yt.id} className="relative group rounded-3xl overflow-hidden bg-black/50 aspect-video">
              <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${yt.videoId}`} title="YouTube" frameBorder="0" allowFullScreen></iframe>
              <button onClick={() => removeYtLink(yt.id)} className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
            </div>
          ))}
          {ytLinks.length === 0 && <p className="opacity-50 italic col-span-2">Chưa có video YouTube nào được thêm.</p>}
        </div>
      </div>

      {/* KHU VỰC GOOGLE DRIVE VIDEO */}
      <div className="glass-panel p-8 rounded-[2.5rem] border border-white/20 shadow-xl">
        <h2 className="text-2xl font-bold mb-6 text-blue-500 flex items-center gap-2">
          <span>☁️</span> Drive Videos
        </h2>
        
        {loading ? (
          <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {driveVideos.length === 0 ? (
              <p className="opacity-50 italic">Không tìm thấy file video nào trong thư mục này.</p>
            ) : (
              driveVideos.map((video) => (
                <div key={video.id} className="rounded-3xl overflow-hidden bg-black aspect-video relative group">
                  {/* Google Drive Preview Iframe */}
                  <iframe 
                    className="w-full h-full"
                    src={`https://drive.google.com/file/d/${video.id}/preview`} 
                    title={video.name}
                    frameBorder="0" 
                    allow="autoplay"
                    allowFullScreen
                  ></iframe>
                </div>
              ))
            )}
          </div>
        )}
      </div>

    </div>
  );
}

export default GizmoVideo;