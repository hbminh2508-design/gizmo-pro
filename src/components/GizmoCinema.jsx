import React, { useState, useEffect } from 'react';
import { Film, Play, MonitorPlay, HardDrive, X, Plus, PlayCircle, Search, Info } from 'lucide-react';

function GizmoCinema({ userEmail, isDark }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [ytUrl, setYtUrl] = useState('');
  const [ytTitle, setYtTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxlJ3Qp36h6oDwYJ3aR45K5AqB9SQuqUrO2ElN_b3LdWVwItF3Lb5xiLSIe6DcnY3CCOQ/exec';

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

  const saveYoutubeLink = async (e) => {
    e.preventDefault();
    if (!ytUrl.includes('youtube.com') && !ytUrl.includes('youtu.be')) {
      alert("Vui lòng nhập link YouTube hợp lệ!");
      return;
    }
    setLoading(true);

    let finalTitle = ytTitle;
    
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
        finalTitle = "YouTube Video"; 
      }
    }

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

  const getYTId = (url) => {
    if (!url) return null;
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regExp);
    return (match && match[1].length === 11) ? match[1] : null;
  };

  const playVideo = (item) => {
    if (item.name.startsWith('ytlink_')) {
      setSelectedVideo({ 
        type: 'youtube', 
        id: item.id, 
        name: item.name.replace('ytlink_', '').replace('.txt', ''),
        url: item.ytUrl 
      });
    } else {
      setSelectedVideo({ 
        type: 'drive', 
        id: item.id, 
        name: item.name 
      });
    }
  };

  const filteredItems = items.filter(item => 
    item.name.replace('ytlink_', '').replace('.txt', '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const panelBg = isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200 shadow-sm';
  const itemHoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50';
  const textMuted = isDark ? 'text-gray-400' : 'text-slate-500';

  return (
    <div className="flex flex-col h-full gap-4 p-4 animate-fade-in relative">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-600/10 rounded-lg text-red-600">
            <Film size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">Gizmo Cinema</h2>
            <p className={`text-xs ${textMuted}`}>Không gian giải trí cá nhân</p>
          </div>
        </div>
        
        <form onSubmit={saveYoutubeLink} className={`flex flex-col sm:flex-row gap-2 w-full lg:w-auto p-2 rounded-2xl border ${isDark ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex gap-2 flex-grow">
            <div className="relative w-1/3 min-w-[120px]">
              <input 
                type="text" placeholder="Tên (tự lấy)..." value={ytTitle} onChange={e => setYtTitle(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border outline-none text-sm transition-all ${isDark ? 'bg-black/40 border-transparent focus:border-red-500' : 'bg-white border-slate-200 focus:border-red-400'}`}
              />
            </div>
            <div className="relative flex-grow">
              <MonitorPlay className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${textMuted}`} size={16} />
              <input 
                type="text" placeholder="Dán link YouTube..." value={ytUrl} onChange={e => setYtUrl(e.target.value)} required
                className={`w-full pl-8 pr-3 py-2 rounded-xl border outline-none text-sm transition-all ${isDark ? 'bg-black/40 border-transparent focus:border-red-500' : 'bg-white border-slate-200 focus:border-red-400'}`}
              />
            </div>
          </div>
          <button type="submit" className="bg-red-600 px-5 py-2 rounded-xl font-bold text-white shadow-md shadow-red-600/20 hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm whitespace-nowrap">
            <Plus size={16} /> Lưu Link
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-grow overflow-hidden">
        <div className={`lg:col-span-1 rounded-[1.5rem] p-4 flex flex-col gap-3 border ${panelBg} overflow-hidden`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-xs font-bold uppercase tracking-widest ${textMuted}`}>Thư viện phim</h3>
            <span className="text-xs font-bold bg-slate-200 dark:bg-white/10 px-2 py-0.5 rounded-full">{items.length}</span>
          </div>

          <div className="relative mb-2">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`} size={14} />
            <input 
              type="text" placeholder="Tìm video..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 rounded-lg outline-none text-xs border ${isDark ? 'bg-black/20 border-white/5 focus:border-white/20' : 'bg-slate-100 border-transparent focus:bg-white focus:border-slate-300'} transition-all`}
            />
          </div>

          <div className="flex-grow overflow-y-auto space-y-2 pr-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                <p className={`text-xs italic ${textMuted}`}>Đang đồng bộ...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className={`text-center py-10 italic text-sm ${textMuted}`}>
                Chưa có video nào
              </div>
            ) : (
              filteredItems.map(item => {
                const isYoutube = item.name.startsWith('ytlink_');
                const title = item.name.replace('ytlink_', '').replace('.txt', '');
                const isSelected = selectedVideo?.id === item.id;
                
                return (
                  <button 
                    key={item.id} 
                    onClick={() => playVideo(item)}
                    className={`w-full p-3 rounded-xl border transition-all text-left flex items-center gap-3 group
                      ${isSelected 
                        ? (isDark ? 'bg-red-600/20 border-red-500/50' : 'bg-red-50 border-red-200') 
                        : `border-transparent ${itemHoverBg}`}`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${isYoutube ? 'bg-red-100 text-red-600 dark:bg-red-600/20 dark:text-red-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400'}`}>
                      {isYoutube ? <MonitorPlay size={20} /> : <HardDrive size={20} />}
                    </div>
                    <div className="truncate flex-grow">
                      <p className={`font-semibold text-sm truncate ${isSelected && !isDark ? 'text-red-700' : ''}`}>{title}</p>
                      <p className={`text-[10px] uppercase tracking-tighter mt-0.5 ${textMuted}`}>
                        {isYoutube ? 'YouTube' : 'Cloud Video'}
                      </p>
                    </div>
                    {isSelected && <PlayCircle size={16} className="text-red-500 flex-shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-[1.5rem] border border-white/10 bg-[#0B0F19] overflow-hidden flex flex-col items-center justify-center relative min-h-[300px] shadow-2xl">
          {!selectedVideo ? (
            <div className="text-center text-gray-500 animate-fade-in flex flex-col items-center">
              <Film size={48} strokeWidth={1} className="mb-4 opacity-30" />
              <p className="font-medium text-sm">Chọn một video để bắt đầu phát</p>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col animate-fade-in">
              <div className="p-3 md:p-4 border-b border-white/10 flex justify-between items-center bg-black/60 backdrop-blur-md absolute top-0 left-0 right-0 z-10 opacity-0 hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center gap-3 truncate pr-4 text-white">
                  {selectedVideo.type === 'youtube' ? <MonitorPlay size={18} className="text-red-500" /> : <Play size={18} className="text-blue-500" />}
                  <span className="font-semibold text-sm truncate">{selectedVideo.name}</span>
                </div>
                <button onClick={() => setSelectedVideo(null)} className="p-2 rounded-lg bg-white/10 hover:bg-red-500 text-white transition-all">
                  <X size={16} />
                </button>
              </div>
              
              <div className="flex-grow w-full h-full bg-black relative">
                {selectedVideo.type === 'drive' ? (
                  <iframe 
                    src={`https://drive.google.com/file/d/${selectedVideo.id}/preview`}
                    className="absolute inset-0 w-full h-full border-none"
                    allow="autoplay"
                    allowFullScreen
                  ></iframe>
                ) : 
                selectedVideo.type === 'youtube' && selectedVideo.url ? (
                  <iframe 
                    src={`https://www.youtube.com/embed/${getYTId(selectedVideo.url)}?autoplay=1`}
                    className="absolute inset-0 w-full h-full border-none"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm text-gray-500 italic">
                    <Info size={16} className="mr-2"/> Đang tải dữ liệu hoặc Link bị lỗi...
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