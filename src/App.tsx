import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [list, setList] = useState<any[]>([]);
  const [desc, setDesc] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [editingId, setEditingId] = useState<any>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const opsiMasuk = ["Iuran RT 001", "Iuran RT 002", "Iuran RT 003", "Iuran RT 004", "Iuran RT 005", "Iuran RT 006", "Iuran RT 007", "SAB Almanar", "Lainnya"];
  const opsiKeluar = ["Insentif Linmas", "UPT", "WATESA", "POSYANDU", "Lainnya"];
  const daftarBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    fetchData();
  }, [session]);

  const fetchData = async () => {
    const { data } = await supabase.from('transaksi').select('*').order('id', { ascending: false });
    if (data) setList(data);
  };

  const handleSave = async (tipe: string) => {
    const ket = desc === 'Lainnya' ? customDesc : desc;
    if (!ket || !amount) return alert("Isi Data!");
    const tgl = new Date(year, month - 1, 2).toISOString();
    
    if (editingId) {
      await supabase.from('transaksi').update({ keterangan: ket, nominal: parseInt(amount), tipe, created_at: tgl }).eq('id', editingId);
      setEditingId(null);
    } else {
      await supabase.from('transaksi').insert([{ keterangan: ket, nominal: parseInt(amount), tipe, created_at: tgl }]);
    }
    setDesc(''); setCustomDesc(''); setAmount(''); fetchData();
  };

  if (!session) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-800 p-6">
      <form className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm" onSubmit={(e:any) => { e.preventDefault(); supabase.auth.signInWithPassword({ email: e.target.email.value, password: e.target.password.value }); }}>
        <h2 className="font-black mb-6 text-center text-2xl italic tracking-tighter">ADMIN RW 02</h2>
        <input name="email" placeholder="Email" className="w-full mb-3 p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 ring-blue-500" />
        <input name="password" type="password" placeholder="Password" className="w-full mb-6 p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 ring-blue-500" />
        <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-lg">MASUK SISTEM</button>
      </form>
    </div>
  );

  return (
    <div className="max-w-md mx-auto p-4 pb-24 min-h-screen bg-slate-50 font-sans text-slate-800">
      <div className="flex justify-between items-center mb-8 mt-4">
        <h1 className="font-black italic text-2xl tracking-tighter text-slate-900">KAS RW 02</h1>
        <button onClick={() => supabase.auth.signOut()} className="text-[10px] font-bold text-white bg-red-500 px-4 py-2 rounded-full shadow-md">LOGOUT</button>
      </div>

      <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 mb-8 border border-white">
        <p className="text-[11px] font-black text-slate-400 mb-4 uppercase tracking-[0.2em]">{editingId ? '⚡ Mode Edit' : '➕ Catat Transaksi'}</p>
        
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-emerald-600 ml-1">PEMASUKAN</label>
            <select value={desc} onChange={e => setDesc(e.target.value)} className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-[11px] font-bold outline-none border-2 border-emerald-100">
              <option value="">-- Pilih --</option>
              {opsiMasuk.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-rose-600 ml-1">PENGELUARAN</label>
            <select value={desc} onChange={e => setDesc(e.target.value)} className="p-3 bg-rose-50 text-rose-700 rounded-xl text-[11px] font-bold outline-none border-2 border-rose-100">
              <option value="">-- Pilih --</option>
              {opsiKeluar.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        {desc === 'Lainnya' && <input value={customDesc} onChange={e => setCustomDesc(e.target.value)} placeholder="Ketik keterangan manual..." className="w-full p-4 bg-yellow-50 border-2 border-yellow-100 mb-3 rounded-2xl text-xs outline-none" />}
        
        <input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="Nominal Rp" className="w-full p-5 bg-slate-50 mb-4 rounded-[1.5rem] font-black text-2xl outline-none focus:bg-white focus:ring-2 ring-blue-100 transition-all" />
        
        <div className="grid grid-cols-2 gap-3 mb-6">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="p-3 bg-slate-100 rounded-xl text-xs font-bold border-none outline-none"> {daftarBulan.map((b, i) => <option key={b} value={i+1}>{b}</option>)} </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="p-3 bg-slate-100 rounded-xl text-xs font-bold border-none outline-none"> <option value={2025}>2025</option><option value={2026}>2026</option> </select>
        </div>

        <div className="flex gap-3">
          <button onClick={() => handleSave('masuk')} className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black text-xs shadow-lg shadow-emerald-200 active:scale-95 transition-transform">SIMPAN MASUK</button>
          {!editingId && <button onClick={() => handleSave('keluar')} className="flex-1 bg-rose-600 text-white py-4 rounded-2xl font-black text-xs shadow-lg shadow-rose-200 active:scale-95 transition-transform">SIMPAN KELUAR</button>}
          {editingId && <button onClick={() => {setEditingId(null); setDesc(''); setAmount('');}} className="bg-slate-200 p-4 rounded-2xl font-bold text-xs">BATAL</button>}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">Riwayat Terbaru</h3>
        {list.slice(0, 15).map(i => (
          <div key={i.id} className="bg-white p-5 rounded-[1.5rem] shadow-sm flex justify-between items-center border border-white">
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${i.tipe === 'masuk' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`}></div>
              <div>
                <p className="text-[11px] font-black text-slate-800 uppercase leading-none mb-1">{i.keterangan}</p>
                <p className="text-[9px] text-slate-400 font-bold">{daftarBulan[new Date(i.created_at).getMonth()]} {new Date(i.created_at).getFullYear()}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <p className={`text-sm font-black ${i.tipe === 'masuk' ? 'text-emerald-600' : 'text-rose-600'}`}>Rp {i.nominal.toLocaleString()}</p>
              <div className="flex gap-3 border-l pl-3 border-slate-100">
                <button onClick={() => { setEditingId(i.id); setDesc(i.keterangan); setAmount(i.nominal.toString()); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="text-lg opacity-40 hover:opacity-100">✏️</button>
                <button onClick={async () => { if(confirm('Hapus data ini?')) { await supabase.from('transaksi').delete().eq('id', i.id); fetchData(); } }} className="text-lg opacity-40 hover:opacity-100">🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}