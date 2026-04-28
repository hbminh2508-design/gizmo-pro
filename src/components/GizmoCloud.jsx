import React, { useState, useEffect, useRef } from 'react';

function GizmoCloud() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [folderHistory, setFolderHistory] = useState([]); 

  const fileInputRef = useRef(null);

  // ==========================================
  // ⚠️ ĐÃ GIỮ NGUYÊN THÔNG TIN CỦA BẠN:
  const [currentFolderId, setCurrentFolderId] = useState('1S-KzX2Z9lRfLFEMa3VAWpLgHjV-l1e9Z'); 
  const API_KEY = 'AIzaSyDxyuPImrEe9RxLdsbVSSYAA3wHTrhpCWY'; 
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxlJ3Qp36h6oDwYJ3aR45K5AqB9SQuqUrO2ElN_b3LdWVwItF3Lb5xiLSIe6DcnY3CCOQ/exec'; 
  // ==========================================

  useEffect(() => {
    fetchFiles(currentFolderId);
  }, [currentFolderId]);

  const fetchFiles = async (folderId) => {
    setLoading(true);
    try {
      const query = `'${folderId}' in parents and trashed = false`;
      // Bổ sung thêm 'createdTime' vào trường lấy dữ liệu từ Google Drive
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&key=${API_KEY}&fields=files(id,name,mimeType,size,iconLink,createdTime)&pageSize=100`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.files) {
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

  // --- LOGIC UPLOAD FILE TỪ WEB LÊN GOOGLE DRIVE ---
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
            fileName: file.name,
            mimeType: file.type,
            fileData: base64Data
          })
        });

        const result = await response.json();
        if (result.status === 'success') {
          fetchFiles(currentFolderId); // Tải lại danh sách file sau khi upload thành công
        } else {
          alert('Lỗi khi tải lên: ' + result.message);
        }
      } catch (error) {
        console.error("Lỗi Upload:", error);
        alert('Có lỗi xảy ra khi kết nối tới máy chủ!');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = ''; 
      }
    };
    
    reader.readAsDataURL(file);
  };

  // --- CÁC HÀM TIỆN ÍCH ---
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

  // HÀM CHUYỂN ĐỔI THỜI GIAN CHUẨN (Thêm số 0 vào trước nếu < 10)
  const formatTime = (timeStr) => {
    if (!timeStr) return '--';
    const date = new Date(timeStr);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${hours}:${minutes} - ${day}/${month}/${year}`;
  };

  return (
    <div className="w-full glass-panel rounded-[2.5rem] p-8 border border-white/20 shadow-2xl relative overflow-hidden">
      
      {/* Màn hình chờ khi đang tải file lên */}
      {isUploading && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-white rounded-[2.5rem]">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <h3 className="text-xl font-bold animate-pulse">Đang đẩy file lên Mây...</h3>
          <p className="opacity-70 text-sm">Vui lòng không đóng trình duyệt</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black flex items-center gap-3">
            <span className="text-blue-500">☁️</span> Gizmo Cloud
          </h2>
          <p className="text-sm opacity-50 font-medium">Trình quản lý tệp tin trực tiếp</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {folderHistory.length > 0 && (
            <button onClick={goBack} className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-sm font-bold border border-white/10 flex-shrink-0">
              ← Quay lại
            </button>
          )}

          {/* NÚT UPLOAD FILE */}
          <div className="relative w-full md:w-auto">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
            />
            <button className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold shadow-lg hover:shadow-blue-500/50 transition-all flex items-center justify-center gap-2">
              <span>📤</span> Tải File Lên
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {/* Header bảng - Đã điều chỉnh chia cột để thêm phần thời gian */}
          <div className="grid grid-cols-12 px-4 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-widest opacity-40 border-b border-white/10">
            <div className="col-span-5 md:col-span-5">Tên tệp tin</div>
            <div className="col-span-3 md:col-span-3 text-right">Ngày tải lên</div>
            <div className="col-span-2 md:col-span-2 text-right">Size</div>
            <div className="col-span-2 md:col-span-2 text-right">Tác vụ</div>
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
                  className="grid grid-cols-12 px-4 py-4 rounded-2xl hover:bg-white/10 dark:hover:bg-white/5 transition-all group items-center cursor-pointer"
                  onClick={() => isFolder && handleFolderClick(file.id, file.name)}
                >
                  {/* TÊN FILE */}
                  <div className="col-span-5 md:col-span-5 flex items-center gap-3">
                    <span className="text-2xl">{isFolder ? '📂' : '📄'}</span>
                    <span className="font-semibold text-sm truncate pr-2 group-hover:text-blue-500 transition-colors">
                      {file.name}
                    </span>
                  </div>
                  
                  {/* CỘT THỜI GIAN MỚI THÊM */}
                  <div className="col-span-3 md:col-span-3 text-right text-xs opacity-60">
                    {isFolder ? '--' : formatTime(file.createdTime)}
                  </div>
                  
                  {/* CỘT KÍCH THƯỚC */}
                  <div className="col-span-2 md:col-span-2 text-right text-xs opacity-60 font-mono">
                    {isFolder ? '--' : formatSize(file.size)}
                  </div>

                  {/* CỘT TÁC VỤ */}
                  <div className="col-span-2 md:col-span-2 text-right">
                    {!isFolder && (
                      <a 
                        href={`https://drive.google.com/file/d/${file.id}/view`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 rounded-lg hover:bg-blue-500/20 text-blue-500 transition-all opacity-0 group-hover:opacity-100 inline-block"
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