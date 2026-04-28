import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

function GizmoChat({ session }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Ref dùng để tự động cuộn xuống tin nhắn mới nhất
  const messagesEndRef = useRef(null);
  const currentUserEmail = session?.user?.email;

  // 1. LẤY TIN NHẮN CŨ VÀ LẮNG NGHE TIN NHẮN MỚI TỪ SUPABASE
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (!error && data) setMessages(data);
      setLoading(false);
      scrollToBottom();
    };

    fetchMessages();

    // Thiết lập kênh Realtime để nhận tin nhắn mới ngay lập tức (như Zalo)
    const channel = supabase
      .channel('global_chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((currentMessages) => [...currentMessages, payload.new]);
      })
      .subscribe();

    // Dọn dẹp khi tắt component
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Tự động cuộn xuống đáy mỗi khi có tin nhắn mới
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 2. HÀM GỬI TIN NHẮN
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage;
    setNewMessage(''); // Xóa trắng ô input ngay lập tức cho mượt

    const { error } = await supabase
      .from('messages')
      .insert([{ user_email: currentUserEmail, content: messageText }]);

    if (error) {
      console.error("Lỗi gửi tin nhắn:", error);
      alert("Không thể gửi tin nhắn!");
    }
  };

  // Hàm hiển thị thời gian thân thiện (VD: 14:30)
  const formatChatTime = (timeStr) => {
    const date = new Date(timeStr);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full w-full animate-fade-in relative">
      
      {/* HEADER PHÒNG CHAT */}
      <div className="glass-panel p-4 rounded-3xl mb-4 border border-white/20 flex justify-between items-center flex-shrink-0">
        <div>
          <h2 className="text-xl font-black text-blue-500 flex items-center gap-2">
            <span>🌍</span> Global Chat
          </h2>
          <p className="text-xs opacity-60">Phòng chat chung cho tất cả thành viên Gizmo</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold px-3 py-1 bg-green-500/20 text-green-500 rounded-full border border-green-500/30 animate-pulse">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span> Online
        </div>
      </div>

      {/* KHU VỰC HIỂN THỊ TIN NHẮN */}
      <div className="flex-grow glass-panel rounded-3xl border border-white/20 p-4 mb-4 overflow-y-auto flex flex-col gap-4">
        {loading ? (
          <div className="flex-grow flex justify-center items-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-grow flex justify-center items-center opacity-50 italic text-sm">
            Chưa có tin nhắn nào. Hãy là người đầu tiên nói "Xin chào"!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user_email === currentUserEmail;
            
            return (
              <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] md:max-w-[60%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {/* Tên người gửi (chỉ hiện nếu là người khác) */}
                  {!isMe && (
                    <span className="text-[10px] opacity-50 mb-1 ml-2 font-bold">{msg.user_email}</span>
                  )}
                  
                  {/* Bong bóng chat */}
                  <div className={`p-4 rounded-3xl shadow-lg break-words text-sm
                    ${isMe 
                      ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-br-sm' 
                      : 'glass-panel border border-white/10 rounded-bl-sm dark:bg-white/10 bg-white/50 text-gray-800 dark:text-white'
                    }`}
                  >
                    {msg.content}
                  </div>
                  
                  {/* Thời gian */}
                  <span className="text-[10px] opacity-40 mt-1 mx-2">
                    {formatChatTime(msg.created_at)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} /> {/* Mỏ neo để cuộn xuống đáy */}
      </div>

      {/* KHUNG NHẬP TIN NHẮN */}
      <form onSubmit={handleSendMessage} className="glass-panel p-2 rounded-3xl border border-white/20 flex gap-2 flex-shrink-0">
        <button type="button" onClick={() => alert('Tính năng gửi file đang phát triển!')} className="w-12 h-12 flex-shrink-0 rounded-2xl hover:bg-white/10 flex items-center justify-center text-xl transition-all">
          📎
        </button>
        <input 
          type="text" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Nhập tin nhắn của bạn..."
          className="flex-grow bg-transparent border-none outline-none px-2 text-sm"
          autoFocus
        />
        <button 
          type="submit" 
          disabled={!newMessage.trim()}
          className="px-6 h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all disabled:opacity-50 disabled:hover:bg-blue-600 flex items-center justify-center gap-2 shadow-lg"
        >
          Gửi <span className="hidden md:inline">🚀</span>
        </button>
      </form>

    </div>
  );
}

export default GizmoChat;