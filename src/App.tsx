import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [list, setList] = useState<any[]>([]);
  const [tab, setTab] = useState<'dashboard' | 'pemasukan' | 'pengeluaran' | 'report'>('dashboard');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  
  // State Form
  const [showModal, setShowModal] = useState(false);
  const [showStruk, setShowStruk] = useState(false);
  const [tipe, setTipe] = useState<'masuk' | 'keluar'>('masuk');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [penerima, setPenerima] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setFullName(session.user.user_metadata?.full_name || 'Hadiat');
        setRole(session.user.user_metadata?.role || 'user');
      }
    });
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data } = await supabase.from('transaksi').select('*').order('created_at', { ascending: false });
    if (data) setList(data);
  };

  const handleConfirmAndPrint = async () => {
    const { error } = await supabase.from('transaksi').insert([{ 
      keterangan: desc, nominal: parseInt(amount), tipe, created_at: new Date(date).toISOString(), penerima 
    }]);
    if (!error) { window.print(); setShowStruk(false); fetchData(); }
  };

  const totalMasuk = list.filter(i => i.tipe === 'masuk').reduce((a, b) => a + b.nominal, 0);
  const totalKeluar = list.filter(i => i.tipe === 'keluar').reduce((a, b) => a + b.nominal, 0);
  const saldoAkhir = totalMasuk - totalKeluar;

  if (!session) return <div className="p-10 text-center font-bold">Silahkan Login di HP/PC Anda</div>;

  return (
    <div className="min-h-screen bg-[#4D5645] font-sans pb-24 relative overflow-hidden">
      {/* BACKGROUND DECORATION */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>

      {/* HEADER AREA */}
      <div className="p-6 flex justify-between items-start relative z-10">
        <div className="flex items-center gap-2">
          <div className="bg-[#D9E253] p-2 rounded-lg font-black text-[#4D5645] leading-none text-center">
            <span className="text-[10px] block">Kas</span>
            <span className="text-xl">02</span>
            <span className="text-xl block">RW</span>
          </div>
          <div className="text-white">
            <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Jamaras Istimewa</p>
          </div>
        </div>
        <div className="text-right text-white">
          <p className="text-sm opacity-80 italic">Selamat Sore ,</p>
          <p className="text-xl font-black">{fullName}</p>
        </div>
      </div>

      {/* SALDO CARD AREA */}
      <div className="px-5 mt-4 relative z-10">
        <div className="bg-[#2C2C2C] rounded-[2rem] p-8 shadow-2xl border border-white/5">
          <p className="text-center text-white/60 text-sm font-bold mb-1">Saldo Akhir</p>
          <h2 className="text-center text-white text-5xl font-black tracking-tighter mb-8">
            {saldoAkhir.toLocaleString('id-ID')}
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1A1A1A] p-4 rounded-2xl text-center border border-white/5">
              <p className="text-[10px] text-white/40 uppercase font-bold mb-1">Pemasukan</p>
              <p className="text-white font-bold">{totalMasuk.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-[#1A1A1A] p-4 rounded-2xl text-center border border-white/5">
              <p className="text-[10px] text-white/40 uppercase font-bold mb-1">Pengeluaran</p>
              <p className="text-white font-bold">{totalKeluar.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* TABEL RIWAYAT AREA */}
      <div className="px-5 mt-6 relative z-10">
        <div className="bg-[#D9D9D9] rounded-t-3xl p-4">
          <h3 className="font-bold text-sm text-slate-700 mb-4">Riwayat Transaksi</h3>
          <div className="bg-white rounded-xl overflow-hidden shadow-inner">
            <table className="w-full text-[10px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-3 font-bold text-slate-600">Tanggal</th>
                  <th className="p-3 font-bold text-slate-600">Keterangan</th>
                  <th className="p-3 font-bold text-slate-600 text-right">Nominal</th>
                  <th className="p-3 font-bold text-slate-600 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.length > 0 ? list.map((item) => (
                  <tr key={item.id}>
                    <td className="p-3 whitespace-nowrap text-slate-500">
                      {new Date(item.created_at).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}
                    </td>
                    <td className="p-3 text-slate-700 font-medium leading-tight">
                      {item.keterangan}
                    </td>
                    <td className={`p-3 text-right font-bold ${item.tipe === 'masuk' ? 'text-green-600' : 'text-red-600'}`}>
                      {item.nominal.toLocaleString('id-ID')}
                    </td>
                    <td className="p-3 text-center text-blue-500 italic">edit / hapus</td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="p-10 text-center text-slate-400">Belum ada transaksi</td></tr>
                )}
                {/* Filler rows agar mirip desain */}
                {[...Array(8)].map((_, i) => (
                  <tr key={i} className="h-8 border-b border-slate-50">
                    <td colSpan={4}></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* BOTTOM NAVIGATION */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#2C2C2C] h-20 flex justify-around items-center px-6 z-50 border-t border-white/5 no-print">
        <button onClick={() => setTab('dashboard')} className={`flex flex-col items-center gap-1 ${tab === 'dashboard' ? 'text-[#D9E253]' : 'text-white/40'}`}>
          <span className="text-[10px] font-bold uppercase tracking-widest">Dashboard</span>
        </button>
        <button onClick={() => { setTipe('masuk'); setShowModal(true); }} className={`flex flex-col items-center gap-1 ${tab === 'pemasukan' ? 'text-[#D9E253]' : 'text-white/40'}`}>
          <span className="text-[10px] font-bold uppercase tracking-widest">Pemasukan</span>
        </button>
        <button onClick={() => { setTipe('keluar'); setShowModal(true); }} className={`flex flex-col items-center gap-1 ${tab === 'pengeluaran' ? 'text-[#D9E253]' : 'text-white/40'}`}>
          <span className="text-[10px] font-bold uppercase tracking-widest">Pengeluaran</span>
        </button>
        <button onClick={() => setTab('report')} className={`flex flex-col items-center gap-1 ${tab === 'report' ? 'text-[#D9E253]' : 'text-white/40'}`}>
          <span className="text-[10px] font-bold uppercase tracking-widest">Report</span>
        </button>
      </div>

      {/* MODAL INPUT (TIDAK BERUBAH LOGIKANYA) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6 no-print">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8">
            <h3 className="font-black text-xl mb-6 uppercase italic text-slate-800">Input {tipe}</h3>
            <div className="space-y-4 font-bold text-slate-700">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-4 bg-slate-100 rounded-2xl outline-none" />
              <input type="number" placeholder="Nominal" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-4 bg-slate-100 rounded-2xl text-xl outline-none" />
              <textarea placeholder="Keterangan" value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full p-4 bg-slate-100 rounded-2xl text-sm outline-none" />
              <input type="text" placeholder="Nama Penyetor/Penerima" value={penerima} onChange={(e) => setPenerima(e.target.value)} className="w-full p-4 bg-slate-100 rounded-2xl text-sm outline-none" />
              <div className="flex gap-2 pt-4">
                <button onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-200 rounded-2xl font-bold">Batal</button>
                <button onClick={() => { setShowModal(false); setShowStruk(true); }} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold">Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STRUK THERMAL (VERSI OPTIMAL UNTUK FHO.JPEG) */}
      {showStruk && (
        <div className="fixed inset-0 bg-white z-[999] font-mono text-slate-950 flex flex-col items-start print-page overflow-y-auto">
          <div className="w-full max-w-[380px] pl-2 pr-12 pt-4 pb-8 flex flex-col">
            <div className="text-center border-b-2 border-slate-950 pb-2 mb-4">
              <h1 className="text-2xl font-black">BUKTI KAS RW 02</h1>
              <p className="text-xs font-bold uppercase tracking-tighter">Jamaras Istimewa - Cilengkrang</p>
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
              <span className="text-4xl font-black">Rp {parseInt(amount).toLocaleString('id-ID')}</span>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 text-center text-xs font-bold">
              <div><p className="mb-14">Penyetor</p><div className="border-t border-slate-950 pt-1">({penerima || "---"})</div></div>
              <div><p className="mb-14">Bendahara</p><div className="border-t border-slate-950 pt-1">{fullName}</div></div>
            </div>
            <div className="mt-10 text-center text-[8px] opacity-30 uppercase">*** Dokumen Sah Digital ***</div>
          </div>
          <div className="mt-4 flex gap-2 no-print w-full max-w-[350px] px-4">
             <button onClick={() => setShowStruk(false)} className="flex-1 bg-slate-100 py-4 rounded-xl font-bold">BATAL</button>
             <button onClick={handleConfirmAndPrint} className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-bold uppercase">Konfirmasi & Cetak</button>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #4D5645; }
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