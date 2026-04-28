import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [list, setList] = useState<any[]>([]);
  const [tab, setTab] = useState<'dashboard' | 'pemasukan' | 'pengeluaran' | 'report'>('dashboard');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  // State Form & Modal
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
      // Mengambil role dari user metadata
      const userRole = session.user.user_metadata?.role || 'user';
      setRole(userRole);
      setFullName(session.user.user_metadata?.full_name || 'Hadiat');
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
    if (!amount || !desc) return alert("Isi data dulu!");
    const { error } = await supabase.from('transaksi').insert([{ 
      keterangan: desc, nominal: parseInt(amount), tipe, created_at: new Date(date).toISOString(), penerima 
    }]);
    if (!error) {
      window.print();
      setShowStruk(false); setAmount(''); setDesc(''); setPenerima(''); fetchData();
    }
  };

  const totalMasuk = list.filter(i => i.tipe === 'masuk').reduce((a, b) => a + b.nominal, 0);
  const totalKeluar = list.filter(i => i.tipe === 'keluar').reduce((a, b) => a + b.nominal, 0);
  const saldoAkhir = totalMasuk - totalKeluar;

  // LAYOUT LOGIN
  if (!session) return (
    <div className="min-h-screen flex items-center justify-center bg-[#4D5645] p-6">
      <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-sm shadow-2xl">
        <form onSubmit={handleAuthAction} className="space-y-6 text-center">
          <img src="/kas_rw1.png" alt="Logo" className="h-20 mx-auto mb-2" />
          <h2 className="font-black text-xl uppercase italic text-slate-800">{isSignUp ? 'Buat Akun' : 'Login Kas RW 02'}</h2>
          {isSignUp && <input name="name" required placeholder="Nama Lengkap" className="w-full p-4 bg-slate-100 rounded-2xl outline-none font-bold" />}
          <input name="email" type="email" required placeholder="Email" className="w-full p-4 bg-slate-100 rounded-2xl outline-none font-bold" />
          <input name="password" type="password" required placeholder="Password" className="w-full p-4 bg-slate-100 rounded-2xl outline-none font-bold" />
          <button className="w-full bg-[#4D5645] text-white py-4 rounded-2xl font-black uppercase tracking-widest">{loading ? '...' : isSignUp ? 'Daftar' : 'Masuk'}</button>
          <p onClick={() => setIsSignUp(!isSignUp)} className="text-[10px] font-black text-slate-400 uppercase cursor-pointer underline">{isSignUp ? 'Sudah punya akun? Login' : 'Belum punya akun? Daftar'}</p>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#4D5645] font-sans pb-24 relative overflow-hidden">
      {/* HEADER AREA */}
      <div className="p-6 flex justify-between items-start relative z-10">
        <div className="flex items-center gap-3">
          <img src="/kas_rw1.png" alt="Logo" className="h-12" />
          <div className="text-white">
            <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest leading-none">Keuangan</p>
            <p className="text-lg font-black leading-none">RW 02</p>
          </div>
        </div>
        <div className="text-right text-white">
          <p className="text-xs opacity-70 italic mb-1 uppercase tracking-tighter">Selamat Datang,</p>
          <p className="text-lg font-black leading-none">{fullName}</p>
          <button onClick={() => supabase.auth.signOut()} className="text-[9px] uppercase font-bold opacity-40 mt-1">Logout 🚪</button>
        </div>
      </div>

      {/* CARD SALDO */}
      <div className="px-5 mt-2 relative z-10">
        <div className="bg-[#2C2C2C] rounded-[2.5rem] p-8 shadow-2xl border border-white/5">
          <p className="text-center text-white/50 text-xs font-bold mb-1 uppercase tracking-[0.2em]">Saldo Akhir</p>
          <h2 className="text-center text-white text-5xl font-black tracking-tighter mb-8 italic">
            {saldoAkhir.toLocaleString('id-ID')}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1A1A1A] p-4 rounded-2xl text-center border border-white/5">
              <p className="text-[9px] text-emerald-400 uppercase font-black mb-1">Pemasukan</p>
              <p className="text-white font-bold text-sm">{totalMasuk.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-[#1A1A1A] p-4 rounded-2xl text-center border border-white/5">
              <p className="text-[9px] text-rose-400 uppercase font-black mb-1">Pengeluaran</p>
              <p className="text-white font-bold text-sm">{totalKeluar.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE RIWAYAT */}
      <div className="px-5 mt-6 relative z-10">
        <div className="bg-[#D9D9D9] rounded-t-[2.5rem] p-5 pb-10">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-500 italic">● Riwayat Transaksi</h3>
             {role !== 'admin' && <span className="text-[8px] bg-slate-400 text-white px-2 py-1 rounded-full font-bold uppercase">View Only</span>}
          </div>
          <div className="bg-white rounded-[1.5rem] overflow-hidden shadow-inner min-h-[350px]">
            <table className="w-full text-[10px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 font-black text-slate-400 uppercase">Tgl</th>
                  <th className="p-4 font-black text-slate-400 uppercase">Ket</th>
                  <th className="p-4 font-black text-slate-400 uppercase text-right">Rp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold">
                {list.slice(0, 20).map((item) => (
                  <tr key={item.id}>
                    <td className="p-4 whitespace-nowrap text-slate-400 uppercase">{new Date(item.created_at).toLocaleDateString('id-ID', {day:'2-digit', month:'short'})}</td>
                    <td className="p-4 text-slate-700 uppercase leading-tight truncate max-w-[120px]">{item.keterangan}</td>
                    <td className={`p-4 text-right italic ${item.tipe === 'masuk' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {item.nominal.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* BOTTOM NAVIGATION DENGAN PROTEKSI ROLE */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#2C2C2C] h-20 flex justify-around items-center px-6 z-50 border-t border-white/5 no-print">
        <button onClick={() => setTab('dashboard')} className={`flex flex-col items-center gap-1 ${tab === 'dashboard' ? 'text-[#D9E253]' : 'text-white/40'}`}>
          <span className="text-xl">🏠</span>
          <span className="text-[8px] font-black uppercase">Dashboard</span>
        </button>

        {role === 'admin' && (
          <>
            <button onClick={() => { setTipe('masuk'); setShowModal(true); }} className="flex flex-col items-center gap-1 text-white/40 active:text-[#D9E253]">
              <span className="text-xl">➕</span>
              <span className="text-[8px] font-black uppercase">Masuk</span>
            </button>
            <button onClick={() => { setTipe('keluar'); setShowModal(true); }} className="flex flex-col items-center gap-1 text-white/40 active:text-[#D9E253]">
              <span className="text-xl">➖</span>
              <span className="text-[8px] font-black uppercase">Keluar</span>
            </button>
          </>
        )}

        <button onClick={() => setTab('report')} className={`flex flex-col items-center gap-1 ${tab === 'report' ? 'text-[#D9E253]' : 'text-white/40'}`}>
          <span className="text-xl">📊</span>
          <span className="text-[8px] font-black uppercase">Report</span>
        </button>
      </div>

      {/* MODAL INPUT ADMIN */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6 no-print">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8">
            <h3 className="font-black text-xl mb-6 uppercase italic text-slate-800">Input {tipe}</h3>
            <div className="space-y-4 font-bold">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-4 bg-slate-100 rounded-2xl outline-none" />
              <input type="number" placeholder="Nominal" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-4 bg-slate-100 rounded-2xl text-xl outline-none" />
              <textarea placeholder="Keterangan" value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full p-4 bg-slate-100 rounded-2xl text-sm outline-none resize-none" />
              <input type="text" placeholder="Nama Penyetor/Penerima" value={penerima} onChange={(e) => setPenerima(e.target.value)} className="w-full p-4 bg-slate-100 rounded-2xl text-sm outline-none" />
              <div className="flex gap-2 pt-4">
                <button onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black uppercase text-[10px]">Batal</button>
                <button onClick={() => { setShowModal(false); setShowStruk(true); }} className="flex-1 py-4 bg-[#4D5645] text-white rounded-2xl font-black uppercase text-[10px]">Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STRUK THERMAL */}
      {showStruk && (
        <div className="fixed inset-0 bg-white z-[999] font-mono text-slate-950 flex flex-col items-start print-page overflow-y-auto">
          <div className="w-full max-w-[380px] pl-1 pr-12 pt-4 pb-8 flex flex-col">
            <div className="text-center border-b-2 border-slate-950 pb-2 mb-4">
              <h1 className="text-2xl font-black uppercase">Bukti Kas RW 02</h1>
              <p className="text-xs font-bold uppercase tracking-tighter">Jamaras Istimewa - Cilengkrang</p>
            </div>
            <div className="space-y-3 text-lg font-bold">
              <div className="flex flex-col border-b border-dashed border-slate-300 pb-1">
                <span className="text-[10px] uppercase text-slate-400 italic">Tanggal:</span>
                <span>{new Date(date).toLocaleDateString('id-ID')}</span>
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
              <span className="text-lg font-black italic text-slate-400">TOTAL:</span>
              <span className="text-4xl font-black tracking-tighter">Rp {parseInt(amount).toLocaleString('id-ID')}</span>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 text-center text-[10px] font-bold">
              <div><p className="mb-14">Penyetor</p><div className="border-t border-slate-950 pt-1">({penerima || "---"})</div></div>
              <div><p className="mb-14">Bendahara</p><div className="border-t border-slate-950 pt-1">{fullName}</div></div>
            </div>
            <div className="mt-10 text-center text-[8px] opacity-30 uppercase tracking-[0.5em]">*** Sah Digital ***</div>
          </div>
          <div className="mt-4 flex gap-2 no-print w-full max-w-[350px] px-4 pb-10">
             <button onClick={() => setShowStruk(false)} className="flex-1 bg-slate-100 py-4 rounded-xl font-black">BATAL</button>
             <button onClick={handleConfirmAndPrint} className="flex-1 bg-[#4D5645] text-white py-4 rounded-xl font-black uppercase">CETAK</button>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #4D5645; overflow-x: hidden; }
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