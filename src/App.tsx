import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [list, setList] = useState<any[]>([]);
  const [tab, setTab] = useState<'dashboard' | 'input' | 'report'>('dashboard');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); 
  
  const [printerCharacteristic, setPrinterCharacteristic] = useState<any>(null);
  const [isPrinterConnected, setIsPrinterConnected] = useState(false);

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
      setFullName(session.user.user_metadata?.full_name || 'Admin');
    }
  };

  const fetchData = async () => {
    const { data } = await supabase.from('transaksi').select('*').order('created_at', { ascending: false });
    if (data) setList(data);
  };

  const connectPrinter = async () => {
    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
      });
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
      setPrinterCharacteristic(characteristic);
      setIsPrinterConnected(true);
      alert("Printer Terhubung!");
    } catch (e) { alert("Bluetooth Gagal!"); }
  };

  // FUNGSI UTAMA CETAK GAYA SPBU (MENGGUNAKAN ANTRIAN BARIS AGAR TIDAK TERPOTONG)
  const sendToPrinter = async (data: any) => {
    if (!printerCharacteristic) return;
    const encoder = new TextEncoder();
    
    // Perintah Utama Printer Thermal (ESC/POS)
    const RESET       = "\x1B\x40";       
    const FONT_SMALL  = "\x1D\x21\x00";   // Ukuran kecil rapat ala SPBU
    const BOLD_ON     = "\x1B\x45\x01";   
    const BOLD_OFF    = "\x1B\x45\x00";   
    const C_CENTER    = "\x1B\x61\x01";   
    const C_LEFT      = "\x1B\x61\x00";   
    const LINE_SPACE  = "\x1B\x33\x1A";   // Merapatkan baris vertikal teks
    const LINE        = "--------------------------------\n"; 
    const BR          = "\n";

    const noDoc = `TRX${new Date().toISOString().slice(2,10).replace(/-/g,'')}${Math.floor(100 + Math.random() * 900)}`;

    // Pecah data struk menjadi baris-baris kecil
    const barisStruk = [
      RESET,
      LINE_SPACE,
      FONT_SMALL,
      C_CENTER,
      BOLD_ON + "KAS DIGITAL RW 02" + BOLD_OFF + BR,
      BOLD_ON + "JAMARAS ISTIMEWA" + BOLD_OFF + BR,
      "Bukti Tanda Terima Resmi" + BR,
      LINE,
      C_LEFT,
      `NO. DOC  : ${noDoc}\n`,
      `TANGGAL  : ${data.tgl}\n`,
      `JENIS    : UANG ${data.tipe.toUpperCase()}\n`,
      LINE,
      `KEPERLUAN: ${data.ket}\n`,
      `PENYETOR : ${data.oleh}\n`,
      `PENERIMA : ADMIN KAS RW\n`,
      LINE,
      BOLD_ON + `TOTAL     Rp ${data.nominal}` + BOLD_OFF + BR,
      LINE,
      C_CENTER,
      "Simpan struk ini sebagai" + BR,
      "bukti pembayaran yang SAH." + BR,
      "Terima kasih." + BR,
      BR,
      "Diterima Oleh," + BR,
      BR, BR, BR, 
      "(  Monev Kas RW 02  )" + BR,
      BR, BR, BR, BR 
    ];

    // Fungsi delay internal
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Proses pengiriman beruntun bertahap (Mengatasi masalah memori printer macet)
    for (const baris of barisStruk) {
      await printerCharacteristic.writeValue(encoder.encode(baris));
      await sleep(40); 
    }
  };

  const handleSimpan = async () => {
    if (!amount || !desc) return alert("Isi data!");
    setLoading(true);
    const { error } = await supabase.from('transaksi').insert([{ 
      keterangan: `${desc.toUpperCase()} (OLEH: ${penerima.toUpperCase()})`, 
      nominal: parseInt(amount), tipe, created_at: new Date(date).toISOString() 
    }]);

    if (!error) {
      await fetchData();
      if (isPrinterConnected) {
        await sendToPrinter({
          tgl: date.split('-').reverse().join('/'),
          tipe: tipe,
          ket: desc.toUpperCase(),
          oleh: penerima.toUpperCase(),
          nominal: parseInt(amount).toLocaleString('id-ID')
        });
      }
      setAmount(''); setDesc(''); setPenerima(''); setTab('dashboard');
    }
    setLoading(false);
  };

  const filterByMonth = (month: number, year: number) => {
    return list.filter(item => {
      const d = new Date(item.created_at);
      return d.getMonth() === month && d.getFullYear() === year;
    });
  };

  if (!session) return (
    <div className="auth-bg">
      <div className="auth-card">
        <h2>{isSignUp ? 'DAFTAR WARGA' : 'KAS RW DIGITAL'}</h2>
        <p style={{color: '#94a3b8', fontSize:'13px', marginBottom:'20px'}}>Sistem Informasi Keuangan Transparan</p>
        <form onSubmit={async (e:any) => {
          e.preventDefault();
          setLoading(true);
          const email = e.target.email.value;
          const password = e.target.password.value;
          if(isSignUp){
            const name = e.target.fullname.value;
            const {error} = await supabase.auth.signUp({email, password, options: {data: {full_name: name, role: 'user'}}});
            if(error) alert(error.message); else alert("Cek email!");
          } else {
            const {error} = await supabase.auth.signInWithPassword({email, password});
            if(error) alert("Gagal!");
          }
          setLoading(false);
        }}>
          {isSignUp && <input name="fullname" type="text" placeholder="Nama Lengkap" required />}
          <input name="email" type="email" placeholder="Alamat Email" required />
          <input name="password" type="password" placeholder="Kata Sandi" required />
          <button className="btn-accent" type="submit">{loading ? 'Memproses...' : (isSignUp ? 'BUAT AKUN' : 'MASUK KE APLIKASI')}</button>
        </form>
        <p onClick={() => setIsSignUp(!isSignUp)} style={{fontSize:'13px', marginTop:'20px', color:'#10b981', cursor:'pointer', fontWeight:'500'}}>
          {isSignUp ? 'Sudah punya akun? Login di sini' : 'Belum punya akun? Daftar sebagai warga'}
        </p>
      </div>
      <style>{`
        .auth-bg { background: radial-gradient(circle at top right, #1e293b, #0f172a); height: 100vh; display: flex; align-items: center; justify-content: center; font-family: 'Segoe UI', sans-serif; }
        .auth-card { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(10px); padding: 40px 30px; border-radius: 24px; width: 85%; max-width: 400px; text-align: center; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 20px 40px rgba(0,0,0,0.3); }
        .auth-card h2 { color: #ffffff; font-size: 24px; margin: 0 0 5px 0; letter-spacing: 1px; font-weight: 700; }
        input { width: 100%; padding: 14px 16px; margin: 10px 0; border-radius: 12px; border: 1px solid #334155; background: rgba(15, 23, 42, 0.6); color: #fff; box-sizing: border-box; font-size: 14px; transition: all 0.3s ease; }
        input:focus { border-color: #10b981; outline: none; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2); }
        .btn-accent { background: linear-gradient(135deg, #10b981, #059669); color: #fff; padding: 14px; width: 100%; border: none; border-radius: 12px; font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.2s; margin-top: 10px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }
      `}</style>
    </div>
  );

  return (
    <div className="main-container">
      <header>
        <div className="user-info">
          <div style={{fontSize: '12px', color: '#64748b', textTransform:'uppercase', letterSpacing:'1px'}}>Monev Kas RW 02</div>
          <div style={{fontWeight:'700', fontSize:'22px', color: '#1e293b'}}>{fullName}</div>
        </div>
        <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
          <button onClick={connectPrinter} className={`bt-conn ${isPrinterConnected ? 'active' : ''}`}>
            <span className="dot"></span> {isPrinterConnected ? 'PRINTER READY' : 'HUBUNGKAN'}
          </button>
          <button onClick={() => supabase.auth.signOut()} className="btn-logout">KELUAR</button>
        </div>
      </header>

      <div className="content">
        {tab === 'dashboard' && (
          <>
            <div className="card-summary">
              <div style={{fontSize:'13px', color:'rgba(255,255,255,0.7)', fontWeight: '500'}}>Total Saldo Warga</div>
              <div className="total-saldo">Rp {(list.filter(i=>i.tipe==='masuk').reduce((a,b)=>a+b.nominal,0)-list.filter(i=>i.tipe==='keluar').reduce((a,b)=>a+b.nominal,0)).toLocaleString('id-ID')}</div>
              <div className="grid-info">
                <div className="sub-card">
                  <div className="label">⚡ Total Masuk</div>
                  <div className="val" style={{color: '#34d399'}}>+ {list.filter(i=>i.tipe==='masuk').reduce((a,b)=>a+b.nominal,0).toLocaleString('id-ID')}</div>
                </div>
                <div className="sub-card">
                  <div className="label">💸 Total Keluar</div>
                  <div className="val" style={{color: '#f87171'}}>- {list.filter(i=>i.keluar===0?'':i.tipe==='keluar').reduce((a,b)=>a+b.nominal,0).toLocaleString('id-ID')}</div>
                </div>
              </div>
            </div>
            
            <div className="riwayat-section">
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '15px'}}>
                <h3 style={{margin: 0, fontSize: '16px', color: '#1e293b', fontWeight: '600'}}>Mutasi Kas Terbaru</h3>
                <span style={{fontSize:'12px', color:'#64748b'}}>10 Data Terakhir</span>
              </div>
              <div style={{overflowX:'auto'}}>
                <table>
                  <tbody>
                    {list.slice(0, 10).map(item => (
                      <tr key={item.id}>
                        <td style={{color: '#94a3b8', fontWeight: '500', width: '55px'}}>
                          {new Date(item.created_at).toLocaleDateString('id-ID',{day:'2-digit',month:'short'})}
                        </td>
                        <td style={{fontWeight: '500', color: '#334155'}}>
                          {item.keterangan.split(' (')[0]}
                        </td>
                        <td style={{textAlign:'right', fontWeight:'600', fontSize:'15px', color:item.tipe==='masuk'?'#10b981':'#ef4444'}}>
                          {item.tipe === 'masuk' ? '+' : '-'} {item.nominal.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === 'input' && (
          <div className="page-input-container">
             <div className="badge-type" style={{background: tipe==='masuk'?'rgba(16,185,129,0.15)':'rgba(239,68,68,0.15)', color: tipe==='masuk'?'#10b981':'#ef4444'}}>
                PENCATATAN KAS {tipe.toUpperCase()}
             </div>
             <div className="input-grid-form">
               <div className="input-group">
                  <label>Tanggal Transaksi</label>
                  <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
               </div>
               <div className="input-group">
                  <label>Keterangan Alokasi</label>
                  <input type="text" placeholder="Misal: Iuran Bulanan Warga" value={desc} onChange={e=>setDesc(e.target.value)} />
               </div>
               <div className="input-group">
                  <label>Nominal Tunai (Rp)</label>
                  <input type="number" placeholder="0" value={amount} onChange={e=>setAmount(e.target.value)} />
               </div>
               <div className="input-group">
                  <label>Nama Penyetor / Penanggung Jawab</label>
                  <input type="text" placeholder="Nama Warga / Pengurus" value={penerima} onChange={e=>setPenerima(e.target.value)} />
               </div>
             </div>
             <button className="btn-accent-simpan" onClick={handleSimpan} disabled={loading}>
               {loading ? 'Menyimpan...' : '⚡ SIMPAN & CETAK STRUK'}
             </button>
             <button onClick={()=>setTab('dashboard')} className="btn-cancel">BATALKAN</button>
          </div>
        )}

        {tab === 'report' && (
          <div className="report-container">
             <h3 style={{color: '#1e293b', marginTop: '0', marginBottom: '20px', fontSize: '18px'}}>Arsip Kas Bulanan</h3>
             <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                {[...new Set(list.map(i => {
                   const d = new Date(i.created_at);
                   return `${d.getMonth()}-${d.getFullYear()}`;
                }))].map(period => {
                   const [m, y] = period.split('-');
                   const filtered = filterByMonth(parseInt(m), parseInt(y));
                   const totalM = filtered.filter(f=>f.tipe==='masuk').reduce((a,b)=>a+b.nominal,0);
                   const totalK = filtered.filter(f=>f.tipe==='keluar').reduce((a,b)=>a+b.nominal,0);
                   return (
                     <div key={period} className="report-item">
                        <div className="report-month-title">
                          {new Date(parseInt(y), parseInt(m)).toLocaleDateString('id-ID', {month:'long', year:'numeric'})}
                        </div>
                        <div className="report-details">
                           <div className="rep-box">
                             <span className="rep-lbl">Pemasukan</span>
                             <span className="rep-val" style={{color:'#10b981'}}>Rp {totalM.toLocaleString('id-ID')}</span>
                           </div>
                           <div className="rep-box">
                             <span className="rep-lbl">Pengeluaran</span>
                             <span className="rep-val" style={{color:'#ef4444'}}>Rp {totalK.toLocaleString('id-ID')}</span>
                           </div>
                        </div>
                     </div>
                   );
                })}
             </div>
          </div>
        )}
      </div>

      <nav className="bottom-nav">
        <div className={`nav-item ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}>
          <div className="nav-icon">📊</div>
          <span>Dashboard</span>
        </div>
        {role === 'admin' && (
          <>
            <div className="nav-item-pay masuk" onClick={() => {setTipe('masuk'); setTab('input')}}>
              <div className="pay-circle">+</div>
              <span>Kas Masuk</span>
            </div>
            <div className="nav-item-pay keluar" onClick={() => {setTipe('keluar'); setTab('input')}}>
              <div className="pay-circle">-</div>
              <span>Kas Keluar</span>
            </div>
          </>
        )}
        <div className={`nav-item ${tab === 'report' ? 'active' : ''}`} onClick={() => setTab('report')}>
          <div className="nav-icon">📜</div>
          <span>Laporan</span>
        </div>
      </nav>

      <style>{`
        body { margin: 0; background-color: #f8fafc; }
        .main-container { font-family: 'SF Pro Display', -apple-system, 'Segoe UI', sans-serif; background: #f1f5f9; color: #334155; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
        header { padding: 20px; display:flex; justify-content:space-between; align-items:center; background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(0,0,0,0.05); }
        .btn-logout { background: #fee2e2; border: none; color: #ef4444; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; }
        
        .bt-conn { font-size: 11px; padding: 8px 12px; border-radius: 20px; border: 1px solid #e2e8f0; background: white; color: #334155; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .bt-conn .dot { width: 6px; height: 6px; background: #94a3b8; border-radius: 50%; }
        .bt-conn.active { background: #dcfce7; color: #15803d; border-color: #bbf7d0; }
        .bt-conn.active .dot { background: #22c55e; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { transform: scale(0.9); opacity: 1; } 50% { transform: scale(1.3); opacity: 0.5; } 100% { transform: scale(0.9); opacity: 1; } }
        
        .content { flex: 1; overflow-y: auto; padding: 20px; padding-bottom: 120px; }
        .card-summary { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 24px; padding: 25px; margin-bottom: 25px; box-shadow: 0 12px 24px rgba(15,23,42,0.15); color: white; position: relative; overflow: hidden; }
        .total-saldo { font-size: 34px; font-weight: 800; color: #ffffff; margin: 8px 0 20px 0; letter-spacing: -0.5px; }
        .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .sub-card { background: rgba(255,255,255,0.06); padding: 12px 15px; border-radius: 16px; text-align: left; border: 1px solid rgba(255,255,255,0.04); }
        .sub-card .label { font-size: 11px; color: #94a3b8; margin-bottom: 4px; font-weight: 500; }
        .sub-card .val { font-weight: 700; font-size: 15px; }
        
        .riwayat-section { background: white; border-radius: 24px; padding: 20px; box-shadow: 0 4px 18px rgba(0,0,0,0.03); }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 14px 8px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        
        .page-input-container { background: white; padding: 25px; border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.04); }
        .badge-type { display: inline-block; padding: 6px 12px; border-radius: 30px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 20px; }
        .input-group { margin-bottom: 18px; }
        .input-group label { display: block; font-size: 12px; color: #64748b; margin-bottom: 6px; font-weight: 600; padding-left: 2px; }
        .page-input-container input { width: 100%; background: #f8fafc; border: 1px solid #e2e8f0; color: #1e293b; font-size: 15px; padding: 12px 14px; border-radius: 12px; box-sizing: border-box; }
        .btn-accent-simpan { background: #1e293b; color: white; width: 100%; border: none; padding: 14px; border-radius: 14px; font-weight: 700; font-size: 14px; cursor: pointer; margin-top: 10px; }
        .btn-cancel { background: #f1f5f9; border: none; color: #64748b; width: 100%; margin-top: 10px; padding: 12px; border-radius: 12px; font-size: 13px; font-weight: 600; cursor: pointer; }
        
        .report-container { background: white; padding: 20px; border-radius: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
        .report-item { background: #f8fafc; padding: 16px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 12px; }
        .report-month-title { font-weight: 700; color: #1e293b; font-size: 15px; margin-bottom: 10px; }
        .report-details { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .rep-box { display: flex; flex-direction: column; background: white; padding: 8px 12px; border-radius: 10px; border: 1px solid #f1f5f9; }
        .rep-lbl { font-size: 10px; color: #94a3b8; font-weight: 500; }
        .rep-val { font-size: 13px; font-weight: 700; margin-top: 2px; }
        
        .bottom-nav { position: fixed; bottom: 15px; left: 15px; right: 15px; background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(10px); display: flex; justify-content: space-around; align-items: center; padding: 10px 5px; border-radius: 20px; box-shadow: 0 10px 25px rgba(15,23,42,0.3); box-sizing: border-box; }
        .nav-item { color: #64748b; font-size: 10px; cursor: pointer; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 3px; width: 60px; }
        .nav-icon { font-size: 18px; }
        .nav-item.active { color: #34d399; font-weight: 600; }
        .nav-item-pay { text-align: center; color: #94a3b8; font-size: 9px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .pay-circle { width: 32px; height: 32px; border-radius: 50%; color: white; font-size: 18px; font-weight: bold; display: flex; align-items: center; justify-content: center; }
        .nav-item-pay.masuk .pay-circle { background: #10b981; }
        .nav-item-pay.keluar .pay-circle { background: #ef4444; }
      `}</style>
    </div>
  );
}
