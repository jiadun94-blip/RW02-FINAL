import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [list, setList] = useState<any[]>([]);
  const [tab, setTab] = useState<'dashboard' | 'report'>('dashboard');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("Email/Password Salah!");
    setLoading(false);
  };

  const handleConfirmAndPrint = async () => {
    if (!amount || !desc) return alert("Isi data dulu!");
    setLoading(true);
    const keteranganFinal = `${desc.toUpperCase()} (OLEH: ${penerima.toUpperCase()})`;
    const { error } = await supabase.from('transaksi').insert([{ 
      keterangan: keteranganFinal, nominal: parseInt(amount), tipe, created_at: new Date(date).toISOString()
    }]);

    if (!error) {
      fetchData();
      setTimeout(() => {
        window.print();
        setLoading(false);
        setShowStruk(false);
        setAmount(''); setDesc(''); setPenerima('');
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
    <div className="min-h-screen flex items-center justify-center bg-[#4D5645] p-6 font-roboto">
       <div className="bg-white p-8 rounded-[2rem] w-full max-w-sm shadow-2xl text-center">
         <form onSubmit={handleAuthAction} className="space-y-5">
           <img src="/kas_rw1.png" className="h-20 mx-auto mb-2" />
           <h2 className="font-black text-2xl uppercase text-slate-800">Login Kas</h2>
           <input name="email" type="email" placeholder="Email" className="w-full p-4 bg-slate-100 rounded-xl outline-none font-medium text-lg" required />
           <input name="password" type="password" placeholder="Password" className="w-full p-4 bg-slate-100 rounded-xl outline-none font-medium text-lg" required />
           <button className="w-full bg-[#4D5645] text-white py-4 rounded-xl font-black text-lg uppercase tracking-wider">{loading ? '...' : 'Masuk'}</button>
         </form>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#4D5645] font-roboto pb-28">
      {/* HEADER */}
      <div className="p-6 flex justify-between items-center no-print text-white">
        <div className="flex items-center gap-3">
          <img src="/kas_rw1.png" alt="Logo" className="h-14" />
          <div>
            <p className="text-xs font-bold opacity-60 uppercase tracking-tighter">Kas Digital</p>
            <p className="text-xl font-black leading-none">RW 02</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-black leading-none">{fullName}</p>
          <button onClick={() => supabase.auth.signOut()} className="text-xs font-bold opacity-40 uppercase underline">Logout</button>
        </div>
      </div>

      {/* SALDO CARD */}
      <div className="px-4 no-print">
        <div className="bg-[#2C2C2C] rounded-[2rem] p-6 border border-white/10 shadow-xl">
          <p className="text-white/40 text-center text-sm font-bold uppercase mb-1">Total Saldo Saat Ini</p>
          <h2 className="text-white text-center text-5xl font-black tracking-tighter mb-6 italic">
            {saldoAkhir.toLocaleString('id-ID')}
          </h2>
          <div className="flex gap-3">
            <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-center">
              <p className="text-[10px] text-emerald-400 font-black uppercase">Masuk</p>
              <p className="text-white text-base font-black">{totalMasuk.toLocaleString('id-ID')}</p>
            </div>
            <div className="flex-1 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-center">
              <p className="text-[10px] text-rose-400 font-black uppercase">Keluar</p>
              <p className="text-white text-base font-black">{totalKeluar.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* LIST TRANSAKSI - SIMPLE & CLEAR */}
      <div className="mt-6 px-4 no-print">
        <div className="flex justify-between items-center mb-3 px-2">
          <h3 className="font-black text-sm text-white/60 uppercase italic tracking-widest">● Riwayat Kas</h3>
          <span className="bg-white/10 text-white/40 text-[10px] px-2 py-1 rounded font-bold uppercase italic">Terbaru</span>
        </div>
        
        <div className="space-y-2">
          {list.slice(0, 20).map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black leading-none ${item.tipe === 'masuk' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                  <span className="text-[10px] uppercase">{new Date(item.created_at).toLocaleDateString('id-ID', {month:'short'})}</span>
                  <span className="text-lg">{new Date(item.created_at).toLocaleDateString('id-ID', {day:'2-digit'})}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-800 font-black text-base leading-tight uppercase truncate max-w-[160px]">{item.keterangan.split(' (OLEH:')[0]}</span>
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-tighter">Oleh: {item.keterangan.split('OLEH: ')[1]?.replace(')', '') || '-'}</span>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-black italic ${item.tipe === 'masuk' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {item.tipe === 'masuk' ? '+' : '-'}{item.nominal.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#222] h-20 flex justify-around items-center px-4 z-50 border-t border-white/5 no-print">
        <button onClick={() => setTab('dashboard')} className={`flex flex-col items-center gap-1 ${tab === 'dashboard' ? 'text-[#D9E253]' : 'text-white/30'}`}>
          <span className="text-2xl">🏠</span>
          <span className="text-[10px] font-black uppercase">Home</span>
        </button>
        {role === 'admin' && (
          <>
            <button onClick={() => { setTipe('masuk'); setShowModal(true); }} className="bg-emerald-500 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg -mt-10 border-4 border-[#222]">
              <span className="text-2xl">➕</span>
            </button>
            <button onClick={() => { setTipe('keluar'); setShowModal(true); }} className="bg-rose-500 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg -mt-10 border-4 border-[#222]">
              <span className="text-2xl">➖</span>
            </button>
          </>
        )}
        <button onClick={() => setTab('report')} className={`flex flex-col items-center gap-1 ${tab === 'report' ? 'text-[#D9E253]' : 'text-white/30'}`}>
          <span className="text-2xl">📊</span>
          <span className="text-[10px] font-black uppercase">Report</span>
        </button>
      </div>

      {/* MODAL & STRUK (SAMA SEPERTI SEBELUMNYA TAPI FONT ROBOTO) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6 no-print">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl">
            <h3 className="font-black text-2xl mb-6 uppercase italic text-slate-800">Input {tipe}</h3>
            <div className="space-y-4">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-4 bg-slate-100 rounded-xl outline-none font-bold text-lg" />
              <input type="number" placeholder="Nominal" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-4 bg-slate-100 rounded-xl text-2xl outline-none font-black text-emerald-600" />
              <textarea placeholder="Keterangan" value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full p-4 bg-slate-100 rounded-xl text-lg outline-none resize-none font-bold h-24" />
              <input type="text" placeholder="Penyetor/Penerima" value={penerima} onChange={(e) => setPenerima(e.target.value)} className="w-full p-4 bg-slate-100 rounded-xl text-lg outline-none font-bold" />
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-100 rounded-xl font-black uppercase text-sm">Batal</button>
                <button onClick={() => { setShowModal(false); setShowStruk(true); }} className="flex-1 py-4 bg-[#4D5645] text-white rounded-xl font-black uppercase text-sm shadow-lg">Cek Struk</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showStruk && (
        <div className="fixed inset-0 bg-white z-[999] text-black flex flex-col items-start print-page overflow-y-auto p-4">
          <div className="w-full max-w-[350px] border-2 border-black p-4">
            <div className="text-center border-b-4 border-black pb-2 mb-4">
              <h1 className="text-2xl font-black uppercase leading-none">BUKTI KAS RW 02</h1>
              <p className="text-xs font-black uppercase">Jamaras Istimewa - Cilengkrang</p>
            </div>
            <div className="space-y-4 text-black font-bold">
              <div className="border-b-2 border-dashed border-black pb-1">
                <p className="text-[10px] uppercase italic">Tanggal</p>
                <p className="text-lg uppercase">{new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
              <div className="border-b-2 border-dashed border-black pb-1">
                <p className="text-[10px] uppercase italic">Keterangan</p>
                <p className="text-xl font-black uppercase">{desc}</p>
              </div>
              <div className="border-b-2 border-dashed border-black pb-1">
                <p className="text-[10px] uppercase italic">Oleh</p>
                <p className="text-xl font-black uppercase">{penerima || "-"}</p>
              </div>
            </div>
            <div className="mt-6 py-4 border-y-4 border-black flex justify-between items-center font-black">
              <span className="text-xl italic">TOTAL</span>
              <span className="text-4xl italic">Rp {parseInt(amount).toLocaleString('id-ID')}</span>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-8 text-center text-xs font-black">
              <div><p className="mb-16 uppercase">Penyetor</p><p className="border-t-2 border-black pt-1">({penerima || "---"})</p></div>
              <div><p className="mb-16 uppercase">Bendahara</p><p className="border-t-2 border-black pt-1">{fullName}</p></div>
            </div>
            <div className="mt-10 text-center text-[10px] font-black border-t border-black pt-2 uppercase tracking-widest">*** SAH DIGITAL ***</div>
          </div>
          <div className="mt-8 flex gap-3 no-print w-full max-w-[350px] pb-24">
             <button onClick={() => setShowStruk(false)} className="flex-1 bg-slate-200 py-4 rounded-xl font-black">KEMBALI</button>
             <button onClick={handleConfirmAndPrint} disabled={loading} className="flex-1 bg-black text-white py-4 rounded-xl font-black uppercase">{loading ? '...' : 'CETAK'}</button>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700;900&display=swap');
        .font-roboto { font-family: 'Roboto', sans-serif; }
        body { background-color: #4D5645; -webkit-font-smoothing: antialiased; }
        @media print {
          body { background-color: white !important; }
          .no-print { display: none !important; }
          .print-page { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999; visibility: visible !important; margin: 0; padding: 10px; }
          .print-page * { visibility: visible !important; color: black !important; border-color: black !important; }
        }
      `}</style>
    </div>
  );
}