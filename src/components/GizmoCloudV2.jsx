import React, { useState, useEffect, useRef } from 'react';
import { Cloud, Upload, File, Folder, Eye, MoreVertical, FileText, ImageIcon, Film, AlertCircle, Search } from 'lucide-react';

function GizmoCloudV2({ userEmail, isDark }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fileInputRef = useRef(null);

  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxlJ3Qp36h6oDwYJ3aR45K5AqB9SQuqUrO2ElN_b3LdWVwItF3Lb5xiLSIe6DcnY3CCOQ/exec'; 

  const fetchMyFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${SCRIPT_URL}?userEmail=${encodeURIComponent(userEmail)}`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const sortedFiles = data.sort((a, b) => {
          const isAFolder = a.mimeType === 'application/vnd.google-apps.folder';
          const isBFolder = b.mimeType === 'application/vnd.google-apps.folder';
          return isBFolder - isAFolder;
        });
        setFiles(sortedFiles);
      } else {
        setFiles([]);
      }
    } catch (error) {
      console.error("Lỗi Gizmo Cloud:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userEmail) fetchMyFiles();
  }, [userEmail]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onloadend = async () => {
      const base64Data = reader.result.split(',')[1];
      try {
        const response = await fetch(SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            userEmail: userEmail || 'guest',
            fileName: file.name,
            mimeType: file.type,
            fileData: base64Data
          })
        });

        const result = await response.json();
        if (result.status === 'success') fetchMyFiles();
        else alert('Lỗi: ' + result.message);
      } catch (error) {
        alert('Lỗi kết nối máy chủ!');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = ''; 
      }
    };
    reader.readAsDataURL(file);
  };

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '---';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType, name) => {
    if (mimeType === 'application/vnd.google-apps.folder') return <Folder className="text-amber-500" size={20} fill="currentColor" opacity={0.2} />;
    if (mimeType.includes('image')) return <ImageIcon className="text-pink-500" size={20} />;
    if (mimeType.includes('video')) return <Film className="text-purple-500" size={20} />;
    if (name.startsWith('ytlink_')) return <Film className="text-red-500" size={20} />;
    return <FileText className="text-blue-500" size={20} />;
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const textMuted = isDark ? 'text-gray-400' : 'text-slate-500';

  return (
    <div className="p-4 md:p-8 h-full flex flex-col animate-fade-in relative">
      
      {isUploading && (
        <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-md flex flex-col items-center justify-center text-white">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-bold tracking-tight animate-pulse text-lg">Đang tải tệp lên Đám mây...</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-blue-600/10 rounded-lg text-blue-600">
              <Cloud size={24} />
            </div>
            <h2 className="text-2xl font-black tracking-tight">Gizmo Cloud</h2>
          </div>
          <p className={`text-sm ${textMuted}`}>Lưu trữ riêng tư của <b>{userEmail}</b></p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className={`relative flex-grow md:w-64 group`}>
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMuted} group-focus-within:text-blue-500 transition-colors`} size={16} />
            <input 
              type="text" 
              placeholder="Tìm tệp tin..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none text-sm transition-all ${isDark ? 'bg-black/20 border-white/10 focus:border-blue-500 focus:bg-black/40' : 'bg-slate-100 border-transparent focus:bg-white focus:border-blue-300'}`}
            />
          </div>
          
          <div className="relative">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            <button 
              onClick={() => fileInputRef.current.click()}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all whitespace-nowrap"
            >
              <Upload size={18} />
              <span className="hidden sm:inline">Tải lên</span>
            </button>
          </div>
        </div>
      </div>

      <div className={`flex-grow overflow-hidden rounded-2xl border flex flex-col ${isDark ? 'bg-black/20 border-white/5' : 'bg-white border-slate-200'}`}>
        <div className={`grid grid-cols-12 px-5 py-3 border-b text-[10px] font-bold uppercase tracking-widest ${isDark ? 'border-white/5 bg-white/5' : 'bg-slate-50 border-slate-200'} ${textMuted}`}>
          <div className="col-span-7 md:col-span-6">Tên tệp tin</div>
          <div className="col-span-3 hidden md:block text-right">Kích thước</div>
          <div className="col-span-5 md:col-span-3 text-right">Thao tác</div>
        </div>

        <div className="flex-grow overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-20">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className={`text-sm italic ${textMuted}`}>Đang quét dữ liệu...</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-20 opacity-30">
              <Cloud size={48} strokeWidth={1} />
              <p className="text-sm italic">Không tìm thấy tệp nào</p>
            </div>
          ) : (
            filteredFiles.map((file) => (
              <div 
                key={file.id} 
                className={`grid grid-cols-12 px-5 py-4 border-b last:border-0 items-center transition-colors group ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'}`}
              >
                <div className="col-span-7 md:col-span-6 flex items-center gap-3">
                  <div className="flex-shrink-0">{getFileIcon(file.mimeType, file.name)}</div>
                  <div className="truncate">
                    <p className="text-sm font-semibold truncate group-hover:text-blue-500 transition-colors">{file.name}</p>
                    <p className={`text-[10px] md:hidden ${textMuted}`}>{formatSize(file.size)}</p>
                  </div>
                </div>
                
                <div className={`col-span-3 hidden md:block text-right text-xs font-medium ${textMuted}`}>
                  {file.mimeType === 'application/vnd.google-apps.folder' ? '---' : formatSize(file.size)}
                </div>

                <div className="col-span-5 md:col-span-3 flex justify-end items-center gap-2">
                  <a 
                    href={`https://drive.google.com/file/d/${file.id}/view`} 
                    target="_blank" 
                    rel="noreferrer"
                    className={`p-2 rounded-lg transition-all flex items-center gap-2 text-xs font-bold ${isDark ? 'bg-white/5 hover:bg-blue-600 hover:text-white' : 'bg-slate-100 hover:bg-blue-600 hover:text-white'}`}
                  >
                    <Eye size={14} />
                    <span className="hidden sm:inline">Xem</span>
                  </a>
                  <button className={`p-2 rounded-lg ${textMuted} hover:bg-black/10 transition-colors`}>
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className={`mt-4 p-4 rounded-xl border flex items-start gap-3 ${isDark ? 'bg-blue-500/5 border-blue-500/10' : 'bg-blue-50 border-blue-100'}`}>
        <AlertCircle size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-[11px] leading-relaxed opacity-70">
          <b>Bảo mật 100%:</b> Dữ liệu trên đây được lưu trữ trong không gian riêng biệt của bạn.
        </p>
      </div>
    </div>
  );
}

export default GizmoCloudV2;