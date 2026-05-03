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

  const sendToPrinter = async (data: any) => {
    if (!printerCharacteristic) return;
    const encoder = new TextEncoder();
    const line = "--------------------------------\n";
    const br = "\n"; // Jeda antar baris
    
    const header = "\x1B\x61\x01\x1B\x45\x01BUKTI KAS RW02\nJAMARAS ISTIMEWA\x1B\x45\x00\x1B\x61\x00\n" + br;
    
    const body = 
      line + br +
      `TGL      : ${data.tgl}\n` + br +
      `TRX      : UANG ${data.tipe.toUpperCase()}\n` + br +
      `NOMINAL  : Rp.${data.nominal},-\n` + br +
      `KET      : ${data.ket}\n` + br +
      `PETUGAS  : ${data.oleh}\n` + br +
      line + br +
      "\x1B\x61\x01SIMPAN STRUK INI SEBAGAI TANDA\nTERIMA\n" + br +
      "TERIMA KASIH\n" + br +
      "\x1B\x61\x00BENDAHARA\n\n\n" +
      "(              )\n\n\n\n";

    await printerCharacteristic.writeValue(encoder.encode(header + body));
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

  // Logika Laporan
  const filterByMonth = (month: number, year: number) => {
    return list.filter(item => {
      const d = new Date(item.created_at);
      return d.getMonth() === month && d.getFullYear() === year;
    });
  };

  if (!session) return (
    <div className="auth-bg">
      <div className="auth-card">
        <h2 style={{color:'#d4e157'}}>{isSignUp ? 'DAFTAR WARGA' : 'LOGIN KAS RW'}</h2>
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
          <input name="email" type="email" placeholder="Email" required />
          <input name="password" type="password" placeholder="Password" required />
          <button className="btn-accent" type="submit">{loading ? '...' : (isSignUp ? 'DAFTAR' : 'MASUK')}</button>
        </form>
        <p onClick={() => setIsSignUp(!isSignUp)} style={{fontSize:'12px', marginTop:'15px', color:'#aaa', cursor:'pointer'}}>
          {isSignUp ? 'Sudah punya akun? Login' : 'Belum punya akun? Daftar'}
        </p>
      </div>
      <style>{`.auth-bg{background:#1a1a1a;height:100vh;display:flex;align-items:center;justify-content:center;}.auth-card{background:#2c2e2c;padding:30px;border-radius:20px;width:80%;text-align:center;}input{width:100%;padding:12px;margin:8px 0;border-radius:8px;border:1px solid #444;background:#222;color:#fff;box-sizing:border-box;}.btn-accent{background:#d4e157;color:#000;padding:15px;width:100%;border:none;border-radius:10px;font-weight:bold;cursor:pointer;}`}</style>
    </div>
  );

  return (
    <div className="main-container">
      <header>
        <div className="user-info">
          <div>Selamat datang</div>
          <div style={{fontWeight:'bold', fontSize:'20px'}}>{fullName}</div>
        </div>
        <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
          <button onClick={connectPrinter} className={`bt-conn ${isPrinterConnected ? 'active' : ''}`}>
            {isPrinterConnected ? 'PRINTER ON' : 'KONEK PRINTER'}
          </button>
          <button onClick={() => supabase.auth.signOut()} style={{background:'none', border:'none', color:'#1a1a1a', fontSize:'11px', fontWeight:'bold'}}>OUT</button>
        </div>
      </header>

      <div className="content">
        {tab === 'dashboard' && (
          <>
            <div className="card-summary">
              <div style={{fontSize:'12px', color:'#b0b0b0'}}>Saldo Akhir</div>
              <div className="total-saldo">Rp {(list.filter(i=>i.tipe==='masuk').reduce((a,b)=>a+b.nominal,0)-list.filter(i=>i.tipe==='keluar').reduce((a,b)=>a+b.nominal,0)).toLocaleString('id-ID')}</div>
              <div className="grid-info">
                <div className="sub-card">
                  <div className="label">Pemasukan</div>
                  <div className="val">{list.filter(i=>i.tipe==='masuk').reduce((a,b)=>a+b.nominal,0).toLocaleString('id-ID')}</div>
                </div>
                <div className="sub-card">
                  <div className="label">Pengeluaran</div>
                  <div className="val">{list.filter(i=>i.tipe==='keluar').reduce((a,b)=>a+b.nominal,0).toLocaleString('id-ID')}</div>
                </div>
              </div>
            </div>
            <div className="riwayat-section">
              <h3>Riwayat Terkini</h3>
              <table>
                <tbody>
                  {list.slice(0, 10).map(item => (
                    <tr key={item.id}>
                      <td style={{fontSize:'11px'}}>{new Date(item.created_at).toLocaleDateString('id-ID',{day:'2-digit',month:'short'})}</td>
                      <td>{item.keterangan.split(' (')[0]}</td>
                      <td style={{textAlign:'right', fontWeight:'bold', color:item.tipe==='masuk'?'#2e7d32':'#c62828'}}>{item.nominal.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'input' && (
          <div className="page-input-container">
             <h2 style={{color:'#d4e157', marginBottom:'20px'}}>INPUT {tipe.toUpperCase()}</h2>
             <div className="input-group">
                <label>Tanggal</label>
                <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
             </div>
             <div className="input-group">
                <label>Keterangan</label>
                <input type="text" placeholder="Contoh: Iuran Keamanan" value={desc} onChange={e=>setDesc(e.target.value)} />
             </div>
             <div className="input-group">
                <label>Nominal (Rp)</label>
                <input type="number" placeholder="0" value={amount} onChange={e=>setAmount(e.target.value)} />
             </div>
             <div className="input-group">
                <label>Petugas/Penerima</label>
                <input type="text" placeholder="Nama Petugas" value={penerima} onChange={e=>setPenerima(e.target.value)} />
             </div>
             <button className="btn-accent" style={{marginTop:'20px'}} onClick={handleSimpan} disabled={loading}>{loading ? 'MENYIMPAN...' : 'SIMPAN & CETAK STRUK'}</button>
             <button onClick={()=>setTab('dashboard')} className="btn-cancel">KEMBALI KE DASHBOARD</button>
          </div>
        )}

        {tab === 'report' && (
          <div className="riwayat-section" style={{borderRadius:'20px', marginTop:'0'}}>
             <h3 style={{marginBottom:'15px'}}>Laporan Kas Per Bulan</h3>
             <div style={{maxHeight:'70vh', overflowY:'auto'}}>
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
                        <div style={{fontWeight:'bold', borderBottom:'1px solid #eee', paddingBottom:'5px', marginBottom:'5px'}}>
                          {new Date(parseInt(y), parseInt(m)).toLocaleDateString('id-ID', {month:'long', year:'numeric'})}
                        </div>
                        <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px'}}>
                           <span>Masuk: <b style={{color:'green'}}>{totalM.toLocaleString('id-ID')}</b></span>
                           <span>Keluar: <b style={{color:'red'}}>{totalK.toLocaleString('id-ID')}</b></span>
                        </div>
                     </div>
                   );
                })}
             </div>
          </div>
        )}
      </div>

      <nav className="bottom-nav">
        <div className={`nav-item ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}>Beranda</div>
        {role === 'admin' && (
          <>
            <div className="nav-item" onClick={() => {setTipe('masuk'); setTab('input')}}>Kas Masuk</div>
            <div className="nav-item" onClick={() => {setTipe('keluar'); setTab('input')}}>Kas Keluar</div>
          </>
        )}
        <div className={`nav-item ${tab === 'report' ? 'active' : ''}`} onClick={() => setTab('report')}>Laporan</div>
      </nav>

      <style>{`
        .main-container { font-family: 'Segoe UI', sans-serif; background: url('bgrw.png') no-repeat center center fixed; background-size: cover; color: white; height: 100vh; display: flex; flex-direction: column; }
        header { padding: 35px 20px 10px 140px; display:flex; justify-content:space-between; align-items:center; }
        .user-info { color: #1a1a1a; line-height: 1.2; }
        .bt-conn { font-size: 9px; padding: 6px 8px; border-radius: 8px; border: none; background: #333; color: white; font-weight: bold; }
        .bt-conn.active { background: #2e7d32; }
        .content { flex: 1; overflow-y: auto; padding: 15px; padding-bottom: 100px; }
        .card-summary { background: rgba(44, 46, 44, 0.95); border-radius: 15px; padding: 20px; margin-bottom: 20px; }
        .total-saldo { font-size: 38px; font-weight: bold; text-align: center; color: #d4e157; margin: 10px 0; }
        .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .sub-card { background: rgba(0,0,0,0.4); padding: 10px; border-radius: 10px; text-align: center; }
        .label { font-size: 10px; color: #b0b0b0; }
        .val { font-weight: bold; font-size: 14px; }
        .riwayat-section { background: white; color: #333; border-radius: 20px; padding: 20px; margin-top: 10px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 12px 0; border-bottom: 1px solid #f9f9f9; font-size: 13px; }
        .bottom-nav { position: fixed; bottom: 0; width: 100%; background: #2c2e2c; display: flex; justify-content: space-around; padding: 15px 0; border-radius: 20px 20px 0 0; }
        .nav-item { color: #888; font-size: 11px; cursor: pointer; text-align: center; }
        .nav-item.active { color: #d4e157; font-weight: bold; }
        
        /* Gaya Input yang Lebih Friendly */
        .page-input-container { background: #2c2e2c; padding: 25px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .input-group { margin-bottom: 15px; text-align: left; }
        .input-group label { display: block; font-size: 12px; color: #d4e157; margin-bottom: 5px; margin-left: 5px; }
        .btn-cancel { background: none; border: 1px solid #555; color: #888; width: 100%; margin-top: 15px; padding: 12px; border-radius: 10px; font-size: 12px; }
        
        .report-item { background: #f9f9f9; padding: 12px; border-radius: 10px; margin-bottom: 10px; border: 1px solid #eee; }
      `}</style>
    </div>
  );
}