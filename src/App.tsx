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

  const opsiMasuk = ["Iuran Wajib RT 001", "Iuran Wajib RT 002", "Iuran Wajib RT 003", "Iuran Wajib RT 004", "Iuran Wajib RT 005", "Iuran Wajib RT 006", "Iuran Wajib RT 007", "SAB Almanar", "Lainnya"];
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

  const printStruk = (item: any) => {
    const p = window.open('', '', 'width=300,height=450');
    if (!p) return;
    p.document.write(`
      <html><body style="font-family:monospace;width:48mm;padding:10px;font-size:10pt">
        <center><b>KAS RW 02</b><br>WATESA</center><hr>
        Tgl: ${new Date().toLocaleDateString()}<br>
        Ket: ${item.keterangan}<hr>
        <b>TOTAL: Rp ${item.nominal.toLocaleString()}</b><hr>
        <center>TERIMA KASIH</center>
      </body></html>
    `);
    p.document.close(); p.focus(); p.print(); p.close();
  };

  const handleSave = async (tipe: string) => {
    const ket = desc === 'Lainnya' ? customDesc : desc;
    if (!ket || !amount) return alert("Isi Data!");
    const tgl = new Date(year, month - 1, 2).toISOString();
    
    if (editingId) {
      await supabase.from('transaksi').update({ keterangan: ket, nominal: parseInt(amount), tipe, created_at: tgl }).eq('id', editingId);
      setEditingId(null);
    } else {
      const { data } = await supabase.from('transaksi').insert([{ keterangan: ket, nominal: parseInt(amount), tipe, created_at: tgl }]).select();
      if (data) printStruk(data[0]);
    }
    setDesc(''); setCustomDesc(''); setAmount(''); fetchData();
  };

  if (!session) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <form className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm" onSubmit={(e:any) => { e.preventDefault(); supabase.auth.signInWithPassword({ email: e.target.email.value, password: e.target.password.value }); }}>
        <h2 className="font-black mb-6 text-center italic">LOGIN ADMIN RW02</h2>
        <input name="email" placeholder="Email" className="w-full mb-3 p-3 border rounded-xl outline-none" />
        <input name="password" type="password" placeholder="Password" className="w-full mb-4 p-3 border rounded-xl outline-none" />
        <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold">MASUK</button>
      </form>
    </div>
  );

  return (
    <div className="max-w-md mx-auto p-4 pb-24 min-h-screen bg-slate-50 font-sans">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-black italic text-xl tracking-tighter text-slate-800 uppercase">Kas RW 02</h1>
        <button onClick={() => supabase.auth.signOut()} className="text-xs font-bold text-rose-500 bg-white px-3 py-1 rounded-full shadow-sm">LOGOUT</button>
      </div>

      <div className="bg-white p-5 rounded-3xl shadow-sm mb-6 border border-white">
        <p className="text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">{editingId ? '⚡ Edit Data' : '➕ Input Transaksi'}</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <select value={desc} onChange={e => setDesc(e.target.value)} className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-bold outline-none border-none">
            <option value="">-- PILIH MASUK --</option>
            {opsiMasuk.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={desc} onChange={e => setDesc(e.target.value)} className="p-3 bg-rose-50 text-rose-700 rounded-xl text-[10px] font-bold outline-none border-none">
            <option value="">-- PILIH KELUAR --</option>
            {opsiKeluar.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        {desc === 'Lainnya' && <input value={customDesc} onChange={e => setCustomDesc(e.target.value)} placeholder="Keterangan manual..." className="w-full p-3 bg-yellow-50 border border-yellow-100 mb-3 rounded-xl text-xs outline-none" />}
        <input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="Nominal Rp" className="w-full p-4 bg-slate-50 mb-3 rounded-2xl font-black text-lg outline-none" />
        <div className="grid grid-cols-2 gap-2 mb-4">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none border-none"> {daftarBulan.map((b, i) => <option key={b} value={i+1}>{b}</option>)} </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none border-none"> <option value={2025}>2025</option><option value={2026}>2026</option> </select>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleSave('masuk')} className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black text-[10px] shadow-lg shadow-emerald-100 uppercase">Simpan Masuk</button>
          {!editingId && <button onClick={() => handleSave('keluar')} className="flex-1 bg-rose-600 text-white py-4 rounded-2xl font-black text-[10px] shadow-lg shadow-rose-100 uppercase">Simpan Keluar</button>}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[10px] font-black text-slate-300 uppercase px-2 italic">Riwayat Transaksi</p>
        {list.slice(0, 15).map(i => (
          <div key={i.id} className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center border border-white">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${i.tipe === 'masuk' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
              <div>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-tighter">{i.keterangan}</p>
                <p className="text-[8px] text-slate-400 font-bold uppercase">{daftarBulan[new Date(i.created_at).getMonth()]} {new Date(i.created_at).getFullYear()}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <p className={`text-xs font-black italic ${i.tipe === 'masuk' ? 'text-emerald-600' : 'text-rose-600'}`}>Rp {i.nominal.toLocaleString()}</p>
              <div className="flex gap-2 border-l pl-3 border-slate-100">
                <button onClick={() => { setEditingId(i.id); setDesc(i.keterangan); setAmount(i.nominal.toString()); window.scrollTo(0,0); }}>✏️</button>
                <button onClick={async () => { if(confirm('Hapus?')) { await supabase.from('transaksi').delete().eq('id', i.id); fetchData(); } }}>🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}