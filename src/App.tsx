import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [list, setList] = useState<any[]>([]);
  const [tab, setTab] = useState<'beranda' | 'laporan'>('beranda');
  const [isSignUp, setIsSignUp] = useState(false); // State untuk pindah ke Daftar Akun
  
  const [desc, setDesc] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');

  const opsiMasuk = ["Iuran RT 001", "Iuran RT 002", "Iuran RT 003", "Iuran RT 004", "Iuran RT 005", "Iuran RT 006", "Iuran RT 007", "SAB Almanar", "Lainnya"];
  const opsiKeluar = ["Insentif Linmas", "UPT", "WATESA", "POSYANDU", "Lainnya"];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthChange(session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthChange(session);
    });

    fetchData();
    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleAuthChange = (session: any) => {
    setSession(session);
    if (session) {
      const adminEmail = 'admin@rw02.com'; 
      setRole(session.user.email === adminEmail ? 'admin' : 'user');
      // Mengambil nama dari metadata user (nama saat daftar)
      setFullName(session.user.user_metadata?.full_name || 'Warga');
    }
  };

  const fetchData = async () => {
    const { data } = await supabase.from('transaksi').select('*').order('created_at', { ascending: false });
    if (data) setList(data);
  };

  const handleAuthAction = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const email = e.target.email.value;
    const password = e.target.password.value;
    const name = e.target.name?.value;

    if (isSignUp) {
      // PROSES DAFTAR
      const { error } = await supabase.auth.signUp({
        email, password, options: { data: { full_name: name } }
      });
      if (error) alert("Gagal Daftar: " + error.message);
      else alert("Berhasil Daftar! Silakan cek email atau langsung Login.");
    } else {
      // PROSES LOGIN
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert("Login Gagal: " + error.message);
    }
    setLoading(false);
  };

  const handleSave = async (tipe: string) => {
    const ket = desc === 'Lainnya' ? customDesc : desc;
    if (!ket || !amount) return alert("Isi data lengkap!");
    await supabase.from('transaksi').insert([{ keterangan: ket, nominal: parseInt(amount), tipe }]);
    setDesc(''); setCustomDesc(''); setAmount(''); fetchData();
  };

  const totalMasuk = list.filter(i => i.tipe === 'masuk').reduce((a, b) => a + b.nominal, 0);
  const totalKeluar = list.filter(i => i.tipe === 'keluar').reduce((a, b) => a + b.nominal, 0);
  const saldo = totalMasuk - totalKeluar;

  if (!session) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-sm">
        <form onSubmit={handleAuthAction}>
          <div className="text-center mb-8">
             {/* LOGO SESUAI SCREENSHOT (Lingkaran Hijau) */}
            <div className="w-20 h-20 bg-emerald-500 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg shadow-emerald-200 border-4 border-white">
                <span className="text-white font-black text-2xl tracking-tighter italic">RW</span>
            </div>
            <h2 className="font-black text-xl tracking-tighter uppercase">{isSignUp ? 'Daftar Akun' : 'Kas RW 02 Online'}</h2>
          </div>
          
          {isSignUp && (
            <input name="name" required placeholder="Nama Lengkap" className="w-full mb-3 p-4 bg-slate-50 rounded-2xl outline-none border-none text-sm" />
          )}
          <input name="email" type="email" required placeholder="Email" className="w-full mb-3 p-4 bg-slate-50 rounded-2xl outline-none border-none text-sm" />
          <input name="password" type="password" required placeholder="Password" className="w-full mb-6 p-4 bg-slate-50 rounded-2xl outline-none border-none text-sm" />
          
          <button disabled={loading} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-lg mb-4">
            {loading ? 'MEMPROSES...' : isSignUp ? 'DAFTAR SEKARANG' : 'MASUK'}
          </button>

          <p className="text-center text-xs font-bold text-slate-400">
            {isSignUp ? 'Sudah punya akun?' : 'Belum punya akun?'} 
            <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-emerald-500 ml-1 underline">
              {isSignUp ? 'Login di sini' : 'Daftar di sini'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F8FAFC] font-sans pb-32">
      <div className="p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-black shadow-lg shadow-emerald-100 border-2 border-white italic">RW</div>
          <div>
            <p className="text-[10px] font-black text-slate-400 leading-none uppercase tracking-widest mb-1">Selamat Datang</p>
            <p className="text-lg font-black text-slate-800 leading-none">{fullName}</p>
          </div>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="text-[10px] font-bold text-rose-500 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-50 uppercase tracking-tighter">Keluar</button>
      </div>

      {tab === 'beranda' ? (
        <div className="px-6 space-y-6">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
             <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2 italic">Saldo Kas RW 02</p>
             <h2 className="text-white text-4xl font-black italic tracking-tighter">Rp {saldo.toLocaleString()}</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100">
              <p className="text-[9px] font-black text-emerald-500 uppercase mb-2 italic tracking-widest">● Pemasukan</p>
              <p className="font-black text-sm text-slate-800">Rp {totalMasuk.toLocaleString()}</p>
            </div>
            <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100">
              <p className="text-[9px] font-black text-rose-500 uppercase mb-2 italic tracking-widest">● Pengeluaran</p>
              <p className="font-black text-sm text-slate-800">Rp {totalKeluar.toLocaleString()}</p>
            </div>
          </div>

          {role === 'admin' && (
            <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-50 space-y-4">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] text-center italic">Panel Input Admin</p>
              <div className="grid grid-cols-2 gap-2">
                <select value={desc} onChange={e => setDesc(e.target.value)} className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl text-[10px] font-black border-none outline-none">
                  <option value="">-- MASUK --</option>
                  {opsiMasuk.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <select value={desc} onChange={e => setDesc(e.target.value)} className="p-4 bg-rose-50 text-rose-700 rounded-2xl text-[10px] font-black border-none outline-none">
                  <option value="">-- KELUAR --</option>
                  {opsiKeluar.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              {desc === 'Lainnya' && <input value={customDesc} onChange={e => setCustomDesc(e.target.value)} placeholder="Ketik keterangan manual..." className="w-full p-4 bg-slate-50 rounded-2xl text-xs outline-none border border-slate-100" />}
              <input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="Nominal Rp" className="w-full p-5 bg-slate-100 rounded-2xl font-black text-3xl outline-none border-none italic text-center" />
              <div className="flex gap-3">
                <button onClick={() => handleSave('masuk')} className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black text-xs shadow-lg shadow-emerald-100 active:scale-95 transition-all">SIMPAN MASUK</button>
                <button onClick={() => handleSave('keluar')} className="flex-1 bg-rose-600 text-white py-4 rounded-2xl font-black text-xs shadow-lg shadow-rose-100 active:scale-95 transition-all">SIMPAN KELUAR</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="px-6 space-y-3">
          <h3 className="font-black text-xl px-2 mb-4 italic tracking-tighter">Laporan Transaksi</h3>
          {list.map(i => (
            <div key={i.id} className="bg-white p-5 rounded-[2rem] shadow-sm flex justify-between items-center border border-slate-50">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${i.tipe === 'masuk' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]'}`}></div>
                <div>
                  <p className="text-[11px] font-black text-slate-800 uppercase leading-none mb-1 tracking-tighter">{i.keterangan}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">{new Date(i.created_at).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}</p>
                </div>
              </div>
              <p className={`text-sm font-black italic ${i.tipe === 'masuk' ? 'text-emerald-600' : 'text-rose-600'}`}>{i.tipe === 'masuk' ? '+' : '-'} {i.nominal.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* Floating Navbar */}
      <div className="fixed bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md h-20 rounded-[2.5rem] shadow-2xl border border-white/50 flex items-center justify-around px-8">
        <button onClick={() => setTab('beranda')} className={`flex flex-col items-center gap-1 transition-all ${tab === 'beranda' ? 'text-emerald-600 scale-110' : 'text-slate-300'}`}>
          <span className="text-xl">🏠</span>
          <span className="text-[8px] font-black uppercase tracking-[0.2em]">Beranda</span>
        </button>
        <div className="w-px h-8 bg-slate-100"></div>
        <button onClick={() => setTab('laporan')} className={`flex flex-col items-center gap-1 transition-all ${tab === 'laporan' ? 'text-emerald-600 scale-110' : 'text-slate-300'}`}>
          <span className="text-xl">📊</span>
          <span className="text-[8px] font-black uppercase tracking-[0.2em]">Laporan</span>
        </button>
      </div>
    </div>
  );
}