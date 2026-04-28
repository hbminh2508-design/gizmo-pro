import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

function GizmoChat({ session }) {
  const user = session.user;
  
  // ==========================================
  // ⚠️ DÁN LINK WEB APP CỦA GOOGLE APPS SCRIPT VÀO ĐÂY:
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxlJ3Qp36h6oDwYJ3aR45K5AqB9SQuqUrO2ElN_b3LdWVwItF3Lb5xiLSIe6DcnY3CCOQ/exec'; 
  // ==========================================

  // States quản lý dữ liệu
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatRooms, setChatRooms] = useState([]); 
  const [activeRoom, setActiveRoom] = useState(null); 
  const [loading, setLoading] = useState(true);
  
  // States tải file
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef(null);
  
  // State quản lý giao diện Mobile
  const [showListOnMobile, setShowListOnMobile] = useState(true);
  const messagesEndRef = useRef(null);

  // 🎵 KHỞI TẠO ÂM THANH THÔNG BÁO (Ting/Pop)
  const notificationSound = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));

  const playSound = () => {
    // Tua lại từ đầu để phát mượt mà nếu có nhiều tin nhắn đến liên tục
    notificationSound.current.currentTime = 0; 
    notificationSound.current.play().catch(err => console.log("Trình duyệt chặn tự động phát âm thanh:", err));
  };

  // 1. LẤY DANH SÁCH PHÒNG CHAT
  const fetchRooms = async () => {
    const { data } = await supabase
      .from('participants')
      .select('room_id, rooms(id, name, is_group)')
      .eq('user_id', user.id);
    
    if (data) {
      const formattedRooms = data.map(p => p.rooms).filter(r => r != null);
      setChatRooms(formattedRooms);
    }
  };

  // 2. LẤY TIN NHẮN TỪ PHÒNG ĐANG CHỌN
  const fetchMessages = async (roomId) => {
    setLoading(true);
    let query = supabase.from('messages').select('*').order('created_at', { ascending: true });
    
    if (roomId === null) {
      query = query.is('room_id', null); 
    } else {
      query = query.eq('room_id', roomId); 
    }

    const { data } = await query;
    if (data) setMessages(data);
    setLoading(false);
    scrollToBottom();
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    fetchMessages(activeRoom ? activeRoom.id : null);

    const channel = supabase
      .channel('chat_updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
         const newMsg = payload.new;
         const isGlobal = newMsg.room_id === null && activeRoom === null;
         const isCurrentRoom = activeRoom && newMsg.room_id === activeRoom.id;
         
         if (isGlobal || isCurrentRoom) {
           setMessages((prev) => [...prev, newMsg]);
           
           // 🔥 NẾU TIN NHẮN MỚI KHÔNG PHẢI DO MÌNH GỬI -> PHÁT ÂM THANH
           if (newMsg.sender_id !== user.id) {
             playSound();
           }
         }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [activeRoom, user.id]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => scrollToBottom(), [messages]);

  // 3. HÀM TẠO PHÒNG & THÊM NGƯỜI
  const createNewRoom = async () => {
    const roomName = prompt("Nhập tên Phòng chat / Nhóm mới:");
    if (!roomName) return;
    const { data: newRoom, error: roomErr } = await supabase.from('rooms').insert([{ name: roomName, is_group: true }]).select().single();
    if (roomErr) return alert("Lỗi tạo phòng");
    await supabase.from('participants').insert([{ room_id: newRoom.id, user_id: user.id }]);
    alert("Đã tạo phòng!");
    fetchRooms();
  };

  const addMemberToRoom = async () => {
    if (!activeRoom) return alert("Bạn không thể thêm người vào Global Chat!");
    const email = prompt("Nhập Email của người bạn muốn thêm vào nhóm này:");
    if (!email) return;
    const { data: profile } = await supabase.from('profiles').select('id').eq('email', email).single();
    if (!profile) return alert("Không tìm thấy người dùng này trên hệ thống!");
    const { error } = await supabase.from('participants').insert([{ room_id: activeRoom.id, user_id: profile.id }]);
    if (error) alert("Người này đã có trong phòng hoặc có lỗi xảy ra!");
    else alert(`Đã thêm ${email} vào phòng!`);
  };

  // 4. GỬI TIN NHẮN VĂN BẢN
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msgData = {
      room_id: activeRoom ? activeRoom.id : null,
      sender_id: user.id,
      sender_email: user.email,
      content: newMessage
    };

    setNewMessage('');
    await supabase.from('messages').insert([msgData]);
  };

  // 5. GỬI FILE QUA GOOGLE DRIVE VÀ NHÚNG VÀO CHAT
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (activeRoom === null) {
      if (!window.confirm("Bạn đang ở Global Chat. File này sẽ công khai cho tất cả mọi người. Tiếp tục?")) {
        fileInputRef.current.value = '';
        return;
      }
    }

    setIsUploadingFile(true);
    const reader = new FileReader();

    reader.onloadend = async () => {
      const base64Data = reader.result.split(',')[1];

      try {
        const response = await fetch(SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            userEmail: user.email,
            fileName: file.name,
            mimeType: file.type,
            fileData: base64Data
          })
        });

        const result = await response.json();
        
        if (result.status === 'success') {
          const fileUrl = `https://drive.google.com/file/d/${result.fileId}/view`;
          
          await supabase.from('messages').insert([{
            room_id: activeRoom ? activeRoom.id : null,
            sender_id: user.id,
            sender_email: user.email,
            content: 'Đã gửi một tệp đính kèm',
            file_url: fileUrl,
            file_name: file.name,
            file_type: file.type
          }]);
        } else {
          alert('Lỗi khi lưu file lên Drive: ' + result.message);
        }
      } catch (error) {
        alert('Lỗi kết nối máy chủ!');
      } finally {
        setIsUploadingFile(false);
        if (fileInputRef.current) fileInputRef.current.value = ''; 
      }
    };
    
    reader.readAsDataURL(file);
  };

  const formatChatTime = (timeStr) => {
    const date = new Date(timeStr);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-full w-full gap-4 animate-fade-in relative overflow-hidden">
      
      {/* ⬅️ CỘT TRÁI: INBOX */}
      <div className={`${showListOnMobile ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-1/3 glass-panel rounded-3xl border border-white/20 p-4 h-full flex-shrink-0 shadow-lg`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-blue-500">Inbox</h2>
          <button onClick={createNewRoom} className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center hover:scale-110 transition-transform">+</button>
        </div>

        <div className="flex-grow overflow-y-auto space-y-2 pr-2">
          <button onClick={() => { setActiveRoom(null); setShowListOnMobile(false); }} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all text-left ${activeRoom === null ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-white/10 opacity-70 hover:opacity-100'}`}>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-xl flex-shrink-0 shadow-inner">🌍</div>
            <div className="truncate">
              <p className="font-bold truncate">Global Chat</p>
              <p className="text-xs opacity-60">Phòng chung hệ thống</p>
            </div>
          </button>
          <div className="w-full border-t border-white/10 my-4"></div>
          {chatRooms.length === 0 ? (
            <p className="text-xs text-center opacity-40 italic py-4">Bấm dấu + để tạo phòng chat mới</p>
          ) : (
            chatRooms.map((room) => (
              <button key={room.id} onClick={() => { setActiveRoom(room); setShowListOnMobile(false); }} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all text-left ${activeRoom?.id === room.id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-white/10 opacity-70 hover:opacity-100'}`}>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-inner">{room.name.substring(0, 2).toUpperCase()}</div>
                <div className="truncate">
                  <p className="font-bold truncate">{room.name}</p>
                  <p className="text-xs opacity-60">Nhóm chat riêng</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ➡️ CỘT PHẢI: KHUNG CHAT */}
      <div className={`${!showListOnMobile ? 'flex' : 'hidden'} md:flex flex-col flex-grow h-full relative`}>
        <div className="glass-panel p-4 rounded-3xl mb-4 border border-white/20 flex justify-between items-center flex-shrink-0 shadow-lg">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowListOnMobile(true)} className="md:hidden text-2xl opacity-60 hover:opacity-100">←</button>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">{activeRoom === null ? '🌍 Global Chat' : `💬 ${activeRoom.name}`}</h2>
              <p className="text-xs opacity-60">{activeRoom === null ? 'Tất cả mọi người đều có thể thấy tin nhắn' : 'Đoạn chat được mã hóa bảo mật'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {activeRoom !== null && (
              <button onClick={addMemberToRoom} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-lg transition-all">+ Thêm User</button>
            )}
          </div>
        </div>

        <div className="flex-grow glass-panel rounded-3xl border border-white/20 p-4 mb-4 overflow-y-auto flex flex-col gap-4 shadow-inner">
          {loading ? (
            <div className="flex-grow flex justify-center items-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
          ) : messages.length === 0 ? (
            <div className="flex-grow flex justify-center items-center opacity-50 italic text-sm">Chưa có tin nhắn nào. Hãy bắt đầu trò chuyện!</div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === user.id;
              
              return (
                <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] md:max-w-[65%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && <span className="text-[10px] opacity-50 mb-1 ml-2 font-bold">{msg.sender_email}</span>}
                    
                    <div className={`p-4 rounded-[1.5rem] shadow-md break-words text-sm
                      ${isMe ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-br-sm' : 'glass-panel border border-white/10 rounded-bl-sm dark:bg-white/10 bg-white/70 text-gray-800 dark:text-white'}`}
                    >
                      {msg.content !== 'Đã gửi một tệp đính kèm' && <span>{msg.content}</span>}
                      
                      {msg.file_url && (
                        <a href={msg.file_url} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-3 p-3 rounded-xl bg-black/20 hover:bg-black/30 transition-all text-white no-underline border border-white/10 shadow-inner">
                          <span className="text-2xl">{msg.file_type?.includes('image') ? '🖼️' : msg.file_type?.includes('video') ? '🎬' : '📄'}</span>
                          <div className="flex flex-col">
                            <span className="truncate max-w-[150px] md:max-w-[200px] text-xs font-bold leading-tight">{msg.file_name}</span>
                            <span className="text-[9px] opacity-60 uppercase mt-0.5">Click để xem / tải về</span>
                          </div>
                        </a>
                      )}
                    </div>
                    
                    <span className="text-[9px] opacity-40 mt-1 mx-2 font-mono">{formatChatTime(msg.created_at)}</span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="glass-panel p-2 rounded-3xl border border-white/20 flex gap-2 flex-shrink-0 shadow-lg bg-black/20 relative">
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
          <button 
            type="button" 
            onClick={() => fileInputRef.current.click()} 
            disabled={isUploadingFile}
            className="w-12 h-12 flex-shrink-0 rounded-2xl hover:bg-white/10 flex items-center justify-center text-xl transition-all opacity-70 hover:opacity-100 disabled:opacity-30"
          >
            {isUploadingFile ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : '📎'}
          </button>
          
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isUploadingFile ? "Đang đẩy file lên Google Drive..." : "Nhập tin nhắn..."}
            disabled={isUploadingFile}
            className="flex-grow bg-transparent border-none outline-none px-4 text-sm disabled:opacity-50"
          />
          
          <button 
            type="submit" 
            disabled={!newMessage.trim() || isUploadingFile}
            className="px-6 md:px-8 h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl hover:shadow-blue-500/30"
          >
            Gửi <span className="hidden md:inline">🚀</span>
          </button>
        </form>

      </div>
    </div>
  );
}

export default GizmoChat;