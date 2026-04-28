import React, { useState, useEffect } from 'react';

function GizmoGallery() {
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // ⚠️ THAY THẾ BẰNG KEY VÀ ID CỦA BẠN
  const API_KEY = 'AIzaSyDxyuPImrEe9RxLdsbVSSYAA3wHTrhpCWY';
  const FOLDER_ID = 'AIzaSyDxyuPImrEe9RxLdsbVSSYAA3wHTrhpCWY';

  useEffect(() => {
    // Gọi API của Google Drive để lấy danh sách file trong thư mục
    const fetchDriveData = async () => {
      try {
        const url = `https://www.googleapis.com/drive/v3/files?q='${FOLDER_ID}'+in+parents&key=${API_KEY}&fields=files(id,name,mimeType,thumbnailLink)&pageSize=100`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.files) {
          setMediaItems(data.files);
        }
        setLoading(false);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu từ Drive:", error);
        setLoading(false);
      }
    };

    fetchDriveData();
  }, []);

  // Hàm chuyển đổi ID file thành link xem trực tiếp
  const getImageUrl = (id) => `https://drive.google.com/uc?export=view&id=${id}`;
  const getVideoUrl = (id) => `https://drive.google.com/file/d/${id}/preview`;

  if (loading) {
    return (
      <div className="w-full flex justify-center p-12">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full mt-8 animate-fade-in">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <span>✨</span> Gizmo Gallery (Sync from Drive)
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mediaItems.map((item) => {
          const isVideo = item.mimeType.includes('video');
          const isImage = item.mimeType.includes('image');

          return (
            <div key={item.id} className="glass-panel p-3 rounded-3xl group hover:-translate-y-2 transition-all duration-300">
              <div className="relative w-full pt-[75%] rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800">
                
                {/* NẾU LÀ ẢNH */}
                {isImage && (
                  <img 
                    src={getImageUrl(item.id)} 
                    alt={item.name}
                    className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                )}

                {/* NẾU LÀ VIDEO */}
                {isVideo && (
                  <iframe
                    className="absolute top-0 left-0 w-full h-full object-cover"
                    src={getVideoUrl(item.id)}
                    title={item.name}
                    frameBorder="0"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                )}

                {/* Tên file hiện lên khi hover chuột */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-sm font-medium truncate">{item.name}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default GizmoGallery;