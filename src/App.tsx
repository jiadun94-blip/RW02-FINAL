import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [list, setList] = useState<any[]>([]);
  const [tab, setTab] = useState<'beranda' | 'laporan'>('beranda');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  // State Modal & Data
  const [showModal, setShowModal] = useState(false);
  const [showStruk, setShowStruk] = useState(false);
  const [tipe, setTipe] = useState<'masuk' | 'keluar'>('masuk');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [penerima, setPenerima] = useState('');

  const daftarBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => handleAuthChange(session));
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => handleAuthChange(session));
    fetchData();
    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleAuthChange = (session: any) => {
    setSession(session);
    if (session) {
      const userRole = session.user.user_metadata?.role;
      setRole(userRole === 'admin' ? 'admin' : 'user');
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

    if (isSignUp) {
      const name = e.target.name.value;
      const { error } = await supabase.auth.signUp({
        email, password, options: { data: { full_name: name, role: 'user' } }
      });
      if (error) alert(error.message); else alert("Daftar berhasil! Silakan login.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert("Email atau Password Salah!");
    }
    setLoading(false);
  };

  const handleConfirmAndPrint = async () => {
    if (!amount || !desc) return alert("Mohon isi semua data!");
    const { error } = await supabase.from('transaksi').insert([{ 
      keterangan: `${desc} (Penerima: ${penerima})`, 
      nominal: parseInt(amount), 
      tipe,
      created_at: new Date(date).toISOString() 
    }]);
    if (!error) {
      window.print();
      setShowStruk(false); setAmount(''); setDesc(''); setPenerima(''); fetchData();
    }
  };

  const totalMasuk = list.filter(i => i.tipe === 'masuk').reduce((a, b) => a + b.nominal, 0);
  const totalKeluar = list.filter(i => i.tipe === 'keluar').reduce((a, b) => a + b.nominal, 0);

  // 1. TAMPILAN LOGIN (PERBAIKAN: BISA DI HP)
  if (!session) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A] p-6 font-sans">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-sm text-center">
        <form onSubmit={handleAuthAction} className="space-y-6">
          <img src="/kas_rw1.png" alt="Logo" className="h-24 mx-auto mb-4" />
          <h2 className="font-black text-2xl tracking-tighter uppercase italic">{isSignUp ? 'Buat Akun' : 'Login Kas RW 02'}</h2>
          {isSignUp && <input name="name" required placeholder="Nama Lengkap" className="w-full p-4 bg-slate-100 rounded-2xl outline-none font-bold" />}
          <input name="email" type="email" required placeholder="Email" className="w-full p-4 bg-slate-100 rounded-2xl outline-none font-bold" />
          <input name="password" type="password" required placeholder="Password" className="w-full p-4 bg-slate-100 rounded-2xl outline-none font-bold" />
          <button disabled={loading} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black shadow-xl tracking-widest uppercase">
            {loading ? 'Proses...' : isSignUp ? 'Daftar' : 'Masuk'}
          </button>
          <p onClick={() => setIsSignUp(!isSignUp)} className="text-xs font-black text-slate-400 uppercase tracking-widest cursor-pointer">
            {isSignUp ? 'Sudah punya akun? Login' : 'Belum punya akun? Daftar'}
          </p>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-32 overflow-x-hidden">
      
      {/* HEADER */}
      <div className="p-6 bg-white flex justify-between items-center shadow-sm sticky top-0 z-40 no-print">
        <div className="flex items-center gap-3">
          <img src="/kas_rw1.png" alt="Logo" className="h-10 w-10" />
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Aplikasi Kas</p>
            <p className="text-lg font-black text-slate-800 tracking-tight">{fullName}</p>
          </div>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="bg-rose-50 text-rose-500 p-2 rounded-xl text-xl">🚪</button>
      </div>

      <div className="no-print p-5 max-w-md mx-auto space-y-6">
        {/* CARD SALDO */}
        <div className="bg-[#1E293B] p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Total Saldo RW 02</p>
          <h2 className="text-4xl font-black italic tracking-tighter">Rp {(totalMasuk - totalKeluar).toLocaleString()}</h2>
          <div className="mt-8 flex gap-3">
            <div className="bg-white/5 p-3 rounded-2xl flex-1 border border-white/10">
              <p className="text-[9px] font-black text-emerald-400 uppercase">Masuk</p>
              <p className="font-bold text-xs italic">Rp {totalMasuk.toLocaleString()}</p>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl flex-1 border border-white/10">
              <p className="text-[9px] font-black text-rose-400 uppercase">Keluar</p>
              <p className="font-bold text-xs italic">Rp {totalKeluar.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* ADMIN ACTION */}
        {role === 'admin' && (
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => { setTipe('masuk'); setShowModal(true); }} className="bg-emerald-600 text-white p-5 rounded-[2rem] font-black shadow-xl uppercase text-xs">+ Kas Masuk</button>
            <button onClick={() => { setTipe('keluar'); setShowModal(true); }} className="bg-rose-600 text-white p-5 rounded-[2rem] font-black shadow-xl uppercase text-xs">- Kas Keluar</button>
          </div>
        )}

        {/* LIST TRANSAKSI */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
           <h3 className="font-black text-slate-800 mb-6 italic uppercase text-xs tracking-widest leading-none flex items-center gap-2">
             <span className="w-2 h-2 bg-blue-500 rounded-full"></span> Transaksi Terbaru
           </h3>
           <div className="space-y-5">
             {list.slice(0, 8).map(item => (
               <div key={item.id} className="flex justify-between items-center border-b border-slate-50 pb-4 last:border-0">
                 <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${item.tipe === 'masuk' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {item.tipe === 'masuk' ? '↙' : '↗'}
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase text-slate-700 leading-tight tracking-tighter">{item.keterangan}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{new Date(item.created_at).toLocaleDateString('id-ID')}</p>
                    </div>
                 </div>
                 <p className={`font-black italic text-sm ${item.tipe === 'masuk' ? 'text-emerald-600' : 'text-rose-600'}`}>
                   Rp {item.nominal.toLocaleString()}
                 </p>
               </div>
             ))}
           </div>
        </div>
      </div>

      {/* POPUP FORM */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-4 no-print">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className={`font-black text-xl uppercase italic ${tipe === 'masuk' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {tipe === 'masuk' ? 'Input Pemasukan' : 'Input Pengeluaran'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-300 text-3xl font-bold">&times;</button>
            </div>
            <div className="space-y-5 font-bold">
              <div><label className="text-[10px] text-slate-400 uppercase tracking-widest">Tanggal</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl outline-none" /></div>
              <div><label className="text-[10px] text-slate-400 uppercase tracking-widest">Nominal (Rp)</label><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-xl outline-none" /></div>
              <div><label className="text-[10px] text-slate-400 uppercase tracking-widest">Keterangan</label><textarea rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-sm outline-none resize-none"></textarea></div>
              <div><label className="text-[10px] text-slate-400 uppercase tracking-widest">Penerima/Penyetor</label><input type="text" value={penerima} onChange={(e) => setPenerima(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-sm outline-none" /></div>
              <button onClick={() => { setShowModal(false); setShowStruk(true); }} className={`w-full py-5 rounded-2xl font-black text-white shadow-xl mt-4 uppercase ${tipe === 'masuk' ? 'bg-emerald-600' : 'bg-rose-600'}`}>Cek & Print</button>
            </div>
          </div>
        </div>
      )}

      {/* STRUK A4 (TEKS TERSTRUKTUR RAPI) */}
      {showStruk && (
        <div className="fixed inset-0 bg-white z-[999] p-16 font-mono text-slate-950 flex flex-col items-center print-page overflow-y-auto">
          <div className="w-full max-w-[850px] border-4 border-slate-950 p-12 min-h-[1100px] flex flex-col relative">
            <div className="text-center border-b-8 border-double border-slate-950 pb-10 mb-12">
              <h1 className="text-5xl font-black mb-2">BUKTI KAS RW 02</h1>
              <p className="text-2xl font-bold tracking-[0.3em] uppercase">Jamaras Istimewa - Cilengkrang</p>
            </div>
            <div className="flex-grow space-y-12 text-2xl">
              <div className="grid grid-cols-2 gap-10 border-b border-dashed border-slate-200 pb-8">
                <div><span className="text-sm font-bold text-slate-400 block mb-2 uppercase">Tanggal Transaksi</span><p className="font-black">{new Date(date).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</p></div>
                <div><span className="text-sm font-bold text-slate-400 block mb-2 uppercase">Kategori</span><p className={`font-black italic uppercase ${tipe === 'masuk' ? 'text-green-800' : 'text-red-800'}`}>Kas {tipe}</p></div>
              </div>
              <div className="border-b border-dashed border-slate-200 pb-8"><span className="text-sm font-bold text-slate-400 block mb-2 uppercase">Deskripsi Keterangan</span><p className="font-black text-4xl uppercase">{desc}</p></div>
              <div className="border-b border-dashed border-slate-200 pb-8"><span className="text-sm font-bold text-slate-400 block mb-2 uppercase">Pihak Penerima/Penyetor</span><p className="font-black text-4xl uppercase">{penerima || "-"}</p></div>
              <div className="mt-16 bg-slate-50 p-12 rounded-3xl flex justify-between items-center border-4 border-slate-100">
                <span className="text-3xl font-black italic">TOTAL GRAND:</span>
                <span className="text-7xl font-black italic tracking-tighter">Rp {parseInt(amount).toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-40 grid grid-cols-2 gap-40 text-center font-bold">
              <div><p className="mb-40 uppercase">Penyetor/Penerima,</p><div className="border-t-4 border-slate-950 mx-10"></div><p className="mt-4">( {penerima || "..............."} )</p></div>
              <div><p className="mb-40 uppercase">Bendahara RW 02,</p><div className="border-t-4 border-slate-950 mx-10"></div><p className="mt-4 italic">{fullName}</p></div>
            </div>
          </div>
          <div className="mt-12 flex gap-8 no-print w-full max-w-[850px]">
             <button onClick={() => setShowStruk(false)} className="flex-1 bg-slate-100 py-6 rounded-3xl font-black text-xl uppercase italic">Batal</button>
             <button onClick={handleConfirmAndPrint} className="flex-1 bg-slate-950 text-white py-6 rounded-3xl font-black text-xl uppercase italic">Konfirmasi & Cetak A4</button>
          </div>
        </div>
      )}

      {/* NAV BAWAH */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 h-24 flex justify-around items-center px-10 z-50 no-print">
        <button onClick={() => setTab('beranda')} className={`flex flex-col items-center gap-2 ${tab === 'beranda' ? 'text-slate-900 scale-110' : 'text-slate-300'}`}>
          <span className="text-2xl">🏠</span><span className="text-[9px] font-black uppercase tracking-widest">Utama</span>
        </button>
        <button onClick={() => setTab('laporan')} className={`flex flex-col items-center gap-2 ${tab === 'laporan' ? 'text-slate-900 scale-110' : 'text-slate-300'}`}>
          <span className="text-2xl">📊</span><span className="text-[9px] font-black uppercase tracking-widest">Laporan</span>
        </button>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; -webkit-font-smoothing: antialiased; }
        @media print {
          body * { visibility: hidden; }
          .print-page, .print-page * { visibility: visible; }
          .print-page { position: absolute; left: 0; top: 0; width: 100%; height: 100%; margin: 0; padding: 0; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}