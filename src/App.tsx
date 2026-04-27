import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [list, setList] = useState<any[]>([]);
  const [tab, setTab] = useState<'beranda' | 'laporan'>('beranda');
  
  // State Input
  const [tipe, setTipe] = useState<'masuk' | 'keluar'>('masuk');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [desc, setDesc] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [amount, setAmount] = useState('');

  // State Preview Struk
  const [showStruk, setShowStruk] = useState(false);

  const opsiMasuk = ["Iuran RT 001", "Iuran RT 002", "Iuran RT 003", "Iuran RT 004", "Iuran RT 005", "Iuran RT 006", "Iuran RT 007", "SAB Almanar", "Lainnya"];
  const opsiKeluar = ["Insentif Linmas", "UPT", "WATESA", "POSYANDU", "Lainnya"];
  const daftarBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => handleAuthChange(session));
    supabase.auth.onAuthStateChange((_event, session) => handleAuthChange(session));
    fetchData();
  }, []);

  const handleAuthChange = (session: any) => {
    setSession(session);
    if (session) {
      setRole(session.user.email === 'admin@rw02.com' ? 'admin' : 'user');
    }
  };

  const fetchData = async () => {
    const { data } = await supabase.from('transaksi').select('*').order('created_at', { ascending: false });
    if (data) setList(data);
  };

  const handleConfirmSave = async () => {
    const ket = desc === 'Lainnya' ? customDesc : desc;
    const { error } = await supabase.from('transaksi').insert([{ 
      keterangan: ket, 
      nominal: parseInt(amount), 
      tipe,
      created_at: new Date(date).toISOString()
    }]);

    if (!error) {
      alert("Data Berhasil Disimpan ke Kas!");
      setShowStruk(false);
      setDesc(''); setCustomDesc(''); setAmount(''); fetchData();
    }
  };

  const totalMasuk = list.filter(i => i.tipe === 'masuk').reduce((a, b) => a + b.nominal, 0);
  const totalKeluar = list.filter(i => i.tipe === 'keluar').reduce((a, b) => a + b.nominal, 0);

  if (!session) return <div className="text-center p-20">Silakan Login Terlebih Dahulu...</div>;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F8FAFC] pb-32 relative">
      {/* Header Profile */}
      <div className="p-6 flex justify-between items-center bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/kas_rw1.png" alt="Logo" className="h-10" />
          <p className="text-sm font-black text-slate-800 uppercase italic">KAS RW 02</p>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="text-rose-500 font-bold">Keluar</button>
      </div>

      {tab === 'beranda' ? (
        <div className="px-6 space-y-6 mt-6">
          {/* Card Saldo */}
          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl text-center">
             <p className="text-slate-400 text-[10px] font-black uppercase mb-2">Total Saldo Saat Ini</p>
             <h2 className="text-white text-3xl font-black italic">Rp {(totalMasuk - totalKeluar).toLocaleString()}</h2>
          </div>

          {/* Form Input Admin */}
          {role === 'admin' && (
            <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-50 space-y-4">
              <h3 className="text-center font-black text-xs text-slate-400 tracking-widest uppercase italic">Input Data Kas</h3>
              
              {/* Jenis Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 ml-2">JENIS TRANSAKSI</label>
                <select value={tipe} onChange={(e:any) => setTipe(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none border-2 border-slate-50 focus:border-emerald-500 transition-all">
                  <option value="masuk">🟢 PEMASUKAN</option>
                  <option value="keluar">🔴 PENGELUARAN</option>
                </select>
              </div>

              {/* Tanggal */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 ml-2">TANGGAL</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none border-none" />
              </div>

              {/* Keterangan Dropdown */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 ml-2">KETERANGAN</label>
                <select value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none border-none">
                  <option value="">-- Pilih Keterangan --</option>
                  {tipe === 'masuk' ? opsiMasuk.map(o => <option key={o} value={o}>{o}</option>) : opsiKeluar.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              {desc === 'Lainnya' && <input value={customDesc} onChange={(e) => setCustomDesc(e.target.value)} placeholder="Ketik Manual..." className="w-full p-4 bg-slate-50 rounded-2xl text-sm border-2 border-emerald-100" />}

              {/* Bulan & Tahun */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 ml-2">BULAN</label>
                  <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold border-none outline-none">
                    {daftarBulan.map((b, i) => <option key={b} value={i+1}>{b}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 ml-2">TAHUN</label>
                  <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold border-none outline-none">
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                  </select>
                </div>
              </div>

              {/* Nominal */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 ml-2">NOMINAL (RP)</label>
                <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="Contoh: 50000" className="w-full p-5 bg-slate-100 rounded-[1.5rem] font-black text-2xl outline-none text-center italic" />
              </div>

              <button onClick={() => setShowStruk(true)} className="w-full bg-emerald-600 text-white py-5 rounded-[1.5rem] font-black text-sm shadow-xl shadow-emerald-100 active:scale-95 transition-all">SIMPAN DATA</button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6">
          <h3 className="font-black text-lg mb-4 italic">Riwayat Transaksi</h3>
          {list.map(i => (
            <div key={i.id} className="bg-white p-4 rounded-3xl mb-2 flex justify-between items-center shadow-sm border border-slate-50">
              <div>
                <p className="text-[11px] font-black uppercase leading-none mb-1">{i.keterangan}</p>
                <p className="text-[8px] text-slate-400 font-bold">{new Date(i.created_at).toLocaleDateString()}</p>
              </div>
              <p className={`text-sm font-black ${i.tipe === 'masuk' ? 'text-emerald-600' : 'text-rose-600'}`}>{i.tipe === 'masuk' ? '+' : '-'} {i.nominal.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* MODAL STRUK (PREVIEW) */}
      {showStruk && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-xs rounded-lg shadow-2xl p-6 font-mono text-slate-800 relative overflow-hidden">
            {/* Dekorasi Gunting Kertas Struk */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-white flex justify-between px-1">
               {[...Array(10)].map((_,i) => <div key={i} className="w-4 h-4 bg-black/80 rounded-full -mt-2"></div>)}
            </div>

            <div className="text-center border-b-2 border-dashed border-slate-300 pb-4 mb-4 mt-2">
              <img src="/kas_rw1.png" alt="Logo" className="h-10 mx-auto mb-2 grayscale" />
              <p className="text-sm font-bold">KAS ONLINE RW 02</p>
              <p className="text-[10px]">Kec. Cilengkrang, Kab. Bandung</p>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between"><span>TANGGAL:</span> <span>{date}</span></div>
              <div className="flex justify-between font-bold uppercase"><span>JENIS:</span> <span>{tipe}</span></div>
              <div className="flex justify-between uppercase"><span>UNTUK:</span> <span>{daftarBulan[month-1]} {year}</span></div>
              <div className="border-t border-dashed border-slate-300 pt-2 my-2">
                <p className="font-bold">KETERANGAN:</p>
                <p className="text-[12px] uppercase">{desc === 'Lainnya' ? customDesc : desc}</p>
              </div>
              <div className="flex justify-between text-lg font-black border-t-2 border-slate-900 pt-2">
                <span>TOTAL:</span>
                <span>Rp {parseInt(amount).toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 no-print">
              <button onClick={() => setShowStruk(false)} className="bg-slate-100 py-3 rounded-xl font-bold text-xs">BATAL</button>
              <button onClick={handleConfirmSave} className="bg-slate-900 text-white py-3 rounded-xl font-bold text-xs">KONFIRMASI</button>
            </div>
            
            <p className="text-center text-[8px] mt-6 opacity-30 italic">Terima kasih atas partisipasi Anda</p>
          </div>
        </div>
      )}

      {/* Nav Bawah */}
      <div className="fixed bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md h-20 rounded-[2rem] shadow-2xl flex items-center justify-around px-8">
        <button onClick={() => setTab('beranda')} className={`flex flex-col items-center ${tab === 'beranda' ? 'text-emerald-600' : 'text-slate-300'}`}>
          <span className="text-xl">🏠</span>
          <span className="text-[8px] font-black uppercase">Beranda</span>
        </button>
        <button onClick={() => setTab('laporan')} className={`flex flex-col items-center ${tab === 'laporan' ? 'text-emerald-600' : 'text-slate-300'}`}>
          <span className="text-xl">📊</span>
          <span className="text-[8px] font-black uppercase">Laporan</span>
        </button>
      </div>
    </div>
  );
}