import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [list, setList] = useState<any[]>([]);
  const [tab, setTab] = useState<'dashboard' | 'report'>('dashboard');
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
      setRole(session.user.user_metadata?.role || 'user');
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
      if (error) alert(error.message); else alert("Daftar berhasil!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert("Email/Password Salah!");
    }
    setLoading(false);
  };

  const handleConfirmAndPrint = async () => {
    if (!amount || !desc) return alert("Isi data dulu!");
    setLoading(true);
    
    const keteranganFinal = `${desc.toUpperCase()} (OLEH: ${penerima.toUpperCase()})`;

    const { error } = await supabase.from('transaksi').insert([{ 
      keterangan: keteranganFinal, 
      nominal: parseInt(amount), 
      tipe, 
      created_at: new Date(date).toISOString()
    }]);

    if (!error) {
      fetchData();
      setTimeout(() => {
        window.print();
        setLoading(false);
        setShowStruk(false);
        setAmount('');
        setDesc('');
        setPenerima('');
      }, 500);
    } else {
      alert("Gagal Simpan: " + error.message);
      setLoading(false);
    }
  };

  const totalMasuk = list.filter(i => i.tipe === 'masuk').reduce((a, b) => a + b.nominal, 0);
  const totalKeluar = list.filter(i => i.tipe === 'keluar').reduce((a, b) => a + b.nominal, 0);
  const saldoAkhir = totalMasuk - totalKeluar;

  if (!session) return (
    <div className="min-h-screen flex items-center justify-center bg-[#4D5645] p-6">
       <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-sm shadow-2xl text-center">
         <form onSubmit={handleAuthAction} className="space-y-4">
           <img src="/kas_rw1.png" className="h-16 mx-auto mb-4" />
           <h2 className="font-black text-xl uppercase italic text-slate-800">Login Kas RW</h2>
           <input name="email" type="email" placeholder="Email" className="w-full p-4 bg-slate-100 rounded-2xl outline-none font-bold" required />
           <input name="password" type="password" placeholder="Password" className="w-full p-4 bg-slate-100 rounded-2xl outline-none font-bold" required />
           <button className="w-full bg-[#4D5645] text-white py-4 rounded-2xl font-black uppercase">{loading ? '...' : 'Masuk'}</button>
         </form>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#4D5645] font-sans pb-24 overflow-x-hidden">
      {/* HEADER DASHBOARD */}
      <div className="p-6 flex justify-between items-start no-print">
        <div className="flex items-center gap-3">
          <img src="/kas_rw1.png" alt="Logo" className="h-12" />
          <div className="text-white">
            <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest"></p>
            <p className="text-lg font-black"></p>
          </div>
        </div>
        <div className="text-right text-white">
          <p className="text-lg font-black">{fullName}</p>
          <button onClick={() => supabase.auth.signOut()} className="text-[10px] opacity-50 uppercase">Logout 🚪</button>
        </div>
      </div>

      {/* SALDO */}
      <div className="px-5 no-print">
        <div className="bg-[#2C2C2C] rounded-[2.5rem] p-8 border border-white/5 text-center">
          <p className="text-white/50 text-xs font-bold uppercase mb-1">Saldo Akhir</p>
          <h2 className="text-white text-5xl font-black italic tracking-tighter">
            {saldoAkhir.toLocaleString('id-ID')}
          </h2>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-black/20 p-3 rounded-2xl border border-white/5">
              <p className="text-[9px] text-emerald-400 font-black uppercase">Masuk</p>
              <p className="text-white text-sm font-bold">{totalMasuk.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-black/20 p-3 rounded-2xl border border-white/5">
              <p className="text-[9px] text-rose-400 font-black uppercase">Keluar</p>
              <p className="text-white text-sm font-bold">{totalKeluar.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIWAYAT */}
      <div className="px-5 mt-6 no-print">
        <div className="bg-[#D9D9D9] rounded-t-[2.5rem] p-5 min-h-[400px]">
          <h3 className="font-black text-[10px] uppercase text-slate-500 mb-4 italic">● Riwayat Transaksi</h3>
          <div className="bg-white rounded-[1.5rem] overflow-hidden shadow-sm">
            <table className="w-full text-[10px] text-left">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="p-4 text-slate-400">TGL</th>
                  <th className="p-4 text-slate-400">KET</th>
                  <th className="p-4 text-slate-400 text-right">RP</th>
                </tr>
              </thead>
              <tbody className="font-bold">
                {list.slice(0, 15).map((item) => (
                  <tr key={item.id} className="border-b border-slate-50">
                    <td className="p-4 text-slate-400">{new Date(item.created_at).toLocaleDateString('id-ID', {day:'2-digit', month:'short'})}</td>
                    <td className="p-4 text-slate-700 uppercase leading-tight truncate max-w-[120px]">{item.keterangan}</td>
                    <td className={`p-4 text-right ${item.tipe === 'masuk' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {item.nominal.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* NAVIGATION */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#2C2C2C] h-20 flex justify-around items-center px-6 z-50 no-print border-t border-white/5">
        <button onClick={() => setTab('dashboard')} className="flex flex-col items-center text-[#D9E253]">
          <span className="text-xl">🏠</span>
          <span className="text-[8px] font-black uppercase">Dashboard</span>
        </button>
        {role === 'admin' && (
          <>
            <button onClick={() => { setTipe('masuk'); setShowModal(true); }} className="flex flex-col items-center text-white/40">
              <span className="text-xl">➕</span>
              <span className="text-[8px] font-black uppercase">Masuk</span>
            </button>
            <button onClick={() => { setTipe('keluar'); setShowModal(true); }} className="flex flex-col items-center text-white/40">
              <span className="text-xl">➖</span>
              <span className="text-[8px] font-black uppercase">Keluar</span>
            </button>
          </>
        )}
        <button onClick={() => setTab('report')} className="flex flex-col items-center text-white/40">
          <span className="text-xl">📊</span>
          <span className="text-[8px] font-black uppercase">Report</span>
        </button>
      </div>

      {/* MODAL INPUT */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6 no-print">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8">
            <h3 className="font-black text-xl mb-6 uppercase italic">Input {tipe}</h3>
            <div className="space-y-4">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-4 bg-slate-100 rounded-2xl outline-none font-bold" />
              <input type="number" placeholder="Nominal" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-4 bg-slate-100 rounded-2xl text-xl outline-none font-bold" />
              <textarea placeholder="Keterangan" value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full p-4 bg-slate-100 rounded-2xl text-sm outline-none resize-none font-bold" />
              <input type="text" placeholder="Penyetor/Penerima" value={penerima} onChange={(e) => setPenerima(e.target.value)} className="w-full p-4 bg-slate-100 rounded-2xl text-sm outline-none font-bold" />
              <div className="flex gap-2 pt-4">
                <button onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black uppercase text-[10px]">Batal</button>
                <button onClick={() => { setShowModal(false); setShowStruk(true); }} className="flex-1 py-4 bg-[#4D5645] text-white rounded-2xl font-black uppercase text-[10px]">Cek Struk</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STRUK PRINT - FIX BLUR & WARNA HITAM PEKAT */}
      {showStruk && (
        <div className="fixed inset-0 bg-white z-[999] font-mono text-black flex flex-col items-start print-page overflow-y-auto">
          <div className="w-full max-w-[380px] pl-2 pr-12 pt-4 pb-8 text-black">
            <div className="text-center border-b-4 border-black pb-2 mb-4">
              <h1 className="text-2xl font-black uppercase text-black leading-none">BUKTI KAS RW 02</h1>
              <p className="text-xs font-black uppercase tracking-tighter text-black">Jamaras Istimewa - Jatihandap , Mandalajati</p>
            </div>
            
            <div className="space-y-4 text-black">
              <div className="flex flex-col border-b-2 border-dashed border-black pb-1">
                <span className="text-[10px] font-black uppercase italic">TANGGAL:</span>
                <span className="text-lg font-bold">{new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex flex-col border-b-2 border-dashed border-black pb-1">
                <span className="text-[10px] font-black uppercase italic">KETERANGAN:</span>
                <p className="text-xl font-black uppercase leading-tight">{desc}</p>
              </div>
              <div className="flex flex-col border-b-2 border-dashed border-black pb-1">
                <span className="text-[10px] font-black uppercase italic">OLEH:</span>
                <p className="text-xl font-black uppercase">{penerima || "-"}</p>
              </div>
            </div>

            <div className="mt-6 py-4 border-y-4 border-black flex justify-between items-center bg-transparent">
              <span className="text-lg font-black italic">TOTAL:</span>
              <span className="text-4xl font-black">Rp {parseInt(amount).toLocaleString('id-ID')}</span>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-8 text-center text-xs font-black text-black">
              <div>
                <p className="mb-16 uppercase italic">Penyetor</p>
                <div className="border-t-2 border-black pt-1">({penerima || "---"})</div>
              </div>
              <div>
                <p className="mb-16 uppercase italic">Bendahara</p>
                <div className="border-t-2 border-black pt-1">{fullName}</div>
              </div>
            </div>
            
            <div className="mt-12 text-center text-[10px] font-black uppercase tracking-[0.3em] border-t border-black pt-2">
              *** SAH DIGITAL ***
            </div>
          </div>

          <div className="mt-8 flex gap-3 no-print w-full max-w-[350px] px-4 pb-24">
             <button onClick={() => setShowStruk(false)} className="flex-1 bg-slate-200 py-4 rounded-xl font-black text-slate-700">KEMBALI</button>
             <button onClick={handleConfirmAndPrint} disabled={loading} className="flex-1 bg-black text-white py-4 rounded-xl font-black uppercase shadow-xl">
                {loading ? 'SIMPAN...' : 'CETAK SEKARANG'}
             </button>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&display=swap');
        body { 
          font-family: 'Plus Jakarta Sans', sans-serif; 
          background-color: #4D5645; 
          -webkit-font-smoothing: antialiased;
        }
        @media print {
          @page { margin: 0; size: auto; }
          body { background-color: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-page { 
            position: absolute; 
            top: 0; 
            left: 0; 
            width: 100%; 
            visibility: visible !important; 
            text-rendering: optimizeLegibility;
          }
          .print-page * { 
            visibility: visible !important; 
            color: black !important; 
            border-color: black !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}