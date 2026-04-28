import React, { useState, useEffect, useRef } from 'react';

// Nhận userEmail từ App.jsx truyền vào
function GizmoCloudV2({ userEmail }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);

  // ==========================================
  // ⚠️ LINK SCRIPT CỦA BẠN (Đã loại bỏ API KEY để bảo mật 100%)
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxlJ3Qp36h6oDwYJ3aR45K5AqB9SQuqUrO2ElN_b3LdWVwItF3Lb5xiLSIe6DcnY3CCOQ/exec'; 
  // ==========================================

  useEffect(() => {
    if (userEmail) {
      fetchMyFiles();
    }
  }, [userEmail]);

  // --- LẤY DANH SÁCH FILE THÔNG QUA APPS SCRIPT ---
  const fetchMyFiles = async () => {
    setLoading(true);
    try {
      // Gửi request GET kèm theo userEmail để Script trả về đúng file của người này
      const response = await fetch(`${SCRIPT_URL}?userEmail=${encodeURIComponent(userEmail)}`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        // Sắp xếp thư mục lên trên, file xuống dưới
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
      console.error("Lỗi Gizmo Cloud V2:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC UPLOAD FILE TỪ WEB LÊN GOOGLE DRIVE (VÀO THƯ MỤC CÁ NHÂN) ---
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
            userEmail: userEmail || 'guest', // Gửi email để Apps Script biết lưu vào đâu
            fileName: file.name,
            mimeType: file.type,
            fileData: base64Data
          })
        });

        const result = await response.json();
        if (result.status === 'success') {
          fetchMyFiles(); // Tải lại danh sách file sau khi upload thành công
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

  // --- CÁC HÀM TIỆN ÍCH HIỂN THỊ ---
  const formatSize = (bytes) => {
    if (!bytes) return '---';
    const mb = bytes / (1024 * 1024);
    return mb > 1024 ? (mb / 1024).toFixed(2) + ' GB' : mb.toFixed(2) + ' MB';
  };

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
    <div className="w-full h-full p-2 md:p-6 flex flex-col relative overflow-hidden animate-fade-in">
      
      {/* Màn hình chờ khi đang tải file lên */}
      {isUploading && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-white rounded-[2.5rem]">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <h3 className="text-xl font-bold animate-pulse">Đang đẩy file lên Mây riêng...</h3>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 flex-shrink-0">
        <div>
          <h2 className="text-3xl font-black flex items-center gap-3">
            <span className="text-blue-500">☁️</span> Gizmo Private Cloud
          </h2>
          <p className="text-sm opacity-50 font-medium">Không gian lưu trữ cá nhân được mã hóa</p>
        </div>
        
        <div className="flex items-center w-full md:w-auto">
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

      {/* Danh sách File */}
      {loading ? (
        <div className="flex-grow flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="flex-grow overflow-y-auto pr-2">
          <div className="grid grid-cols-1 gap-2">
            {/* Header bảng */}
            <div className="grid grid-cols-12 px-4 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-widest opacity-40 border-b border-white/10 sticky top-0 bg-inherit z-10 backdrop-blur-md">
              <div className="col-span-6 md:col-span-5">Tên tệp tin</div>
              <div className="col-span-3 md:col-span-3 text-right">Ngày tải lên</div>
              <div className="col-span-3 md:col-span-2 text-right hidden md:block">Size</div>
              <div className="col-span-3 md:col-span-2 text-right">Tác vụ</div>
            </div>

            {/* Render Files */}
            {files.length === 0 ? (
              <div className="text-center py-20 opacity-50 flex flex-col items-center gap-2">
                <span className="text-4xl">📂</span>
                <p className="italic">Đám mây của bạn đang trống</p>
              </div>
            ) : (
              files.map((file) => {
                const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                return (
                  <div 
                    key={file.id}
                    className="grid grid-cols-12 px-4 py-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all items-center"
                  >
                    {/* TÊN FILE */}
                    <div className="col-span-6 md:col-span-5 flex items-center gap-3">
                      <span className="text-2xl flex-shrink-0">{isFolder ? '📂' : '📄'}</span>
                      <span className="font-semibold text-sm truncate pr-2">
                        {file.name}
                      </span>
                    </div>
                    
                    {/* THỜI GIAN */}
                    <div className="col-span-3 md:col-span-3 text-right text-[10px] md:text-xs opacity-60">
                      {isFolder ? '--' : formatTime(file.createdTime)}
                    </div>
                    
                    {/* KÍCH THƯỚC (Ẩn trên mobile cho gọn) */}
                    <div className="hidden md:block col-span-2 text-right text-xs opacity-60 font-mono">
                      {isFolder ? '--' : formatSize(file.size)}
                    </div>

                    {/* TÁC VỤ */}
                    <div className="col-span-3 md:col-span-2 text-right flex justify-end">
                      {!isFolder && (
                        <a 
                          href={`https://drive.google.com/file/d/${file.id}/view`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-500 hover:bg-blue-500 hover:text-white font-bold text-xs transition-all flex items-center gap-1"
                        >
                          👁️ <span className="hidden sm:inline">Xem</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
      
      <p className="mt-4 text-[10px] opacity-40 italic text-center">
        🔒 Không gian riêng tư được mã hóa. Chỉ bạn ({userEmail}) mới có thể thấy và truy cập các tệp tin này.
      </p>
    </div>
  );
}

export default GizmoCloudV2;