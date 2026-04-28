import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

function GizmoChatV2({ session }) {
  const user = session.user;
  
  // ==========================================
  // ⚠️ LINK SCRIPT CỦA BẠN:
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxlJ3Qp36h6oDwYJ3aR45K5AqB9SQuqUrO2ElN_b3LdWVwItF3Lb5xiLSIe6DcnY3CCOQ/exec'; 
  // ==========================================

  // --- STATES CƠ BẢN ---
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatRooms, setChatRooms] = useState([]); 
  const [activeRoom, setActiveRoom] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [showListOnMobile, setShowListOnMobile] = useState(true);
  
  // --- STATES TÍNH NĂNG MỚI (V2) ---
  const [showInfo, setShowInfo] = useState(false);
  const [members, setMembers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]); // Danh sách những người đang gõ

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const broadcastChannelRef = useRef(null);

  // 🎵 KHỞI TẠO ÂM THANH THÔNG BÁO
  const notificationSound = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));
  const playSound = () => {
    notificationSound.current.currentTime = 0; 
    notificationSound.current.play().catch(err => console.log("Trình duyệt chặn âm thanh:", err));
  };

  // 1. LẤY DANH SÁCH PHÒNG
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

  // 2. LẤY THÀNH VIÊN TRONG PHÒNG
  const fetchMembers = async (roomId) => {
    if (!roomId) return setMembers([]);
    const { data } = await supabase
      .from('participants')
      .select('profiles(email, full_name)')
      .eq('room_id', roomId);
    if (data) setMembers(data.map(d => d.profiles));
  };

  // 3. LẤY TIN NHẮN
  const fetchMessages = async (roomId) => {
    setLoading(true);
    let query = supabase.from('messages').select('*').order('created_at', { ascending: true });
    if (roomId === null) query = query.is('room_id', null); 
    else query = query.eq('room_id', roomId); 

    const { data } = await query;
    if (data) setMessages(data);
    setLoading(false);
    scrollToBottom();
  };

  // --- LIFECYCLE HOOKS ---
  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    fetchMessages(activeRoom ? activeRoom.id : null);
    fetchMembers(activeRoom ? activeRoom.id : null);
    setShowInfo(false); // Đóng bảng info khi chuyển phòng

    // Lắng nghe tin nhắn mới
    const messageChannel = supabase
      .channel('chat_updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
         const newMsg = payload.new;
         const isGlobal = newMsg.room_id === null && activeRoom === null;
         const isCurrentRoom = activeRoom && newMsg.room_id === activeRoom.id;
         
         if (isGlobal || isCurrentRoom) {
           setMessages((prev) => [...prev, newMsg]);
           if (newMsg.sender_id !== user.id) playSound();
         }
      })
      .subscribe();

    // Lắng nghe hiệu ứng "Đang nhập..."
    const roomKey = activeRoom ? activeRoom.id : 'global';
    const typingChannel = supabase.channel(`typing_${roomKey}`);
    broadcastChannelRef.current = typingChannel;

    typingChannel
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.email !== user.email) {
          setTypingUsers(prev => {
            if (!prev.includes(payload.payload.email)) return [...prev, payload.payload.email];
            return prev;
          });
          
          // Xóa chữ "đang nhập" sau 3 giây nếu không nhận được tín hiệu gõ tiếp
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setTypingUsers([]);
          }, 3000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(typingChannel);
      clearTimeout(typingTimeoutRef.current);
    };
  }, [activeRoom, user.id, user.email]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => scrollToBottom(), [messages]);

  // --- HÀM TƯƠNG TÁC GIAO DIỆN MỚI ---
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { email: user.email }
      });
    }
  };

  const createNewRoom = async () => {
    const roomName = prompt("Nhập tên Phòng chat / Nhóm mới:");
    if (!roomName) return;
    const { data: newRoom, error: roomErr } = await supabase.from('rooms').insert([{ name: roomName, is_group: true }]).select().single();
    if (roomErr) return alert("Lỗi tạo phòng");
    await supabase.from('participants').insert([{ room_id: newRoom.id, user_id: user.id }]);
    fetchRooms();
  };

  const addMemberToRoom = async () => {
    if (!activeRoom) return alert("Không thể thêm người vào Global Chat!");
    const email = prompt("Nhập Email của người cần thêm:");
    if (!email) return;
    const { data: profile } = await supabase.from('profiles').select('id').eq('email', email).single();
    if (!profile) return alert("Không tìm thấy người dùng này!");
    const { error } = await supabase.from('participants').insert([{ room_id: activeRoom.id, user_id: profile.id }]);
    if (error) alert("Người này đã có trong phòng hoặc có lỗi xảy ra!");
    else {
      alert(`Đã thêm ${email} vào phòng!`);
      fetchMembers(activeRoom.id);
    }
  };

  const renameRoom = async () => {
    const newName = prompt("Nhập tên mới cho phòng:", activeRoom.name);
    if (newName && newName.trim() !== "") {
      const { error } = await supabase.from('rooms').update({ name: newName }).eq('id', activeRoom.id);
      if (!error) {
        setActiveRoom({ ...activeRoom, name: newName });
        fetchRooms();
      } else {
        alert("Lỗi khi đổi tên phòng!");
      }
    }
  };

  const deleteRoom = async () => {
    if (!window.confirm("CẢNH BÁO: Bạn có chắc chắn muốn xóa vĩnh viễn phòng này cùng toàn bộ tin nhắn bên trong?")) return;
    const { error } = await supabase.from('rooms').delete().eq('id', activeRoom.id);
    if (!error) {
      setActiveRoom(null);
      setShowInfo(false);
      fetchRooms();
    } else {
      alert("Lỗi khi xóa phòng. Bạn có thể không có quyền xóa!");
    }
  };

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

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (activeRoom === null) {
      if (!window.confirm("Global Chat: File này sẽ công khai. Tiếp tục?")) {
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
          alert('Lỗi lưu file: ' + result.message);
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

  // Lọc ra các tin nhắn có chứa file để hiển thị trong mục "Kho Lưu Trữ"
  const roomFiles = messages.filter(m => m.file_url != null);

  return (
    <div className="flex h-full w-full gap-4 animate-fade-in relative overflow-hidden">
      
      {/* ⬅️ CỘT TRÁI: INBOX */}
      <div className={`${showListOnMobile ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-1/3 md:max-w-[300px] glass-panel rounded-3xl border border-white/20 p-4 h-full flex-shrink-0 shadow-lg`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-blue-500">Inbox</h2>
          <button onClick={createNewRoom} className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold hover:scale-110 transition-transform">+</button>
        </div>

        <div className="flex-grow overflow-y-auto space-y-2 pr-1">
          <button onClick={() => { setActiveRoom(null); setShowListOnMobile(false); }} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all text-left ${activeRoom === null ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-white/10 opacity-70 hover:opacity-100'}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-lg flex-shrink-0 shadow-inner">🌍</div>
            <div className="truncate">
              <p className="font-bold truncate text-sm">Global Chat</p>
            </div>
          </button>
          
          <div className="w-full border-t border-white/10 my-4"></div>
          
          {chatRooms.length === 0 ? (
            <p className="text-xs text-center opacity-40 italic py-4">Chưa có nhóm nào</p>
          ) : (
            chatRooms.map((room) => (
              <button key={room.id} onClick={() => { setActiveRoom(room); setShowListOnMobile(false); }} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all text-left ${activeRoom?.id === room.id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-white/10 opacity-70 hover:opacity-100'}`}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-inner">{room.name.substring(0, 2).toUpperCase()}</div>
                <div className="truncate">
                  <p className="font-bold truncate text-sm">{room.name}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ➡️ CỘT PHẢI: KHUNG CHAT & INFO PANEL */}
      <div className={`${!showListOnMobile ? 'flex' : 'hidden'} md:flex flex-col flex-grow h-full relative`}>
        
        {/* HEADER CHAT */}
        <div className="glass-panel p-4 rounded-3xl mb-4 border border-white/20 flex justify-between items-center flex-shrink-0 shadow-lg">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowListOnMobile(true)} className="md:hidden text-2xl opacity-60 hover:opacity-100">←</button>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">{activeRoom === null ? '🌍 Global Chat' : `💬 ${activeRoom.name}`}</h2>
              <p className="text-[10px] md:text-xs opacity-60">{activeRoom === null ? 'Phòng chat công khai' : 'Phòng chat được mã hóa'}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {activeRoom !== null && (
              <button onClick={() => setShowInfo(!showInfo)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${showInfo ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/10 hover:bg-white/20'}`}>
                ℹ️
              </button>
            )}
          </div>
        </div>

        {/* CONTAINER CHỨA NỘI DUNG VÀ SIDEBAR THÔNG TIN */}
        <div className="flex-grow flex gap-4 overflow-hidden mb-4 relative">
          
          {/* KHUNG TIN NHẮN */}
          <div className="flex-grow glass-panel rounded-3xl border border-white/20 p-4 overflow-y-auto flex flex-col gap-4 shadow-inner relative">
            {loading ? (
              <div className="flex-grow flex justify-center items-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : messages.length === 0 ? (
              <div className="flex-grow flex justify-center items-center opacity-50 italic text-sm">Bắt đầu trò chuyện!</div>
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
            
            {/* Hiệu ứng Đang nhập... */}
            {typingUsers.length > 0 && (
              <div className="sticky bottom-0 left-0 bg-transparent text-[10px] italic opacity-60 animate-pulse pl-2">
                💬 {typingUsers[0]} đang nhập...
              </div>
            )}
          </div>

          {/* BẢNG THÔNG TIN PHÒNG (Nút ℹ️ Mở ra) */}
          {showInfo && activeRoom !== null && (
            <div className="w-64 glass-panel border border-white/20 rounded-3xl p-4 flex flex-col overflow-y-auto animate-slide-in shadow-xl absolute md:relative right-0 h-full z-20 bg-gray-900/90 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none">
              <h3 className="font-black text-lg mb-4 text-center border-b border-white/10 pb-4">Tùy Chọn</h3>
              
              <div className="space-y-2 mb-6">
                <button onClick={addMemberToRoom} className="w-full p-3 rounded-xl bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white transition-all text-xs font-bold flex items-center gap-2">
                  <span>+</span> Thêm Thành Viên
                </button>
                <button onClick={renameRoom} className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-xs font-bold flex items-center gap-2">
                  <span>✏️</span> Đổi Tên Phòng
                </button>
                <button onClick={deleteRoom} className="w-full p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-bold flex items-center gap-2">
                  <span>🗑️</span> Xóa Phòng Chat
                </button>
              </div>

              <div className="mb-6">
                <h4 className="text-[10px] uppercase font-bold opacity-40 mb-3 tracking-widest">Thành Viên ({members.length})</h4>
                <div className="space-y-2">
                  {members.map((m, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/5">
                      <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">{m.email?.[0]?.toUpperCase()}</div>
                      <span className="text-xs truncate opacity-80">{m.full_name || m.email}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[10px] uppercase font-bold opacity-40 mb-3 tracking-widest">Kho Lưu Trữ ({roomFiles.length})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {roomFiles.length === 0 ? (
                    <p className="text-[10px] opacity-40 italic">Chưa có file nào</p>
                  ) : (
                    roomFiles.map(f => (
                      <a href={f.file_url} target="_blank" rel="noreferrer" key={f.id} className="flex items-center gap-2 p-2 bg-white/5 hover:bg-white/10 transition-all rounded-lg border border-white/5 no-underline text-white">
                        <span className="text-sm">📄</span>
                        <span className="text-[10px] truncate">{f.file_name}</span>
                      </a>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* INPUT FORM */}
        <form onSubmit={handleSendMessage} className="glass-panel p-2 rounded-3xl border border-white/20 flex gap-2 flex-shrink-0 shadow-lg bg-black/20 relative">
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
          <button type="button" onClick={() => fileInputRef.current.click()} disabled={isUploadingFile} className="w-12 h-12 flex-shrink-0 rounded-2xl hover:bg-white/10 flex items-center justify-center text-xl transition-all opacity-70 hover:opacity-100 disabled:opacity-30">
            {isUploadingFile ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : '📎'}
          </button>
          
          <input 
            type="text" 
            value={newMessage}
            onChange={handleTyping} // Đổi thành handleTyping để kích hoạt hiệu ứng gõ
            placeholder={isUploadingFile ? "Đang đẩy file lên Google Drive..." : "Nhập tin nhắn..."}
            disabled={isUploadingFile}
            className="flex-grow bg-transparent border-none outline-none px-4 text-sm disabled:opacity-50"
          />
          
          <button type="submit" disabled={!newMessage.trim() || isUploadingFile} className="px-6 md:px-8 h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl hover:shadow-blue-500/30">
            Gửi <span className="hidden md:inline">🚀</span>
          </button>
        </form>

      </div>
    </div>
  );
}

export default GizmoChatV2;