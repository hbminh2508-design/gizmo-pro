import React, { useState, useEffect } from 'react';

function GizmoCloud() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState('YOUR_FOLDER_ID_HERE'); // Thay ID thư mục gốc của bạn
  const [folderHistory, setFolderHistory] = useState([]); // Để quay lại thư mục trước

  const API_KEY = 'YOUR_API_KEY_HERE'; // Thay API Key của bạn

  useEffect(() => {
    fetchFiles(currentFolderId);
  }, [currentFolderId]);

  const fetchFiles = async (folderId) => {
    setLoading(true);
    try {
      // Query: lấy các file nằm trong folderId và chưa bị xóa
      const query = `'${folderId}' in parents and trashed = false`;
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&key=${API_KEY}&fields=files(id,name,mimeType,size,iconLink)&pageSize=100`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.files) {
        // Sắp xếp: Thư mục hiện lên trước, tệp tin hiện sau
        const sortedFiles = data.files.sort((a, b) => {
          const isAFolder = a.mimeType === 'application/vnd.google-apps.folder';
          const isBFolder = b.mimeType === 'application/vnd.google-apps.folder';
          return isBFolder - isAFolder;
        });
        setFiles(sortedFiles);
      }
      setLoading(false);
    } catch (error) {
      console.error("Lỗi Gizmo Cloud:", error);
      setLoading(false);
    }
  };

  const handleFolderClick = (id, name) => {
    setFolderHistory([...folderHistory, { id: currentFolderId, name: "Back" }]);
    setCurrentFolderId(id);
  };

  const goBack = () => {
    const previous = folderHistory.pop();
    if (previous) {
      setFolderHistory([...folderHistory]);
      setCurrentFolderId(previous.id);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '---';
    const mb = bytes / (1024 * 1024);
    return mb > 1024 ? (mb / 1024).toFixed(2) + ' GB' : mb.toFixed(2) + ' MB';
  };

  return (
    <div className="w-full glass-panel rounded-[2.5rem] p-8 border border-white/20 shadow-2xl animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black flex items-center gap-3">
            <span className="text-blue-500">☁️</span> Gizmo Cloud
          </h2>
          <p className="text-sm opacity-50 font-medium">Trình quản lý tệp tin trực tiếp</p>
        </div>
        
        {folderHistory.length > 0 && (
          <button 
            onClick={goBack}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-sm font-bold border border-white/10"
          >
            ← Quay lại
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {/* Header bảng */}
          <div className="grid grid-cols-12 px-4 py-3 text-xs font-bold uppercase tracking-widest opacity-40 border-b border-white/10">
            <div className="col-span-7 md:col-span-8">Tên tệp tin</div>
            <div className="col-span-3 md:col-span-2 text-right">Kích thước</div>
            <div className="col-span-2 text-right">Tác vụ</div>
          </div>

          {/* Danh sách file */}
          {files.length === 0 ? (
            <p className="text-center py-10 opacity-50 italic">Thư mục này trống</p>
          ) : (
            files.map((file) => {
              const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
              return (
                <div 
                  key={file.id}
                  className="grid grid-cols-12 px-4 py-4 rounded-2xl hover:bg-white/5 dark:hover:bg-white/5 transition-all group items-center cursor-pointer"
                  onClick={() => isFolder && handleFolderClick(file.id, file.name)}
                >
                  <div className="col-span-7 md:col-span-8 flex items-center gap-4">
                    <span className="text-2xl">{isFolder ? '📂' : '📄'}</span>
                    <span className="font-semibold truncate pr-4 group-hover:text-blue-500 transition-colors">
                      {file.name}
                    </span>
                  </div>
                  <div className="col-span-3 md:col-span-2 text-right text-sm opacity-60 font-mono">
                    {isFolder ? '--' : formatSize(file.size)}
                  </div>
                  <div className="col-span-2 text-right">
                    {!isFolder && (
                      <a 
                        href={`https://drive.google.com/file/d/${file.id}/view`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 rounded-lg hover:bg-blue-500/20 text-blue-500 transition-all opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        👁️
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default GizmoCloud;