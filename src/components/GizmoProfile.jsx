import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Camera, Edit3, GraduationCap, Heart, Share2, Users, 
  UserPlus, UserCheck, Search, Check, X, Mail, Globe, 
  Briefcase, Code, Link
} from 'lucide-react';

function GizmoProfile({ session, isDark }) {
  const user = session.user;
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxlJ3Qp36h6oDwYJ3aR45K5AqB9SQuqUrO2ElN_b3LdWVwItF3Lb5xiLSIe6DcnY3CCOQ/exec';

  const [profile, setProfile] = useState({
    full_name: '',
    avatar_url: '',
    cover_url: '',
    university: '',
    major: '',
    hobbies: '',
    social_links: { facebook: '', instagram: '', github: '' }
  });

  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('friends');

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
    fetchFriends();
    fetchPendingRequests();
  }, []);

  const fetchProfile = async () => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) setProfile(data);
    setLoading(false);
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUpdating(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result.split(',')[1];
      try {
        const response = await fetch(SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            userEmail: user.email,
            fileName: `${type}_${user.id}.jpg`,
            mimeType: file.type,
            fileData: base64Data
          })
        });
        const result = await response.json();
        if (result.status === 'success') {
          const url = `https://drive.google.com/uc?id=${result.fileId}`;
          const updateData = type === 'avatar' ? { avatar_url: url } : { cover_url: url };
          await supabase.from('profiles').update(updateData).eq('id', user.id);
          setProfile(prev => ({ ...prev, ...updateData }));
        }
      } catch (err) { alert("Lỗi tải ảnh!"); }
      setIsUpdating(false);
    };
    reader.readAsDataURL(file);
  };

  const updateInfo = async () => {
    setIsUpdating(true);
    const { error } = await supabase.from('profiles').update({
      full_name: profile.full_name,
      university: profile.university,
      major: profile.major,
      hobbies: profile.hobbies,
      social_links: profile.social_links,
      updated_at: new Date()
    }).eq('id', user.id);
    
    if (!error) alert("Cập nhật thành công!");
    setIsUpdating(false);
  };

  const fetchFriends = async () => {
    const { data } = await supabase.from('friends')
      .select('id, status, friend_id, profiles!friends_friend_id_fkey(*)')
      .eq('user_id', user.id).eq('status', 'accepted');
    if (data) setFriends(data);
  };

  const fetchPendingRequests = async () => {
    const { data } = await supabase.from('friends')
      .select('id, user_id, profiles!friends_user_id_fkey(*)')
      .eq('friend_id', user.id).eq('status', 'pending');
    if (data) setPendingRequests(data);
  };

  const sendRequest = async (id) => {
    await supabase.from('friends').insert([{ user_id: user.id, friend_id: id, status: 'pending' }]);
    alert("Đã gửi lời mời!");
    setSearchResult(null);
  };

  const acceptFriend = async (requestId, requesterId) => {
    await supabase.from('friends').update({ status: 'accepted' }).eq('id', requestId);
    await supabase.from('friends').insert([{ user_id: user.id, friend_id: requesterId, status: 'accepted' }]);
    fetchPendingRequests();
    fetchFriends();
  };

  const cardClass = isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200 shadow-sm';
  const inputClass = `w-full px-4 py-2.5 rounded-xl border outline-none text-sm transition-all ${isDark ? 'bg-black/20 border-white/10 focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white'}`;
  const labelClass = `text-[10px] font-bold uppercase tracking-widest ml-1 mb-1 block ${isDark ? 'text-gray-500' : 'text-slate-400'}`;

  if (loading) return <div className="p-20 text-center animate-pulse">Đang tải hồ sơ...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 pb-20 md:pb-6">
      <div className={`relative rounded-[2rem] overflow-hidden border ${cardClass}`}>
        <div className="h-48 md:h-64 bg-gradient-to-r from-blue-600 to-indigo-600 relative group">
          {profile.cover_url && <img src={profile.cover_url} className="w-full h-full object-cover" alt="Cover" />}
          <button onClick={() => coverInputRef.current.click()} className="absolute bottom-4 right-4 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all">
            <Camera size={20} />
          </button>
          <input type="file" ref={coverInputRef} className="hidden" onChange={(e) => handleImageUpload(e, 'cover')} />
        </div>
        
        <div className="px-6 pb-6 flex flex-col md:flex-row items-end md:items-center gap-4 -mt-12 md:-mt-16 relative z-10">
          <div className="relative group">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl border-4 border-white dark:border-[#111827] bg-slate-200 overflow-hidden shadow-xl">
              {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Avatar" /> : <div className="w-full h-full flex items-center justify-center text-3xl font-black text-slate-400">{user.email[0].toUpperCase()}</div>}
            </div>
            <button onClick={() => avatarInputRef.current.click()} className="absolute bottom-2 right-2 p-1.5 bg-blue-600 text-white rounded-lg shadow-lg">
              <Camera size={14} />
            </button>
            <input type="file" ref={avatarInputRef} className="hidden" onChange={(e) => handleImageUpload(e, 'avatar')} />
          </div>
          <div className="flex-grow pt-14 md:pt-16">
            <h1 className="text-2xl font-black">{profile.full_name || "Chưa đặt tên"}</h1>
            <p className="text-sm opacity-60 flex items-center gap-1"><Mail size={14} /> {user.email}</p>
          </div>
          <button onClick={updateInfo} disabled={isUpdating} className="mb-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all">
            {isUpdating ? "Đang lưu..." : "Lưu hồ sơ"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <section className={`p-6 rounded-[2rem] border ${cardClass} space-y-4`}>
            <h3 className="text-sm font-black flex items-center gap-2"><Edit3 size={18} className="text-blue-500"/> Thông tin cá nhân</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Họ và Tên</label>
                <input type="text" value={profile.full_name} onChange={e => setProfile({...profile, full_name: e.target.value})} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Trường Đại học</label>
                <div className="relative">
                  <GraduationCap size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
                  <input type="text" value={profile.university} onChange={e => setProfile({...profile, university: e.target.value})} className={`${inputClass} pl-10`} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Chuyên ngành</label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
                  <input type="text" value={profile.major} onChange={e => setProfile({...profile, major: e.target.value})} className={`${inputClass} pl-10`} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Sở thích</label>
                <div className="relative">
                  <Heart size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
                  <input type="text" value={profile.hobbies} onChange={e => setProfile({...profile, hobbies: e.target.value})} className={`${inputClass} pl-10`} placeholder="Bóng đá, Code, Phim..." />
                </div>
              </div>
            </div>
          </section>

          <section className={`p-6 rounded-[2rem] border ${cardClass} space-y-4`}>
            <h3 className="text-sm font-black flex items-center gap-2"><Share2 size={18} className="text-purple-500"/> Liên kết mạng xã hội</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" />
                <input type="text" placeholder="Facebook URL" value={profile.social_links?.facebook} onChange={e => setProfile({...profile, social_links: {...profile.social_links, facebook: e.target.value}})} className={`${inputClass} pl-10`} />
              </div>
              <div className="relative">
                <Camera size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-500" />
                <input type="text" placeholder="Instagram URL" value={profile.social_links?.instagram} onChange={e => setProfile({...profile, social_links: {...profile.social_links, instagram: e.target.value}})} className={`${inputClass} pl-10`} />
              </div>
              <div className="relative">
                <Code size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="text" placeholder="Github URL" value={profile.social_links?.github} onChange={e => setProfile({...profile, social_links: {...profile.social_links, github: e.target.value}})} className={`${inputClass} pl-10`} />
              </div>
            </div>
          </section>
        </div>

        <div className="md:col-span-1 space-y-6">
          <section className={`rounded-[2rem] border overflow-hidden flex flex-col h-full ${cardClass}`}>
            <div className="flex border-b border-inherit">
              <button onClick={() => setActiveSubTab('friends')} className={`flex-grow py-3 text-[10px] font-bold uppercase transition-all ${activeSubTab === 'friends' ? 'bg-blue-600 text-white' : 'hover:bg-white/5'}`}>Bạn bè</button>
              <button onClick={() => setActiveSubTab('requests')} className={`flex-grow py-3 text-[10px] font-bold uppercase transition-all relative ${activeSubTab === 'requests' ? 'bg-blue-600 text-white' : 'hover:bg-white/5'}`}>
                Lời mời {pendingRequests.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
              </button>
              <button onClick={() => setActiveSubTab('search')} className={`flex-grow py-3 text-[10px] font-bold uppercase transition-all ${activeSubTab === 'search' ? 'bg-blue-600 text-white' : 'hover:bg-white/5'}`}>Tìm bạn</button>
            </div>

            <div className="p-4 flex-grow overflow-y-auto max-h-[400px]">
              {activeSubTab === 'friends' && (
                <div className="space-y-3">
                  {friends.length === 0 ? <p className="text-center py-10 opacity-30 text-xs italic">Chưa có bạn bè</p> :
                    friends.map(f => (
                      <div key={f.id} className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5">
                        <img src={f.profiles.avatar_url || `https://ui-avatars.com/api/?name=${f.profiles.full_name}`} className="w-8 h-8 rounded-full" />
                        <div className="truncate"><p className="text-xs font-bold truncate">{f.profiles.full_name}</p></div>
                      </div>
                    ))
                  }
                </div>
              )}

              {activeSubTab === 'requests' && (
                <div className="space-y-3">
                  {pendingRequests.length === 0 ? <p className="text-center py-10 opacity-30 text-xs italic">Không có lời mời mới</p> :
                    pendingRequests.map(req => (
                      <div key={req.id} className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">{req.profiles.email[0].toUpperCase()}</div>
                          <p className="text-xs font-bold truncate">{req.profiles.full_name || req.profiles.email}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => acceptFriend(req.id, req.user_id)} className="flex-grow py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"><Check size={12}/> Chấp nhận</button>
                          <button className="px-3 py-1.5 bg-white/5 rounded-lg text-[10px] font-bold"><X size={12}/></button>
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}

              {activeSubTab === 'search' && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={14} />
                    <input 
                      type="text" placeholder="Tìm email..." 
                      className={inputClass + " pl-10"} 
                      value={searchEmail} 
                      onChange={e => {
                        setSearchEmail(e.target.value);
                        if(e.target.value === '') setSearchResult(null);
                      }}
                      onKeyDown={async (e) => {
                        if(e.key === 'Enter') {
                          const { data } = await supabase.from('profiles').select('*').eq('email', searchEmail).single();
                          setSearchResult(data);
                        }
                      }}
                    />
                  </div>
                  {searchResult && (
                    <div className="p-4 rounded-2xl bg-blue-600/10 border border-blue-600/20 flex flex-col items-center gap-3 text-center animate-fade-in">
                      <img src={searchResult.avatar_url || `https://ui-avatars.com/api/?name=${searchResult.full_name}`} className="w-16 h-16 rounded-full border-4 border-blue-600/20" />
                      <div>
                        <p className="font-bold">{searchResult.full_name || "User"}</p>
                        <p className="text-[10px] opacity-50">{searchResult.email}</p>
                      </div>
                      <button onClick={() => sendRequest(searchResult.id)} className="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                        <UserPlus size={14}/> Gửi lời mời
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default GizmoProfile;