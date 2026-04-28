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
  
  const [showModal, setShowModal] = useState(false);
  const [showStruk, setShowStruk] = useState(false);
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
      setRole(session.user.user_metadata?.role === 'admin' ? 'admin' : 'user');
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
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name, role: 'user' } } });
      if (error) alert(error.message); else alert("Daftar berhasil!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert("Email/Password Salah!");
    }
    setLoading(false);
  };

  const handleConfirmAndPrint = async () => {
    if (!amount || !desc) return alert("Isi data dulu!");
    const { error } = await supabase.from('transaksi').insert([{ 
      keterangan: `${desc} (Oleh: ${penerima})`, 
      nominal: parseInt(amount), tipe, created_at: new Date(date).toISOString() 
    }]);
    if (!error) {
      window.print();
      setShowStruk(false); setAmount(''); setDesc(''); setPenerima(''); fetchData();
    }
  };

  const totalMasuk = list.filter(i => i.tipe === 'masuk').reduce((a, b) => a + b.nominal, 0);
  const totalKeluar = list.filter(i => i.tipe === 'keluar').reduce((a, b) => a + b.nominal, 0);

  if (!session) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
      <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-sm shadow-2xl">
        <form onSubmit={handleAuthAction} className="space-y-6 text-center">
          <img src="/kas_rw1.png" alt="Logo" className="h-20 mx-auto" />
          <h2 className="font-black text-xl uppercase italic">{isSignUp ? 'Daftar' : 'Login Kas RW 02'}</h2>
          {isSignUp && <input name="name" required placeholder="Nama Lengkap" className="w-full p-4 bg-slate-100 rounded-2xl outline-none font-bold" />}
          <input name="email" type="email" required placeholder="Email" className="w-full p-4 bg-slate-100 rounded-2xl outline-none font-bold" />
          <input name="password" type="password" required placeholder="Password" className="w-full p-4 bg-slate-100 rounded-2xl outline-none font-bold" />
          <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest">{loading ? '...' : isSignUp ? 'Daftar' : 'Masuk'}</button>
          <p onClick={() => setIsSignUp(!isSignUp)} className="text-[10px] font-black text-slate-400 uppercase cursor-pointer">{isSignUp ? 'Ke Login' : 'Belum punya akun? Daftar'}</p>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-32">
      <div className="p-6 bg-white flex justify-between items-center shadow-sm sticky top-0 z-40 no-print">
        <div className="flex items-center gap-3">
          <img src="/kas_rw1.png" alt="Logo" className="h-10 w-10" />
          <p className="text-lg font-black text-slate-800">{fullName}</p>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="text-xl">🚪</button>
      </div>

      <div className="no-print p-5 max-w-md mx-auto space-y-6">
        <div className="bg-[#1E293B] p-8 rounded-[2rem] text-white shadow-xl">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Saldo Kas RW 02</p>
          <h2 className="text-4xl font-black italic tracking-tighter">Rp {(totalMasuk - totalKeluar).toLocaleString()}</h2>
        </div>

        {role === 'admin' && (
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => { setTipe('masuk'); setShowModal(true); }} className="bg-emerald-600 text-white p-5 rounded-3xl font-black uppercase text-xs shadow-lg">+ Masuk</button>
            <button onClick={() => { setTipe('keluar'); setShowModal(true); }} className="bg-rose-600 text-white p-5 rounded-3xl font-black uppercase text-xs shadow-lg">- Keluar</button>
          </div>
        )}

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
           <h3 className="font-black text-xs uppercase mb-4 opacity-50 italic">Riwayat Terakhir</h3>
           <div className="space-y-4">
             {list.slice(0, 8).map(item => (
               <div key={item.id} className="flex justify-between items-center border-b border-slate-50 pb-3">
                 <div className="text-xs font-black uppercase truncate pr-4 text-slate-700">{item.keterangan}</div>
                 <div className={`font-black italic text-xs ${item.tipe === 'masuk' ? 'text-emerald-600' : 'text-rose-600'}`}>Rp {item.nominal.toLocaleString()}</div>
               </div>
             ))}
           </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8">
            <h3 className="font-black text-xl mb-6 uppercase italic">Input Kas {tipe}</h3>
            <div className="space-y-4 font-bold">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl" />
              <input type="number" placeholder="Nominal" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-xl" />
              <textarea placeholder="Keterangan" value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-sm" />
              <input type="text" placeholder="Penerima/Penyetor" value={penerima} onChange={(e) => setPenerima(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl text-sm" />
              <button onClick={() => { setShowModal(false); setShowStruk(true); }} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase italic">Cek Struk</button>
            </div>
          </div>
        </div>
      )}

      {/* STRUK THERMAL - ANTI POTONG & FONT BESAR */}
      {showStruk && (
        <div className="fixed inset-0 bg-white z-[999] font-mono text-slate-950 flex flex-col items-start print-page overflow-y-auto">
          <div className="w-full max-w-[380px] pl-1 pr-12 pt-4 pb-8 flex flex-col">
            <div className="text-center border-b-2 border-slate-950 pb-2 mb-4">
              <h1 className="text-2xl font-black">BUKTI KAS RW 02</h1>
              <p className="text-xs font-bold uppercase">Jamaras - Cilengkrang</p>
            </div>

            <div className="space-y-3 text-lg font-bold">
              <div className="flex flex-col border-b border-dashed border-slate-300 pb-1">
                <span className="text-[10px] uppercase text-slate-400 italic">Tanggal:</span>
                <span>{new Date(date).toLocaleDateString('id-ID')}</span>
              </div>
              <div className="flex flex-col border-b border-dashed border-slate-300 pb-1">
                <span className="text-[10px] uppercase text-slate-400 italic">Kategori:</span>
                <span className="uppercase">KAS {tipe}</span>
              </div>
              <div className="flex flex-col border-b border-dashed border-slate-300 pb-1">
                <span className="text-[10px] uppercase text-slate-400 italic">Keterangan:</span>
                <p className="text-xl uppercase leading-none">{desc}</p>
              </div>
              <div className="flex flex-col border-b border-dashed border-slate-300 pb-1">
                <span className="text-[10px] uppercase text-slate-400 italic">Oleh:</span>
                <p className="text-xl uppercase leading-none">{penerima || "-"}</p>
              </div>
            </div>

            <div className="mt-6 py-3 border-y-2 border-slate-950 flex justify-between items-center">
              <span className="text-lg font-black italic">TOTAL:</span>
              <span className="text-4xl font-black">Rp {parseInt(amount).toLocaleString()}</span>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 text-center text-xs font-bold">
              <div><p className="mb-14">Penyetor</p><div className="border-t border-slate-950 pt-1">({penerima || "---"})</div></div>
              <div><p className="mb-14">Bendahara</p><div className="border-t border-slate-950 pt-1">{fullName}</div></div>
            </div>
            <div className="mt-10 text-center text-[8px] opacity-30 uppercase">*** Dokumen Sah Digital ***</div>
          </div>

          <div className="mt-4 flex gap-2 no-print w-full max-w-[350px] px-4">
             <button onClick={() => setShowStruk(false)} className="flex-1 bg-slate-100 py-4 rounded-xl font-bold">BATAL</button>
             <button onClick={handleConfirmAndPrint} className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-bold">CETAK</button>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t h-20 flex justify-around items-center no-print px-10">
        <button onClick={() => setTab('beranda')} className={`flex flex-col items-center ${tab === 'beranda' ? 'text-slate-900' : 'text-slate-300'}`}>🏠<span className="text-[10px] font-bold">Utama</span></button>
        <button onClick={() => setTab('laporan')} className={`flex flex-col items-center ${tab === 'laporan' ? 'text-slate-900' : 'text-slate-300'}`}>📊<span className="text-[10px] font-bold">Laporan</span></button>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        @media print {
          body * { visibility: hidden; }
          .print-page, .print-page * { visibility: visible; }
          .print-page { position: absolute; left: 0; top: 0; width: 100%; margin:0; padding:0; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}