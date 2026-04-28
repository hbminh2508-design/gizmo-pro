import React, { useState, useEffect } from 'react';

function GizmoGallery() {
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // ⚠️ THAY THẾ BẰNG KEY VÀ ID CỦA BẠN
  const API_KEY = 'AIzaSyDxyuPImrEe9RxLdsbVSSYAA3wHTrhpCWY';
  const FOLDER_ID = '1S-KzX2Z9lRfLFEMa3VAWpLgHjV-l1e9Z';

  useEffect(() => {
    const fetchDriveData = async () => {
      try {
        const url = `https://www.googleapis.com/drive/v3/files?q='${FOLDER_ID}'+in+parents+and+trashed=false&key=${API_KEY}&fields=files(id,name,mimeType,thumbnailLink)&pageSize=100`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.files) {
          // Lọc ra chỉ lấy ảnh
          const imagesOnly = data.files.filter(item => item.mimeType.includes('image'));
          setMediaItems(imagesOnly);
        }
        setLoading(false);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu từ Drive:", error);
        setLoading(false);
      }
    };

    fetchDriveData();
  }, []);

  return (
    <div className="w-full animate-fade-in">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <span>✨</span> Ảnh từ Google Drive
      </h2>
      
      {loading ? (
        <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {mediaItems.map((item) => {
            // Thay đổi tham số chất lượng ảnh từ thumbnail mặc định (s220) lên kích thước lớn (s1000)
            const imageUrl = item.thumbnailLink ? item.thumbnailLink.replace('=s220', '=s1000') : '';

            return (
              <div key={item.id} className="glass-panel p-2 rounded-3xl group hover:-translate-y-2 transition-all duration-300">
                <div className="relative w-full pt-[100%] rounded-[1.5rem] overflow-hidden bg-white/10">
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt={item.name}
                      className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-50">Lỗi ảnh</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default GizmoGallery;