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

  // State Input
  const [tipe, setTipe] = useState<'masuk' | 'keluar'>('masuk');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [desc, setDesc] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [amount, setAmount] = useState('');
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
      setFullName(session.user.user_metadata?.full_name || 'Warga');
    }
  };

  const fetchData = async () => {
    const { data } = await supabase.from('transaksi').select('*').order('created_at', { ascending: false });
    if (data) setList(data);
  };

  const handleConfirmAndPrint = async () => {
    const ket = desc === 'Lainnya' ? customDesc : desc;
    const { error } = await supabase.from('transaksi').insert([{ 
      keterangan: ket, nominal: parseInt(amount), tipe, created_at: new Date(date).toISOString() 
    }]);

    if (!error) {
      window.print(); // Membuka menu print browser (A4)
      setShowStruk(false);
      setDesc(''); setCustomDesc(''); setAmount(''); fetchData();
    }
  };

  const totalMasuk = list.filter(i => i.tipe === 'masuk').reduce((a, b) => a + b.nominal, 0);
  const totalKeluar = list.filter(i => i.tipe === 'keluar').reduce((a, b) => a + b.nominal, 0);

  if (!session) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6 no-print">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-sm">
        <form onSubmit={(e:any) => {
          e.preventDefault();
          const email = e.target.email.value;
          const password = e.target.password.value;
          if (isSignUp) {
            supabase.auth.signUp({ email, password, options: { data: { full_name: e.target.name.value } } }).then(() => alert("Cek email!"));
          } else {
            supabase.auth.signInWithPassword({ email, password }).then(({error}) => error && alert("Gagal!"));
          }
        }}>
          <div className="text-center mb-6">
            <img src="/kas_rw1.png" alt="Logo" className="h-16 mx-auto mb-4" />
            <h2 className="font-black text-xl uppercase italic">{isSignUp ? 'Daftar' : 'Login'} Kas RW 02</h2>
          </div>
          {isSignUp && <input name="name" required placeholder="Nama Lengkap" className="w-full mb-3 p-4 bg-slate-50 rounded-2xl outline-none" />}
          <input name="email" type="email" required placeholder="Email" className="w-full mb-3 p-4 bg-slate-50 rounded-2xl outline-none" />
          <input name="password" type="password" required placeholder="Password" className="w-full mb-6 p-4 bg-slate-50 rounded-2xl outline-none" />
          <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold uppercase">{isSignUp ? 'Daftar' : 'Masuk'}</button>
          <p className="text-center mt-4 text-xs font-bold text-emerald-600" onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? 'Sudah ada akun? Login' : 'Belum ada akun? Daftar'}
          </p>
        </form>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F8FAFC] pb-32">
      {/* Dashboard UI (Normal) */}
      <div className="no-print">
        <div className="p-6 flex justify-between items-center bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <img src="/kas_rw1.png" alt="Logo" className="h-10" />
            <div>
              <p className="text-[9px] font-black text-slate-400 leading-none">SELAMAT DATANG</p>
              <p className="text-sm font-black text-slate-800">{fullName}</p>
            </div>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="text-rose-500 font-bold">BYE</button>
        </div>

        {tab === 'beranda' ? (
          <div className="px-6 space-y-6 mt-6">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-center text-white">
              <p className="text-slate-400 text-[10px] font-black mb-1 uppercase tracking-widest">Saldo Kas RW 02</p>
              <h2 className="text-3xl font-black italic">Rp {(totalMasuk - totalKeluar).toLocaleString()}</h2>
            </div>

            {role === 'admin' && (
              <div className="bg-white p-6 rounded-[2.5rem] shadow-xl space-y-4">
                <select value={tipe} onChange={(e:any) => setTipe(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none">
                  <option value="masuk">🟢 PEMASUKAN</option>
                  <option value="keluar">🔴 PENGELUARAN</option>
                </select>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none" />
                <select value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none">
                  <option value="">-- Pilih Keterangan --</option>
                  {tipe === 'masuk' ? opsiMasuk.map(o => <option key={o} value={o}>{o}</option>) : opsiKeluar.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {desc === 'Lainnya' && <input value={customDesc} onChange={(e) => setCustomDesc(e.target.value)} placeholder="Manual..." className="w-full p-4 bg-slate-50 rounded-2xl text-xs outline-none" />}
                <div className="grid grid-cols-2 gap-2">
                  <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="p-3 bg-slate-50 rounded-xl text-[10px] font-bold outline-none">
                    {daftarBulan.map((b, i) => <option key={b} value={i+1}>{b}</option>)}
                  </select>
                  <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="p-3 bg-slate-50 rounded-xl text-[10px] font-bold outline-none">
                    <option value={2025}>2025</option><option value={2026}>2026</option>
                  </select>
                </div>
                <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="Nominal Rp" className="w-full p-5 bg-slate-100 rounded-[1.5rem] font-black text-2xl text-center" />
                <button onClick={() => setShowStruk(true)} className="w-full bg-emerald-600 text-white py-5 rounded-[1.5rem] font-black text-xs">SIMPAN & CETAK</button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6">
            <h3 className="font-black italic mb-4">Riwayat Kas</h3>
            {list.map(i => (
              <div key={i.id} className="bg-white p-4 rounded-2xl mb-2 flex justify-between items-center shadow-sm">
                <div><p className="text-[10px] font-black uppercase">{i.keterangan}</p><p className="text-[8px] text-slate-400">{new Date(i.created_at).toLocaleDateString()}</p></div>
                <p className={`font-black ${i.tipe === 'masuk' ? 'text-emerald-600' : 'text-rose-600'}`}>Rp {i.nominal.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}

        {/* Nav Bar */}
        <div className="fixed bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md h-20 rounded-[2rem] shadow-2xl flex items-center justify-around">
          <button onClick={() => setTab('beranda')} className={`flex flex-col items-center ${tab === 'beranda' ? 'text-emerald-600' : 'text-slate-300'}`}>🏠<span className="text-[8px] font-black">HOME</span></button>
          <button onClick={() => setTab('laporan')} className={`flex flex-col items-center ${tab === 'laporan' ? 'text-emerald-600' : 'text-slate-300'}`}>📊<span className="text-[8px] font-black">LAPORAN</span></button>
        </div>
      </div>

      {/* MODAL STRUK A4 (Hanya Muncul saat Print) */}
      {showStruk && (
        <div className="fixed inset-0 bg-white z-[999] p-12 font-serif text-slate-900 flex flex-col items-stretch print-page">
          <div className="text-center border-b-4 border-double border-slate-800 pb-6 mb-8">
            <h1 className="text-4xl font-black mb-1">KAS ONLINE RW 02</h1>
            <p className="text-sm uppercase tracking-widest">Kecamatan Cilengkrang, Kabupaten Bandung, Jawa Barat</p>
          </div>
          
          <div className="space-y-6 text-xl">
            <div className="flex justify-between border-b border-dashed border-slate-300 pb-2"><span>TANGGAL:</span> <span className="font-bold">{date}</span></div>
            <div className="flex justify-between border-b border-dashed border-slate-300 pb-2"><span>JENIS TRANSAKSI:</span> <span className="font-bold uppercase text-emerald-700">{tipe}</span></div>
            <div className="flex justify-between border-b border-dashed border-slate-300 pb-2"><span>PERIODE:</span> <span className="font-bold">{daftarBulan[month-1]} {year}</span></div>
            <div className="mt-8 border-l-4 border-slate-800 pl-4">
              <p className="text-sm font-bold text-slate-400 mb-1">KETERANGAN:</p>
              <p className="text-2xl font-bold uppercase">{desc === 'Lainnya' ? customDesc : desc}</p>
            </div>
            <div className="mt-12 bg-slate-100 p-8 rounded-xl flex justify-between items-center">
              <span className="text-2xl font-bold">TOTAL NOMINAL:</span>
              <span className="text-4xl font-black italic">Rp {parseInt(amount).toLocaleString()}</span>
            </div>
          </div>

          <div className="mt-24 grid grid-cols-2 gap-20 text-center">
            <div><p className="mb-24">Penyetor/Penerima</p><div className="border-t border-slate-900"></div></div>
            <div><p className="mb-24">Bendahara RW 02</p><div className="border-t border-slate-900"></div></div>
          </div>

          <div className="mt-auto text-center text-[10px] text-slate-400 border-t pt-4 no-print-helper">
            Bukti sah transaksi digital KAS RW 02 - Dicetak pada {new Date().toLocaleString()}
          </div>

          <div className="fixed bottom-10 left-10 right-10 flex gap-4 no-print">
             <button onClick={() => setShowStruk(false)} className="flex-1 bg-slate-200 py-4 rounded-2xl font-bold uppercase">Batal</button>
             <button onClick={handleConfirmAndPrint} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold uppercase">Konfirmasi & Cetak</button>
          </div>
        </div>
      )}

      {/* CSS Tambahan untuk Print A4 */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-page, .print-page * { visibility: visible; }
          .print-page { position: absolute; left: 0; top: 0; width: 100%; height: 100%; margin: 0; padding: 40px; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}