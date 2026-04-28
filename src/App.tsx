import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [list, setList] = useState<any[]>([]);
  const [tab, setTab] = useState<'beranda' | 'laporan'>('beranda');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');

  // State Input Data
  const [tipe, setTipe] = useState<'masuk' | 'keluar'>('masuk');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [desc, setDesc] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [amount, setAmount] = useState('');
  
  // State Cetak/Struk
  const [showStruk, setShowStruk] = useState(false);

  const opsiMasuk = ["Iuran RT 001", "Iuran RT 002", "Iuran RT 003", "Iuran RT 004", "Iuran RT 005", "Iuran RT 006", "Iuran RT 007", "SAB Almanar", "Lainnya"];
  const opsiKeluar = ["Insentif Linmas", "UPT", "WATESA", "POSYANDU", "Lainnya"];
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
      // MEMBACA ROLE DARI METADATA SUPABASE
      const userRole = session.user.user_metadata?.role;
      if (userRole === 'admin') {
        setRole('admin');
      } else {
        setRole('user');
      }
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
    const ket = desc === 'Lainnya' ? customDesc : desc;
    if (!amount) return alert("Isi nominal!");

    const { error } = await supabase.from('transaksi').insert([{ 
      keterangan: ket, 
      nominal: parseInt(amount), 
      tipe,
      created_at: new Date(date).toISOString() 
    }]);

    if (!error) {
      window.print(); // Membuka menu cetak A4
      setShowStruk(false);
      setDesc(''); setCustomDesc(''); setAmount(''); fetchData();
    } else {
      alert("Gagal simpan: " + error.message);
    }
  };

  const totalMasuk = list.filter(i => i.tipe === 'masuk').reduce((a, b) => a + b.nominal, 0);
  const totalKeluar = list.filter(i => i.tipe === 'keluar').reduce((a, b) => a + b.nominal, 0);

  // 1. TAMPILAN LOGIN / DAFTAR
  if (!session) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6 no-print">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-sm">
        <form onSubmit={handleAuthAction}>
          <div className="text-center mb-8">
            <img src="/kas_rw1.png" alt="Logo" className="h-20 mx-auto mb-4 object-contain" />
            <h2 className="font-black text-xl tracking-tighter uppercase">{isSignUp ? 'Buat Akun Warga' : 'Login Kas RW 02'}</h2>
          </div>
          {isSignUp && <input name="name" required placeholder="Nama Lengkap" className="w-full mb-3 p-4 bg-slate-50 rounded-2xl outline-none text-sm" />}
          <input name="email" type="email" required placeholder="Email" className="w-full mb-3 p-4 bg-slate-50 rounded-2xl outline-none text-sm" />
          <input name="password" type="password" required placeholder="Password" className="w-full mb-6 p-4 bg-slate-50 rounded-2xl outline-none text-sm" />
          <button disabled={loading} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-lg">
            {loading ? 'MEMPROSES...' : isSignUp ? 'DAFTAR' : 'MASUK'}
          </button>
          <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="w-full mt-4 text-[11px] font-bold text-emerald-600 uppercase">
            {isSignUp ? 'Sudah punya akun? Login' : 'Belum punya akun? Daftar'}
          </button>
        </form>
      </div>
    </div>
  );

  // 2. TAMPILAN DASHBOARD UTAMA
  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F8FAFC] font-sans pb-32">
      
      {/* Header (Sembunyi saat print) */}
      <div className="p-6 flex justify-between items-center bg-white shadow-sm sticky top-0 z-50 no-print">
        <div className="flex items-center gap-3">
          <img src="/kas_rw1.png" alt="Logo" className="h-10" />
          <div>
            <p className="text-[10px] font-black text-slate-400 leading-none uppercase tracking-tighter">Selamat Datang</p>
            <p className="text-sm font-black text-slate-800 leading-none mt-1">{fullName}</p>
          </div>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="bg-rose-50 text-rose-500 p-2 rounded-xl">🚪</button>
      </div>

      <div className="no-print">
        {tab === 'beranda' ? (
          <div className="px-6 space-y-6 mt-6">
            <div className="bg-[#1E293B] p-8 rounded-[2.5rem] shadow-2xl text-center text-white">
               <p className="text-slate-400 text-[10px] font-black uppercase mb-2">Total Saldo RW 02</p>
               <h2 className="text-3xl font-black italic">Rp {(totalMasuk - totalKeluar).toLocaleString()}</h2>
            </div>

            {/* PANEL KHUSUS ADMIN */}
            {role === 'admin' && (
              <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-50 space-y-4">
                <h3 className="text-center font-black text-[10px] text-slate-400 tracking-widest uppercase italic">Form Input Data Kas</h3>
                
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 ml-2 uppercase">Jenis Input</label>
                  <select value={tipe} onChange={(e:any) => setTipe(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none">
                    <option value="masuk">🟢 PEMASUKAN</option>
                    <option value="keluar">🔴 PENGELUARAN</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 ml-2 uppercase">Tanggal Transaksi</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 ml-2 uppercase">Keterangan / Sumber</label>
                  <select value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none">
                    <option value="">-- Pilih --</option>
                    {tipe === 'masuk' ? opsiMasuk.map(o => <option key={o} value={o}>{o}</option>) : opsiKeluar.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                {desc === 'Lainnya' && <input value={customDesc} onChange={(e) => setCustomDesc(e.target.value)} placeholder="Ketik Manual..." className="w-full p-4 bg-slate-50 rounded-2xl text-xs outline-none border border-emerald-200" />}

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 ml-2 uppercase">Bulan</label>
                    <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none">
                      {daftarBulan.map((b, i) => <option key={b} value={i+1}>{b}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 ml-2 uppercase">Tahun</label>
                    <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold outline-none">
                      <option value={2025}>2025</option><option value={2026}>2026</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 ml-2 uppercase">Nominal Rp</label>
                  <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="Contoh: 50000" className="w-full p-5 bg-slate-100 rounded-3xl font-black text-2xl outline-none text-center italic" />
                </div>

                <button onClick={() => setShowStruk(true)} className="w-full bg-emerald-600 text-white py-5 rounded-3xl font-black text-xs shadow-lg shadow-emerald-100 active:scale-95 transition-all">SIMPAN & CETAK A4</button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 space-y-3">
            <h3 className="font-black text-lg italic mb-4">Laporan Riwayat Kas</h3>
            {list.map(i => (
              <div key={i.id} className="bg-white p-5 rounded-[2rem] shadow-sm flex justify-between items-center border border-slate-50">
                <div>
                  <p className="text-[11px] font-black uppercase leading-none mb-1 tracking-tighter">{i.keterangan}</p>
                  <p className="text-[8px] text-slate-400 font-bold uppercase">{new Date(i.created_at).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}</p>
                </div>
                <p className={`text-sm font-black italic ${i.tipe === 'masuk' ? 'text-emerald-600' : 'text-rose-600'}`}>{i.tipe === 'masuk' ? '+' : '-'} {i.nominal.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. MODAL BUKTI TRANSAKSI (A4 SIZE) */}
      {showStruk && (
        <div className="fixed inset-0 bg-white z-[999] p-12 font-serif text-slate-900 flex flex-col items-stretch print-page">
          <div className="text-center border-b-4 border-double border-slate-800 pb-6 mb-8">
            <h1 className="text-4xl font-black mb-1">KAS ONLINE RW 02</h1>
            <p className="text-sm uppercase tracking-widest">Jamaras 2 , kelurahan jatihandap kec.Mandalajati</p>
          </div>
          
          <div className="space-y-6 text-xl">
            <div className="flex justify-between border-b border-dashed border-slate-300 pb-2"><span>TANGGAL:</span> <span className="font-bold">{date}</span></div>
            <div className="flex justify-between border-b border-dashed border-slate-300 pb-2"><span>JENIS TRANSAKSI:</span> <span className="font-bold uppercase text-emerald-700">{tipe}</span></div>
            <div className="flex justify-between border-b border-dashed border-slate-300 pb-2"><span>PERIODE BULAN:</span> <span className="font-bold">{daftarBulan[month-1]} {year}</span></div>
            <div className="mt-8 border-l-4 border-slate-800 pl-4">
              <p className="text-sm font-bold text-slate-400 mb-1">KETERANGAN:</p>
              <p className="text-2xl font-bold uppercase">{desc === 'Lainnya' ? customDesc : desc}</p>
            </div>
            <div className="mt-12 bg-slate-50 p-10 rounded-xl flex justify-between items-center border-2 border-slate-200">
              <span className="text-2xl font-bold">TOTAL NOMINAL:</span>
              <span className="text-4xl font-black italic">Rp {parseInt(amount).toLocaleString()}</span>
            </div>
          </div>

          <div className="mt-32 grid grid-cols-2 gap-20 text-center">
            <div><p className="mb-24">Penyetor/Penerima</p><div className="border-t border-slate-900"></div></div>
            <div><p className="mb-24">Bendahara RW 02</p><div className="border-t border-slate-900"></div></div>
          </div>

          <div className="mt-auto text-center text-[10px] text-slate-400 pt-4">
            Dokumen ini dicetak melalui Sistem Digital Kas RW 02 pada {new Date().toLocaleString()}
          </div>

          <div className="fixed bottom-10 left-10 right-10 flex gap-4 no-print">
             <button onClick={() => setShowStruk(false)} className="flex-1 bg-slate-200 py-4 rounded-2xl font-bold uppercase shadow-lg">Batal</button>
             <button onClick={handleConfirmAndPrint} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold uppercase shadow-lg">Konfirmasi & Cetak</button>
          </div>
        </div>
      )}

      {/* Nav Bawah (Sembunyi saat print) */}
      <div className="fixed bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md h-20 rounded-[2.5rem] shadow-2xl flex items-center justify-around no-print">
        <button onClick={() => setTab('beranda')} className={`flex flex-col items-center ${tab === 'beranda' ? 'text-emerald-600' : 'text-slate-300'}`}>
          <span className="text-xl">🏠</span><span className="text-[8px] font-black uppercase">Beranda</span>
        </button>
        <button onClick={() => setTab('laporan')} className={`flex flex-col items-center ${tab === 'laporan' ? 'text-emerald-600' : 'text-slate-300'}`}>
          <span className="text-xl">📊</span><span className="text-[8px] font-black uppercase">Laporan</span>
        </button>
      </div>

      {/* CSS KHUSUS PRINT A4 */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-page, .print-page * { visibility: visible; }
          .print-page { position: absolute; left: 0; top: 0; width: 100%; height: 100%; margin: 0; padding: 50px; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}