import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Globe, MessageSquare, Plus, ArrowLeft, Info, Paperclip, Send, Edit2, Trash2, Users, FileText, Image as ImageIcon, Film, X } from 'lucide-react';

function GizmoChatV2({ session, isDark }) {
  const user = session.user;
  
  // ==========================================
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxlJ3Qp36h6oDwYJ3aR45K5AqB9SQuqUrO2ElN_b3LdWVwItF3Lb5xiLSIe6DcnY3CCOQ/exec'; 
  // ==========================================

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatRooms, setChatRooms] = useState([]); 
  const [activeRoom, setActiveRoom] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [showListOnMobile, setShowListOnMobile] = useState(true);
  
  const [showInfo, setShowInfo] = useState(false);
  const [members, setMembers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]); 

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const broadcastChannelRef = useRef(null);

  const notificationSound = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));
  const playSound = () => {
    notificationSound.current.currentTime = 0; 
    notificationSound.current.play().catch(err => console.log("Trình duyệt chặn tự động phát âm thanh:", err));
  };

  const fetchRooms = async () => {
    const { data } = await supabase.from('participants').select('room_id, rooms(id, name, is_group)').eq('user_id', user.id);
    if (data) {
      const formattedRooms = data.map(p => p.rooms).filter(r => r != null);
      setChatRooms(formattedRooms);
    }
  };

  const fetchMembers = async (roomId) => {
    if (!roomId) return setMembers([]);
    const { data } = await supabase.from('participants').select('profiles(email, full_name)').eq('room_id', roomId);
    if (data) setMembers(data.map(d => d.profiles));
  };

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

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    fetchMessages(activeRoom ? activeRoom.id : null);
    fetchMembers(activeRoom ? activeRoom.id : null);
    setShowInfo(false); 

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
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setTypingUsers([]), 3000);
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

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { email: user.email } });
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
    else { fetchMembers(activeRoom.id); }
  };

  const renameRoom = async () => {
    const newName = prompt("Nhập tên mới cho phòng:", activeRoom.name);
    if (newName && newName.trim() !== "") {
      const { error } = await supabase.from('rooms').update({ name: newName }).eq('id', activeRoom.id);
      if (!error) { setActiveRoom({ ...activeRoom, name: newName }); fetchRooms(); }
    }
  };

  const deleteRoom = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn phòng này?")) return;
    const { error } = await supabase.from('rooms').delete().eq('id', activeRoom.id);
    if (!error) { setActiveRoom(null); setShowInfo(false); fetchRooms(); }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const msgData = { room_id: activeRoom ? activeRoom.id : null, sender_id: user.id, sender_email: user.email, content: newMessage };
    setNewMessage('');
    await supabase.from('messages').insert([msgData]);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (activeRoom === null && !window.confirm("Global Chat: File này sẽ công khai. Tiếp tục?")) {
      fileInputRef.current.value = ''; return;
    }
    setIsUploadingFile(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result.split(',')[1];
      try {
        const response = await fetch(SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ userEmail: user.email, fileName: file.name, mimeType: file.type, fileData: base64Data })
        });
        const result = await response.json();
        if (result.status === 'success') {
          const fileUrl = `https://drive.google.com/file/d/${result.fileId}/view`;
          await supabase.from('messages').insert([{
            room_id: activeRoom ? activeRoom.id : null, sender_id: user.id, sender_email: user.email,
            content: 'Đã gửi một tệp đính kèm', file_url: fileUrl, file_name: file.name, file_type: file.type
          }]);
        } else alert('Lỗi lưu file: ' + result.message);
      } catch (error) { alert('Lỗi kết nối máy chủ!'); } 
      finally { setIsUploadingFile(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
    };
    reader.readAsDataURL(file);
  };

  const formatChatTime = (timeStr) => {
    const date = new Date(timeStr);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const roomFiles = messages.filter(m => m.file_url != null);
  const getFileIcon = (type) => {
    if (type?.includes('image')) return <ImageIcon size={16} />;
    if (type?.includes('video')) return <Film size={16} />;
    return <FileText size={16} />;
  };

  // --- CLASSES THÔNG DỤNG THEO THEME ---
  const panelBg = isDark ? 'bg-[#1E293B]/50 border-white/5' : 'bg-slate-50 border-slate-200';
  const itemHoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100';
  const textMuted = isDark ? 'text-gray-400' : 'text-slate-500';

  return (
    <div className="flex h-full w-full relative overflow-hidden">
      
      {/* ⬅️ CỘT TRÁI: INBOX */}
      <div className={`${showListOnMobile ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-1/3 md:max-w-[320px] h-full flex-shrink-0 border-r ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
        <div className="p-4 flex justify-between items-center border-b border-transparent">
          <h2 className="text-xl font-bold tracking-tight">Trò chuyện</h2>
          <button onClick={createNewRoom} className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors shadow-sm">
            <Plus size={18} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-2 space-y-1">
          <button onClick={() => { setActiveRoom(null); setShowListOnMobile(false); }} className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${activeRoom === null ? 'bg-blue-600 text-white' : itemHoverBg}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${activeRoom === null ? 'bg-white/20' : 'bg-gradient-to-br from-teal-400 to-blue-500 text-white'}`}>
              <Globe size={20} />
            </div>
            <div className="truncate text-left">
              <p className="font-semibold text-sm">Global Chat</p>
              <p className={`text-[11px] ${activeRoom === null ? 'text-blue-100' : textMuted}`}>Phòng chung cộng đồng</p>
            </div>
          </button>
          
          <div className={`mx-2 my-2 border-t ${isDark ? 'border-white/5' : 'border-slate-200'}`}></div>
          
          {chatRooms.length === 0 ? (
            <p className={`text-xs text-center py-6 ${textMuted}`}>Chưa có nhóm nào</p>
          ) : (
            chatRooms.map((room) => (
              <button key={room.id} onClick={() => { setActiveRoom(room); setShowListOnMobile(false); }} className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${activeRoom?.id === room.id ? 'bg-blue-600 text-white' : itemHoverBg}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${activeRoom?.id === room.id ? 'bg-white/20 text-white' : 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white'}`}>
                  {room.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="truncate text-left">
                  <p className="font-semibold text-sm truncate">{room.name}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ➡️ CỘT PHẢI: KHUNG CHAT & INFO PANEL */}
      <div className={`${!showListOnMobile ? 'flex' : 'hidden'} md:flex flex-col flex-grow h-full relative bg-inherit`}>
        
        {/* HEADER CHAT */}
        <div className={`px-4 py-3 border-b flex justify-between items-center flex-shrink-0 ${isDark ? 'border-white/5 bg-[#111827]/80' : 'border-slate-200 bg-white/80'} backdrop-blur-md z-10`}>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowListOnMobile(true)} className={`md:hidden p-1 rounded-md ${itemHoverBg}`}>
              <ArrowLeft size={20} className={textMuted} />
            </button>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${activeRoom === null ? 'bg-gradient-to-br from-teal-400 to-blue-500' : 'bg-gradient-to-br from-indigo-500 to-purple-500'}`}>
                {activeRoom === null ? <Globe size={20} /> : activeRoom.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-sm font-bold">{activeRoom === null ? 'Global Chat' : activeRoom.name}</h2>
                <p className={`text-[11px] ${textMuted}`}>{activeRoom === null ? 'Công khai' : `${members.length} thành viên`}</p>
              </div>
            </div>
          </div>
          
          {activeRoom !== null && (
            <button onClick={() => setShowInfo(!showInfo)} className={`p-2 rounded-lg transition-all ${showInfo ? 'bg-blue-100 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400' : itemHoverBg}`}>
              <Info size={20} className={showInfo ? '' : textMuted} />
            </button>
          )}
        </div>

        {/* CONTAINER CHỨA NỘI DUNG VÀ SIDEBAR THÔNG TIN */}
        <div className="flex-grow flex overflow-hidden relative">
          
          {/* KHUNG TIN NHẮN */}
          <div className="flex-grow flex flex-col relative">
            <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-4">
              {loading ? (
                <div className="flex-grow flex justify-center items-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
              ) : messages.length === 0 ? (
                <div className={`flex-grow flex justify-center items-center text-sm ${textMuted}`}>Bắt đầu trò chuyện!</div>
              ) : (
                messages.map((msg, index) => {
                  const isMe = msg.sender_id === user.id;
                  const showAvatar = index === 0 || messages[index - 1].sender_id !== msg.sender_id;

                  return (
                    <div key={msg.id} className={`flex w-full gap-2 ${isMe ? 'justify-end' : 'justify-start'} ${!showAvatar ? 'mt-[-8px]' : ''}`}>
                      {!isMe && showAvatar ? (
                        <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-200 mt-auto mb-1 flex-shrink-0">
                          {msg.sender_email[0].toUpperCase()}
                        </div>
                      ) : (!isMe && <div className="w-8 flex-shrink-0"></div>)}

                      <div className={`max-w-[75%] md:max-w-[60%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {!isMe && showAvatar && <span className={`text-[10px] mb-1 ml-1 font-medium ${textMuted}`}>{msg.sender_email}</span>}
                        
                        <div className={`px-4 py-2.5 shadow-sm break-words text-sm relative group
                          ${isMe 
                            ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm' 
                            : `rounded-2xl rounded-bl-sm ${isDark ? 'bg-[#1E293B] text-gray-100' : 'bg-slate-100 text-slate-900'}`}`}
                        >
                          {msg.content !== 'Đã gửi một tệp đính kèm' && <span>{msg.content}</span>}
                          
                          {msg.file_url && (
                            <a href={msg.file_url} target="_blank" rel="noreferrer" className={`mt-1 flex items-center gap-3 p-2.5 rounded-xl transition-all no-underline ${isMe ? 'bg-blue-700/50 hover:bg-blue-700 text-white' : isDark ? 'bg-black/20 hover:bg-black/40 text-gray-200' : 'bg-white hover:bg-slate-50 text-slate-800'}`}>
                              <div className={`${isMe ? 'text-blue-200' : 'text-blue-500'}`}>{getFileIcon(msg.file_type)}</div>
                              <div className="flex flex-col">
                                <span className="truncate max-w-[140px] text-xs font-semibold leading-tight">{msg.file_name}</span>
                                <span className={`text-[9px] uppercase mt-0.5 ${isMe ? 'text-blue-200/70' : textMuted}`}>Click để mở</span>
                              </div>
                            </a>
                          )}
                        </div>
                        <span className={`text-[9px] mt-1 mx-1 ${textMuted}`}>{formatChatTime(msg.created_at)}</span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Hiệu ứng Đang nhập... */}
            {typingUsers.length > 0 && (
              <div className={`absolute bottom-2 left-4 text-[11px] font-medium italic animate-pulse ${textMuted}`}>
                {typingUsers[0]} đang nhập...
              </div>
            )}
          </div>

          {/* BẢNG THÔNG TIN PHÒNG */}
          {showInfo && activeRoom !== null && (
            <div className={`w-72 flex flex-col border-l flex-shrink-0 animate-slide-in absolute md:relative right-0 h-full z-20 ${panelBg} backdrop-blur-xl md:backdrop-blur-none`}>
              <div className={`p-4 border-b ${isDark ? 'border-white/5' : 'border-slate-200'} flex justify-between items-center`}>
                <h3 className="font-bold text-sm">Chi tiết phòng</h3>
                <button onClick={() => setShowInfo(false)} className={`md:hidden p-1 rounded-md ${itemHoverBg}`}><X size={16} /></button>
              </div>
              
              <div className="flex-grow overflow-y-auto p-4">
                <div className="space-y-1 mb-6">
                  <button onClick={addMemberToRoom} className={`w-full p-2.5 rounded-xl transition-all text-sm font-medium flex items-center gap-3 ${isDark ? 'hover:bg-white/5 text-blue-400' : 'hover:bg-blue-50 text-blue-600'}`}>
                    <Plus size={16} /> Thêm thành viên
                  </button>
                  <button onClick={renameRoom} className={`w-full p-2.5 rounded-xl transition-all text-sm font-medium flex items-center gap-3 ${itemHoverBg}`}>
                    <Edit2 size={16} className={textMuted} /> Đổi tên phòng
                  </button>
                  <button onClick={deleteRoom} className="w-full p-2.5 rounded-xl transition-all text-sm font-medium flex items-center gap-3 hover:bg-red-50 text-red-600 dark:hover:bg-red-500/10 dark:text-red-500">
                    <Trash2 size={16} /> Xóa phòng
                  </button>
                </div>

                <div className="mb-6">
                  <h4 className={`text-[10px] uppercase font-bold mb-2 tracking-widest flex items-center gap-2 ${textMuted}`}><Users size={12}/> Thành viên ({members.length})</h4>
                  <div className="space-y-1">
                    {members.map((m, idx) => (
                      <div key={idx} className={`flex items-center gap-3 p-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-white border border-slate-100'}`}>
                        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold">{m.email?.[0]?.toUpperCase()}</div>
                        <span className="text-xs font-medium truncate">{m.full_name || m.email}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className={`text-[10px] uppercase font-bold mb-2 tracking-widest flex items-center gap-2 ${textMuted}`}><FileText size={12}/> File đã gửi ({roomFiles.length})</h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    {roomFiles.length === 0 ? (
                      <p className={`text-[11px] italic ${textMuted}`}>Chưa có file nào</p>
                    ) : (
                      roomFiles.map(f => (
                        <a href={f.file_url} target="_blank" rel="noreferrer" key={f.id} className={`flex items-center gap-2 p-2.5 transition-all rounded-lg no-underline ${isDark ? 'bg-white/5 hover:bg-white/10 text-gray-200' : 'bg-white hover:bg-slate-50 border border-slate-100 text-slate-700'}`}>
                          <div className={textMuted}>{getFileIcon(f.file_type)}</div>
                          <span className="text-[11px] font-medium truncate">{f.file_name}</span>
                        </a>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* INPUT FORM */}
        <div className={`p-3 border-t flex-shrink-0 ${isDark ? 'border-white/5 bg-[#111827]' : 'border-slate-200 bg-white'}`}>
          <form onSubmit={handleSendMessage} className={`flex items-center gap-2 p-1.5 rounded-full border ${isDark ? 'bg-[#1E293B] border-white/5' : 'bg-slate-100 border-transparent focus-within:border-slate-300 focus-within:bg-white'} transition-all`}>
            
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current.click()} disabled={isUploadingFile} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isUploadingFile ? 'opacity-50' : itemHoverBg}`}>
              {isUploadingFile 
                ? <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div> 
                : <Paperclip size={18} className={textMuted} />
              }
            </button>
            
            <input 
              type="text" 
              value={newMessage}
              onChange={handleTyping}
              placeholder={isUploadingFile ? "Đang đẩy file..." : "Nhập tin nhắn..."}
              disabled={isUploadingFile}
              className="flex-grow bg-transparent border-none outline-none px-2 text-sm disabled:opacity-50"
            />
            
            <button type="submit" disabled={!newMessage.trim() || isUploadingFile} className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center transition-all disabled:opacity-50 disabled:bg-slate-300 dark:disabled:bg-slate-700 hover:bg-blue-700">
              <Send size={16} className="ml-0.5" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default GizmoChatV2;