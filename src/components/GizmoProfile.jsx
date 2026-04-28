import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function GizmoProfile({ session }) {
  const [profile, setProfile] = useState({ full_name: '', avatar_url: '' });
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = session.user;

  useEffect(() => {
    fetchProfile();
    fetchFriends();
  }, []);

  // 1. Lấy thông tin cá nhân (hoặc tạo mới nếu chưa có)
  const fetchProfile = async () => {
    let { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // Nếu chưa có profile, tạo mới luôn
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert([{ id: user.id, email: user.email, full_name: user.email.split('@')[0] }])
        .select()
        .single();
      setProfile(newProfile);
    } else {
      setProfile(data);
    }
    setLoading(false);
  };

  // 2. Cập nhật tên hiển thị
  const updateProfile = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: profile.full_name, updated_at: new Date() })
      .eq('id', user.id);
    
    if (error) alert("Lỗi cập nhật!");
    else alert("Đã cập nhật hồ sơ!");
  };

  // 3. Tìm kiếm người dùng khác qua Email
  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchEmail === user.email) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', searchEmail)
      .single();

    if (data) setSearchResult(data);
    else alert("Không tìm thấy người dùng này!");
  };

  // 4. Gửi lời mời kết bạn
  const sendFriendRequest = async (friendId) => {
    const { error } = await supabase
      .from('friends')
      .insert([{ user_id: user.id, friend_id: friendId, status: 'pending' }]);
    
    if (error) alert("Lỗi hoặc đã gửi lời mời trước đó!");
    else {
      alert("Đã gửi lời mời kết bạn!");
      setSearchResult(null);
      fetchFriends();
    }
  };

  // 5. Lấy danh sách bạn bè
  const fetchFriends = async () => {
    const { data, error } = await supabase
      .from('friends')
      .select(`
        id, status,
        profiles!friends_friend_id_fkey(id, email, full_name)
      `)
      .eq('user_id', user.id);
    
    if (data) setFriends(data);
  };

  return (
    <div className="flex flex-col gap-6 p-2 md:p-4 max-w-4xl mx-auto animate-fade-in pb-20 md:pb-4">
      
      {/* PHẦN 1: HỒ SƠ CỦA TÔI */}
      <section className="glass-panel p-6 rounded-[2rem] border border-white/20 shadow-xl">
        <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-blue-500">
          <span>👤</span> Hồ Sơ Cá Nhân
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs opacity-50 font-bold uppercase ml-2">Email</label>
            <input type="text" value={user.email} disabled className="w-full px-5 py-3 rounded-2xl bg-white/5 border border-white/10 opacity-50 cursor-not-allowed text-sm" />
          </div>
          <div>
            <label className="text-xs opacity-50 font-bold uppercase ml-2">Tên hiển thị</label>
            <input 
              type="text" 
              value={profile?.full_name || ''} 
              onChange={(e) => setProfile({...profile, full_name: e.target.value})}
              className="w-full px-5 py-3 rounded-2xl bg-white/10 border border-white/20 outline-none focus:border-blue-500 transition-all text-sm" 
            />
          </div>
          <button onClick={updateProfile} className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg">
            Lưu Thay Đổi
          </button>
        </div>
      </section>

      {/* PHẦN 2: TÌM BẠN BÈ */}
      <section className="glass-panel p-6 rounded-[2rem] border border-white/20 shadow-xl">
        <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-purple-500">
          <span>🔍</span> Tìm Kiếm Bạn Bè
        </h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input 
            type="email" 
            placeholder="Nhập email bạn bè..." 
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="flex-grow px-5 py-3 rounded-2xl bg-white/10 border border-white/20 outline-none focus:border-purple-500 text-sm"
          />
          <button type="submit" className="px-6 rounded-2xl bg-purple-600 text-white font-bold">Tìm</button>
        </form>

        {searchResult && (
          <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center animate-fade-in">
            <div>
              <p className="font-bold">{searchResult.full_name}</p>
              <p className="text-xs opacity-50">{searchResult.email}</p>
            </div>
            <button 
              onClick={() => sendFriendRequest(searchResult.id)}
              className="px-4 py-2 rounded-xl bg-green-600 text-white text-xs font-bold"
            >
              + Kết bạn
            </button>
          </div>
        )}
      </section>

      {/* PHẦN 3: DANH SÁCH BẠN BÈ */}
      <section className="glass-panel p-6 rounded-[2rem] border border-white/20 shadow-xl">
        <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-green-500">
          <span>🤝</span> Danh Sách Bạn Bè
        </h2>
        <div className="space-y-3">
          {friends.length === 0 ? (
            <p className="text-center opacity-40 text-sm italic py-4">Chưa có bạn bè nào.</p>
          ) : (
            friends.map((f) => (
              <div key={f.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                    {f.profiles.full_name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{f.profiles.full_name}</p>
                    <p className="text-[10px] opacity-50 uppercase">{f.status}</p>
                  </div>
                </div>
                <button className="text-xs opacity-40 hover:text-red-500 font-bold">Hủy</button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default GizmoProfile;