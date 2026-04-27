import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [list, setList] = useState<any[]>([]);
  const [tab, setTab] = useState<'beranda' | 'laporan'>('beranda');
  
  // State Input
  const [desc, setDesc] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [amount, setAmount] = useState('');

  const opsiMasuk = ["Iuran RT 001", "Iuran RT 002", "Iuran RT 003", "Iuran RT 004", "Iuran RT 005", "Iuran RT 006", "Iuran RT 007", "SAB Almanar", "Lainnya"];
  const opsiKeluar = ["Insentif Linmas", "UPT", "WATESA", "POSYANDU", "Lainnya"];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) setRole(session.user.email === 'admin@rw02.com' ? 'admin' : 'user');
    });
    fetchData();
  }, [session]);

  const fetchData = async () => {
    const { data } = await supabase.from('transaksi').select('*').order('created_at', { ascending: false });
    if (data) setList(data);
  };

  const totalMasuk = list.filter(i => i.tipe === 'masuk').reduce((a, b) => a + b.nominal, 0);
  const totalKeluar = list.filter(i => i.tipe === 'keluar').reduce((a, b) => a + b.nominal, 0);
  const saldo = totalMasuk - totalKeluar;

  const handleSave = async (tipe: string) => {
    if (role !== 'admin') return alert("Hanya Admin yang bisa input!");
    const ket = desc === 'Lainnya' ? customDesc : desc;
    if (!ket || !amount) return alert("Isi data lengkap!");
    
    await supabase.from('transaksi').insert([{ keterangan: ket, nominal: parseInt(amount), tipe }]);
    setDesc(''); setCustomDesc(''); setAmount(''); fetchData();
    alert("Data Berhasil Disimpan!");
  };

  if (!session) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <form className="bg-white p-8 rounded-[2rem] shadow-xl w-full max-w-sm border border-slate-100" onSubmit={(e:any) => { e.preventDefault(); supabase.auth.signInWithPassword({ email: e.target.email.value, password: e.target.password.value }); }}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-emerald-200">RW</div>
          <h2 className="font-black text-xl tracking-tighter">KAS RW 02 ONLINE</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Silakan Login</p>
        </div>
        <input name="email" placeholder="Email" className="w-full mb-3 p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-emerald-500 border-none" />
        <input name="password" type="password" placeholder="Password" className="w-full mb-6 p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-emerald-500 border-none" />
        <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all">MASUK</button>
      </form>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F8FAFC] font-sans pb-32">
      {/* Header Profile */}
      <div className="p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold">RW</div>
          <div>
            <p className="text-[10px] font-black text-slate-400 leading-none uppercase">Selamat Datang</p>
            <p className="text-sm font-black text-slate-800">{role === 'admin' ? 'Administrator' : 'Warga RW 02'}</p>
          </div>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-rose-500">🚪</button>
      </div>

      {tab === 'beranda' ? (
        <div className="px-6 space-y-6">
          {/* Card Saldo Utama */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50/50 p-4 rounded-[1.5rem] border border-emerald-100">
              <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">● Masuk</p>
              <p className="font-black text-lg text-slate-800 italic">Rp {totalMasuk.toLocaleString()}</p>
            </div>
            <div className="bg-rose-50/50 p-4 rounded-[1.5rem] border border-rose-100">
              <p className="text-[9px] font-black text-rose-600 uppercase mb-1">● Keluar</p>
              <p className="font-black text-lg text-slate-800 italic">Rp {totalKeluar.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-[#1E293B] p-8 rounded-[2.5rem] shadow-2xl shadow-slate-300 text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
             <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Total Saldo RW 02</p>
             <h2 className="text-white text-4xl font-black italic tracking-tighter">Rp {saldo.toLocaleString()}</h2>
          </div>

          {/* Form Input Khusus Admin */}
          {role === 'admin' && (
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-4">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Form Input Kas</p>
              
              <div className="grid grid-cols-2 gap-2">
                <select value={desc} onChange={e => setDesc(e.target.value)} className="p-3 bg-slate-50 rounded-xl text-[10px] font-bold outline-none border-none">
                  <option value="">-- KATEGORI MASUK --</option>
                  {opsiMasuk.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <select value={desc} onChange={e => setDesc(e.target.value)} className="p-3 bg-slate-50 rounded-xl text-[10px] font-bold outline-none border-none">
                  <option value="">-- KATEGORI KELUAR --</option>
                  {opsiKeluar.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {desc === 'Lainnya' && <input value={customDesc} onChange={e => setCustomDesc(e.target.value)} placeholder="Keterangan manual..." className="w-full p-4 bg-slate-50 rounded-2xl text-xs outline-none border border-slate-100" />}
              
              <input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="Nominal Rp..." className="w-full p-5 bg-slate-50 rounded-2xl font-black text-xl outline-none border-none" />
              
              <div className="flex gap-3 pt-2">
                <button onClick={() => handleSave('masuk')} className="flex-1 bg-[#10B981] text-white py-4 rounded-2xl font-black text-xs shadow-lg shadow-emerald-100">MASUK</button>
                <button onClick={() => handleSave('keluar')} className="flex-1 bg-[#F43F5E] text-white py-4 rounded-2xl font-black text-xs shadow-lg shadow-rose-100">KELUAR</button>
              </div>
            </div>
          )}

          {!role === 'admin' && (
            <div className="bg-blue-50 p-6 rounded-[2rem] text-center">
              <p className="text-xs font-bold text-blue-600 uppercase">Mode View Only (Warga)</p>
            </div>
          )}
        </div>
      ) : (
        <div className="px-6 space-y-4">
          <h3 className="font-black text-xl px-2">Laporan Kas</h3>
          {list.map(i => (
            <div key={i.id} className="bg-white p-5 rounded-3xl shadow-sm flex justify-between items-center border border-slate-50">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${i.tipe === 'masuk' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                <div>
                  <p className="text-xs font-black text-slate-800 uppercase tracking-tighter">{i.keterangan}</p>
                  <p className="text-[9px] text-slate-400 font-bold">{new Date(i.created_at).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-black ${i.tipe === 'masuk' ? 'text-emerald-600' : 'text-rose-600'}`}>{i.tipe === 'masuk' ? '+' : '-'} {i.nominal.toLocaleString()}</p>
                {role === 'admin' && (
                  <button onClick={async () => {if(confirm('Hapus?')){await supabase.from('transaksi').delete().eq('id', i.id); fetchData();}}} className="text-[10px] text-rose-300 font-bold uppercase mt-1">Hapus</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Navigation Bottom Bar */}
      <div className="fixed bottom-6 left-6 right-6 bg-white/80 backdrop-blur-lg h-20 rounded-[2rem] shadow-2xl border border-white flex items-center justify-around px-8">
        <button onClick={() => setTab('beranda')} className={`flex flex-col items-center gap-1 transition-all ${tab === 'beranda' ? 'text-emerald-600 scale-110' : 'text-slate-300 grayscale'}`}>
          <span className="text-2xl">🏠</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Beranda</span>
        </button>
        <div className="w-px h-8 bg-slate-100"></div>
        <button onClick={() => setTab('laporan')} className={`flex flex-col items-center gap-1 transition-all ${tab === 'laporan' ? 'text-emerald-600 scale-110' : 'text-slate-300 grayscale'}`}>
          <span className="text-2xl">📊</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Laporan</span>
        </button>
      </div>
    </div>
  );
}