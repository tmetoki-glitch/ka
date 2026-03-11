'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, Trash2, CheckCircle2, Circle, LogOut, UserPlus, LogIn, Heart } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AlphaApp() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [women, setWomen] = useState<any[]>([]);
  const [newName, setNewName] = useState('');
  const [newStatus, setNewStatus] = useState('初対面');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) fetchWomen();
  }, [user]);

  async function fetchWomen() {
    const { data } = await supabase
      .from('women')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setWomen(data);
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert(error.message);
      else alert('確認メールを送りました（設定済みなら即ログイン可）');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert('ログイン失敗: パスワードかメールが違います');
    }
  }

  async function addWoman() {
    if (!newName) return;
    const { error } = await supabase
      .from('women')
      .insert([{ name: newName, status: newStatus, user_id: user.id }]);
    if (!error) {
      setNewName('');
      fetchWomen();
    }
  }

  async function deleteWoman(id: string) {
    await supabase.from('women').delete().eq('id', id);
    fetchWomen();
  }

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-6xl font-black text-red-600 mb-8 tracking-tighter italic">ALPHA</h1>
        <form onSubmit={handleAuth} className="w-full max-w-sm space-y-4">
          <input
            type="email"
            placeholder="メールアドレス"
            className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="パスワード(6文字以上)"
            className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="w-full p-3 bg-red-600 font-bold rounded hover:bg-red-700 transition">
            {isSignUp ? '新規登録する' : 'ログイン'}
          </button>
        </form>
        <button onClick={() => setIsSignUp(!isSignUp)} className="mt-4 text-zinc-500 text-sm underline">
          {isSignUp ? 'ログインはこちら' : '新規登録はこちら'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-20 font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-black text-red-600 italic tracking-tighter">ALPHA</h1>
        <button onClick={() => supabase.auth.signOut()} className="p-2 text-zinc-500"><LogOut size={20} /></button>
      </div>

      <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 mb-6">
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="名前"
            className="flex-1 bg-black border border-zinc-800 p-2 rounded text-white"
          />
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="bg-black border border-zinc-800 p-2 rounded text-white text-sm"
          >
            <option>初対面</option>
            <option>デート中</option>
            <option>即</option>
            <option>セフレ</option>
          </select>
          <button onClick={addWoman} className="bg-red-600 p-2 rounded"><Plus /></button>
        </div>
      </div>

      <div className="space-y-3">
        {women.map((w) => (
          <div key={w.id} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex justify-between items-center">
            <div>
              <div className="font-bold text-lg">{w.name}</div>
              <div className="text-xs text-zinc-500 flex items-center gap-1">
                <Heart size={10} className="text-red-600" /> {w.status}
              </div>
            </div>
            <button onClick={() => deleteWoman(w.id)} className="text-zinc-700 hover:text-red-600"><Trash2 size={18} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
