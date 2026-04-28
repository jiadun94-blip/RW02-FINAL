import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [list, setList] = useState<any[]>([]);
  const [tab, setTab] = useState<'beranda' | 'laporan'>('beranda');
  const [fullName, setFullName] = useState('');
  
  // State Modal Input & Struk
  const [showModal, setShowModal] = useState(false);
  const [showStruk, setShowStruk] = useState(false);
  
  // State Data Transaksi
  const [tipe, setTipe] = useState<'masuk' | 'keluar'>('masuk');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [penerima, setPenerima] = useState('');

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
      setFullName(session.user.user_metadata?.full_name || 'Bendahara RW');
    }
  };

  const fetchData = async () => {
    const { data } = await supabase.from('transaksi').select('*').order('created_at', { ascending: false });
    if (data) setList(data);
  };

  // Fungsi Simpan ke Database & Print
  const handleConfirmAndPrint = async () => {
    if (!amount || !desc) return alert("Data belum lengkap!");

    const { error } = await supabase.from('transaksi').insert([{ 
      keterangan: `${desc} (Penerima: ${penerima})`, 
      nominal: parseInt(amount), 
      tipe,
      created_at: new Date(date).toISOString() 
    }]);

    if (!error) {
      window.print(); // Jalankan Print A4
      setShowStruk(false);
      setAmount(''); setDesc(''); setPenerima('');
      fetchData();
    } else {
      alert("Gagal simpan: " + error.message);
    }
  };

  const totalMasuk = list.filter(i => i.tipe === 'masuk').reduce((a, b) => a + b.nominal, 0);
  const totalKeluar = list.filter(i => i.tipe === 'keluar').reduce((a, b) => a + b.nominal, 0);
  const saldo = totalMasuk - totalKeluar;

  if (!session) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6 font-sans">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-sm text-center">
        <img src="/kas_rw1.png" alt="Logo" className="h-20 mx-auto mb-6" />
        <h2 className="font-black text-xl mb-6 uppercase italic">Kas RW 02 Online</h2>
        <p className="text-slate-500 text-sm mb-8">Silakan Login di PC/Laptop untuk akses penuh.</p>
        <button onClick={() => window.location.reload()} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold uppercase tracking-widest shadow-lg">Refresh Login</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-32 overflow-x-hidden">
      
      {/* HEADER UTAMA */}
      <div className="p-6 bg-white flex justify-between items-center shadow-sm sticky top-0 z-40 no-print">
        <div className="flex items-center gap-3">
          <div className="p-1 bg-slate-100 rounded-full">
            <img src="/kas_rw1.png" alt="Logo" className="h-10 w-10 object-contain" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 leading-none uppercase">Aplikasi Kas RW</p>
            <p className="text-lg font-black text-slate-800 tracking-tight">{fullName}</p>
          </div>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="bg-rose-50 text-rose-500 w-10 h-10 rounded-xl flex items-center justify-center font-bold">BYE</button>
      </div>

      <div className="no-print p-5 max-w-md mx-auto space-y-6">
        
        {/* CARD SALDO MODERN */}
        <div className="bg-[#1E293B] p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 italic">Saldo Kas Jamaras RW 02</p>
            <h2 className="text-4xl font-black italic tracking-tighter">Rp {saldo.toLocaleString()}</h2>
            
            <div className="mt-8 flex gap-3">
              <div className="bg-emerald-500/20 border border-emerald-500/30 p-3 rounded-2xl flex-1">
                <p className="text-[9px] font-black uppercase text-emerald-400">Masuk</p>
                <p className="font-bold text-xs italic">Rp {totalMasuk.toLocaleString()}</p>
              </div>
              <div className="bg-rose-500/20 border border-rose-500/30 p-3 rounded-2xl flex-1">
                <p className="text-[9px] font-black uppercase text-rose-400">Keluar</p>
                <p className="font-bold text-xs italic">Rp {totalKeluar.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>
        </div>

        {/* TOMBOL ACTION POPUP */}
        {role === 'admin' && (
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => { setTipe('masuk'); setShowModal(true); }}
              className="bg-emerald-600 text-white p-5 rounded-[2rem] font-black shadow-xl shadow-emerald-100 active:scale-95 transition-all uppercase text-xs"
            >
              + Kas Masuk
            </button>
            <button 
              onClick={() => { setTipe('keluar'); setShowModal(true); }}
              className="bg-rose-600 text-white p-5 rounded-[2rem] font-black shadow-xl shadow-rose-100 active:scale-95 transition-all uppercase text-xs"
            >
              - Kas Keluar
            </button>
          </div>
        )}

        {/* RIWAYAT TERAKHIR */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
           <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 italic uppercase text-xs tracking-widest">
             <span className="text-blue-500 font-bold">●</span> Riwayat Terbaru
           </h3>
           <div className="space-y-5">
             {list.slice(0, 8).map(item => (
               <div key={item.id} className="flex justify-between items-center border-b border-slate-50 pb-4">
                 <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm ${item.tipe === 'masuk' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {item.tipe === 'masuk' ? '↓' : '↑'}
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase text-slate-700 leading-tight tracking-tighter">{item.keterangan}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{new Date(item.created_at).toLocaleDateString('id-ID', {day:'numeric', month:'short'})}</p>
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

      {/* FORM INPUT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-4 no-print">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom-20 duration-300">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
              <h3 className={`font-black text-xl uppercase italic ${tipe === 'masuk' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {tipe === 'masuk' ? '✦ Input Masuk' : '✦ Input Keluar'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-300 text-3xl font-bold">&times;</button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Tanggal</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-slate-900" />
              </div>
              
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Jumlah Nominal (Rp)</label>
                <input type="number" placeholder="Nominal..." value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-4 bg-slate-100 rounded-2xl font-black text-2xl text-center outline-none border-2 border-transparent focus:border-slate-900" />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Keterangan Barang/Tujuan</label>
                <textarea rows={2} placeholder="Input keterangan manual..." value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-slate-900 resize-none"></textarea>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Penerima / Penyetor</label>
                <input type="text" placeholder="Nama..." value={penerima} onChange={(e) => setPenerima(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-slate-900" />
              </div>

              <button onClick={() => { setShowModal(false); setShowStruk(true); }} className={`w-full py-5 rounded-2xl font-black text-white shadow-xl mt-4 uppercase italic tracking-widest ${tipe === 'masuk' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                Cek Bukti Cetak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STRUK A4 FULL PAGE */}
      {showStruk && (
        <div className="fixed inset-0 bg-white z-[999] p-10 font-sans text-slate-900 flex flex-col items-center print-page overflow-y-auto">
          <div className="w-full max-w-[800px] border-[4px] border-slate-900 p-12 min-h-[1050px] flex flex-col shadow-2xl relative">
            
            {/* Header Resmi */}
            <div className="flex flex-col items-center border-b-[6px] border-double border-slate-900 pb-10 mb-10 text-center">
              <img src="/kas_rw1.png" alt="Logo" className="h-32 mb-6" />
              <h1 className="text-6xl font-black tracking-tighter uppercase mb-2">Kas Online RW 02</h1>
              <p className="text-2xl font-black tracking-[0.4em] text-slate-600 italic">JAMARAS ISTIMEWA</p>
              <p className="text-base uppercase mt-3 font-bold tracking-widest">Kecamatan Cilengkrang, Kabupaten Bandung, Jawa Barat</p>
            </div>

            {/* No & Tgl */}
            <div className="flex justify-between border-b-2 border-slate-900 pb-3 mb-12 px-2 font-black text-2xl italic">
              <span>NO: RW02-{Math.floor(100000 + Math.random() * 900000)}</span>
              <span>TGL: {new Date(date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</span>
            </div>

            {/* Isi Konten Penuh */}
            <div className="flex-grow space-y-12">
              <div className="border-b-4 border-dashed border-slate-100 pb-6">
                <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Kategori Transaksi</p>
                <p className={`text-5xl font-black uppercase italic ${tipe === 'masuk' ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {tipe === 'masuk' ? 'Kas Pemasukan (CR)' : 'Kas Pengeluaran (DB)'}
                </p>
              </div>

              <div className="border-b-4 border-dashed border-slate-100 pb-6">
                <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Deskripsi Keterangan</p>
                <p className="text-4xl font-black uppercase leading-tight text-slate-800">{desc}</p>
              </div>

              <div className="border-b-4 border-dashed border-slate-100 pb-6">
                <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Penerima / Penyetor Dana</p>
                <p className="text-4xl font-black uppercase text-slate-800">{penerima || "Umum"}</p>
              </div>
            </div>

            {/* Total Grand */}
            <div className="mt-12">
              <div className="flex justify-between items-end border-t-[6px] border-slate-900 pt-8">
                <span className="text-5xl font-black italic tracking-tighter">GRAND TOTAL</span>
                <span className="text-8xl font-black tracking-tighter">Rp {parseInt(amount).toLocaleString()}</span>
              </div>
              <div className="border-b-[6px] border-double border-slate-900 mt-6"></div>
            </div>

            {/* TTD GEDE */}
            <div className="mt-32 grid grid-cols-2 gap-40 text-center">
              <div>
                <p className="text-2xl font-black mb-40 uppercase tracking-widest italic">Pihak Pertama,</p>
                <div className="border-t-4 border-slate-900 mx-8"></div>
                <p className="mt-4 font-black text-xl">( {penerima || "..............."} )</p>
              </div>
              <div>
                <p className="text-2xl font-black mb-40 uppercase tracking-widest italic">Bendahara RW 02,</p>
                <div className="border-t-4 border-slate-900 mx-8"></div>
                <p className="mt-4 font-black text-xl italic">{fullName}</p>
              </div>
            </div>

            <div className="mt-auto pt-16 text-center text-xs font-black text-slate-300 uppercase tracking-[0.5em]">
              *** Dokumen Sah Tercatat Secara Digital ***
            </div>
          </div>

          {/* Tombol melayang di struk (tidak ikut print) */}
          <div className="mt-12 flex gap-8 no-print w-full max-w-[800px]">
             <button onClick={() => setShowStruk(false)} className="flex-1 bg-slate-100 text-slate-400 py-6 rounded-[2rem] font-black text-2xl uppercase tracking-widest shadow-xl">Batal</button>
             <button onClick={handleConfirmAndPrint} className="flex-1 bg-slate-900 text-white py-6 rounded-[2rem] font-black text-2xl uppercase tracking-widest shadow-2xl shadow-slate-300 active:scale-95 transition-all">Konfirmasi & Cetak A4</button>
          </div>
        </div>
      )}

      {/* NAV BAWAH */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 h-24 flex justify-around items-center px-10 z-50 no-print">
        <button onClick={() => setTab('beranda')} className={`flex flex-col items-center gap-2 transition-all ${tab === 'beranda' ? 'scale-125 text-slate-900' : 'text-slate-300'}`}>
          <span className="text-3xl font-bold leading-none">🏠</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Utama</span>
        </button>
        <button onClick={() => setTab('laporan')} className={`flex flex-col items-center gap-2 transition-all ${tab === 'laporan' ? 'scale-125 text-slate-900' : 'text-slate-300'}`}>
          <span className="text-3xl font-bold leading-none">📊</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Laporan</span>
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