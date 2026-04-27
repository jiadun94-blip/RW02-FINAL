import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [list, setList] = useState<any[]>([]);
  const [tab, setTab] = useState<'beranda' | 'laporan'>('beranda');
  
  const [desc, setDesc] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const opsiMasuk = ["Iuran RT 001", "Iuran RT 002", "Iuran RT 003", "Iuran RT 004", "Iuran RT 005", "Iuran RT 006", "Iuran RT 007", "SAB Almanar", "Lainnya"];
  const opsiKeluar = ["Insentif Linmas", "UPT", "WATESA", "POSYANDU", "Lainnya"];

  useEffect(() => {
    // Ambil sesi saat ini
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthChange(session);
    });

    // Pantau perubahan login/logout
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthChange(session);
    });

    fetchData();
    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleAuthChange = (session: any) => {
    setSession(session);
    if (session) {
      // GANTI EMAIL INI dengan email admin bapak yang terdaftar di Supabase
      const adminEmail = 'admin@rw02.com'; 
      setRole(session.user.email === adminEmail ? 'admin' : 'user');
    }
  };

  const fetchData = async () => {
    const { data } = await supabase.from('transaksi').select('*').order('created_at', { ascending: false });
    if (data) setList(data);
  };

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const email = e.target.email.value;
    const password = e.target.password.value;

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("Login Gagal: " + error.message);
    setLoading(false);
  };

  const handleSave = async (tipe: string) => {
    const ket = desc === 'Lainnya' ? customDesc : desc;
    if (!ket || !amount) return alert("Isi data lengkap!");
    
    const { error } = await supabase.from('transaksi').insert([{ keterangan: ket, nominal: parseInt(amount), tipe }]);
    if (error) {
      alert("Gagal simpan: " + error.message);
    } else {
      setDesc(''); setCustomDesc(''); setAmount(''); fetchData();
      alert("Berhasil disimpan!");
    }
  };

  const totalMasuk = list.filter(i => i.tipe === 'masuk').reduce((a, b) => a + b.nominal, 0);
  const totalKeluar = list.filter(i => i.tipe === 'keluar').reduce((a, b) => a + b.nominal, 0);
  const saldo = totalMasuk - totalKeluar;

  if (!session) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-sm border border-slate-100">
        <form onSubmit={handleLogin}>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-emerald-200">RW</div>
            <h2 className="font-black text-xl tracking-tighter">KAS RW 02 ONLINE</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Masukan Akun Anda</p>
          </div>
          <input name="email" type="email" required placeholder="Email" className="w-full mb-3 p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-emerald-500 border-none text-sm" />
          <input name="password" type="password" required placeholder="Password" className="w-full mb-6 p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-emerald-500 border-none text-sm" />
          <button disabled={loading} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all">
            {loading ? 'MENCOBA MASUK...' : 'MASUK SEKARANG'}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F8FAFC] font-sans pb-32">
      <div className="p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-100">RW</div>
          <div>
            <p className="text-[10px] font-black text-slate-400 leading-none uppercase">Akses: {role.toUpperCase()}</p>
            <p className="text-sm font-black text-slate-800">{session.user.email}</p>
          </div>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center text-rose-500 font-bold">BYE</button>
      </div>

      {tab === 'beranda' ? (
        <div className="px-6 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-50">
              <p className="text-[9px] font-black text-emerald-500 uppercase mb-1">Total Masuk</p>
              <p className="font-black text-sm text-slate-800 italic">Rp {totalMasuk.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-50">
              <p className="text-[9px] font-black text-rose-500 uppercase mb-1">Total Keluar</p>
              <p className="font-black text-sm text-slate-800 italic">Rp {totalKeluar.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl text-center">
             <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">SALDO KAS RW 02</p>
             <h2 className="text-white text-4xl font-black italic tracking-tighter">Rp {saldo.toLocaleString()}</h2>
          </div>

          {role === 'admin' && (
            <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-50 space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">INPUT TRANSAKSI BARU</p>
              <div className="grid grid-cols-2 gap-2">
                <select value={desc} onChange={e => setDesc(e.target.value)} className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl text-[10px] font-bold border-none outline-none">
                  <option value="">-- PEMASUKAN --</option>
                  {opsiMasuk.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <select value={desc} onChange={e => setDesc(e.target.value)} className="p-4 bg-rose-50 text-rose-700 rounded-2xl text-[10px] font-bold border-none outline-none">
                  <option value="">-- PENGELUARAN --</option>
                  {opsiKeluar.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              {desc === 'Lainnya' && <input value={customDesc} onChange={e => setCustomDesc(e.target.value)} placeholder="Ketik keterangan..." className="w-full p-4 bg-slate-50 rounded-2xl text-xs outline-none" />}
              <input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="Nominal Rp" className="w-full p-5 bg-slate-100 rounded-2xl font-black text-2xl outline-none" />
              <div className="flex gap-3 pt-2">
                <button onClick={() => handleSave('masuk')} className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black text-[10px] shadow-lg shadow-emerald-100">SIMPAN MASUK</button>
                <button onClick={() => handleSave('keluar')} className="flex-1 bg-rose-600 text-white py-4 rounded-2xl font-black text-[10px] shadow-lg shadow-rose-100">SIMPAN KELUAR</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="px-6 space-y-3">
          <h3 className="font-black text-lg px-2 mb-4 uppercase italic tracking-tighter">Laporan Riwayat</h3>
          {list.map(i => (
            <div key={i.id} className="bg-white p-5 rounded-[1.8rem] shadow-sm flex justify-between items-center border border-slate-50">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${i.tipe === 'masuk' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]'}`}></div>
                <div>
                  <p className="text-[11px] font-black text-slate-800 uppercase tracking-tighter">{i.keterangan}</p>
                  <p className="text-[8px] text-slate-400 font-bold uppercase">{new Date(i.created_at).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}</p>
                </div>
              </div>
              <p className={`text-xs font-black ${i.tipe === 'masuk' ? 'text-emerald-600' : 'text-rose-600'}`}>{i.tipe === 'masuk' ? '+' : '-'} {i.nominal.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      <div className="fixed bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md h-20 rounded-[2rem] shadow-2xl border border-white/50 flex items-center justify-around px-8">
        <button onClick={() => setTab('beranda')} className={`flex flex-col items-center gap-1 ${tab === 'beranda' ? 'text-emerald-600' : 'text-slate-300'}`}>
          <span className="text-xl">🏠</span>
          <span className="text-[8px] font-black uppercase tracking-widest">Beranda</span>
        </button>
        <button onClick={() => setTab('laporan')} className={`flex flex-col items-center gap-1 ${tab === 'laporan' ? 'text-emerald-600' : 'text-slate-300'}`}>
          <span className="text-xl">📊</span>
          <span className="text-[8px] font-black uppercase tracking-widest">Laporan</span>
        </button>
      </div>
    </div>
  );
}