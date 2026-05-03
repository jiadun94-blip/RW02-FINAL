import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [list, setList] = useState<any[]>([]);
  const [tab, setTab] = useState<'dashboard' | 'input'>('dashboard');
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
    } catch (e) { alert("Bluetooth Error!"); }
  };

  const sendToPrinter = async (data: any) => {
    if (!printerCharacteristic) return;
    const encoder = new TextEncoder();
    
    // FORMAT STRUK PERSIS GAMBAR
    const line = "--------------------------------\n";
    const header = "\x1B\x61\x01\x1B\x45\x01BUKTI KAS RW02\nJAMARAS ISTIMEWA\x1B\x45\x00\x1B\x61\x00\n";
    
    const body = 
      line +
      `TGL      : ${data.tgl}\n` +
      `TRX      : UANG ${data.tipe.toUpperCase()}\n` +
      `NOMINAL  : Rp.${data.nominal},-\n` +
      `KET      : ${data.ket}\n` +
      `PETUGAS  : ${data.oleh}\n` +
      line +
      "\x1B\x61\x01SIMPAN STRUK INI SEBAGAI TANDA\nTERIMA\n\n" +
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
            if(error) alert(error.message); else alert("Cek email untuk verifikasi!");
          } else {
            const {error} = await supabase.auth.signInWithPassword({email, password});
            if(error) alert("Login Gagal!");
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
          <div>Selamat Pagi,</div>
          <div style={{fontWeight:'bold', fontSize:'20px'}}>{fullName}</div>
        </div>
        <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
          <button onClick={connectPrinter} className={`bt-conn ${isPrinterConnected ? 'active' : ''}`}>
            {isPrinterConnected ? '✅ PRINTER' : '🔌 KONEK'}
          </button>
          <button onClick={() => supabase.auth.signOut()} style={{background:'none', border:'none', color:'#1a1a1a', fontSize:'12px', fontWeight:'bold'}}>LOGOUT</button>
        </div>
      </header>

      <div className="content">
        {tab === 'dashboard' ? (
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
              <h3>Riwayat Transaksi</h3>
              <table>
                <thead><tr><th>Tgl</th><th>Ket</th><th style={{textAlign:'right'}}>Nominal</th></tr></thead>
                <tbody>
                  {list.map(item => (
                    <tr key={item.id}>
                      <td>{new Date(item.created_at).toLocaleDateString('id-ID',{day:'2-digit',month:'short'})}</td>
                      <td>{item.keterangan.split(' (')[0]}</td>
                      <td style={{textAlign:'right', fontWeight:'bold', color:item.tipe==='masuk'?'#2e7d32':'#c62828'}}>{item.nominal.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="page-input">
             <h2 style={{color:'#d4e157'}}>INPUT {tipe.toUpperCase()}</h2>
             <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
             <input type="text" placeholder="KETERANGAN" value={desc} onChange={e=>setDesc(e.target.value)} />
             <input type="number" placeholder="NOMINAL" value={amount} onChange={e=>setAmount(e.target.value)} />
             <input type="text" placeholder="PENERIMA/PENYETOR" value={penerima} onChange={e=>setPenerima(e.target.value)} />
             <button className="btn-accent" onClick={handleSimpan} disabled={loading}>{loading ? 'PROSES...' : 'SIMPAN & CETAK'}</button>
             <button onClick={()=>setTab('dashboard')} className="btn-cancel">BATAL</button>
          </div>
        )}
      </div>

      <nav className="bottom-nav">
        <div className={`nav-item ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}>Dashboard</div>
        {role === 'admin' && (
          <>
            <div className="nav-item" onClick={() => {setTipe('masuk'); setTab('input')}}>Pemasukan</div>
            <div className="nav-item" onClick={() => {setTipe('keluar'); setTab('input')}}>Pengeluaran</div>
          </>
        )}
      </nav>

      <style>{`
        .main-container { font-family: 'Segoe UI', sans-serif; background: url('bgrw.png') no-repeat center center fixed; background-size: cover; color: white; height: 100vh; display: flex; flex-direction: column; }
        header { padding: 35px 20px 10px 140px; display:flex; justify-content:space-between; align-items:center; }
        .user-info { color: #1a1a1a; line-height: 1.2; }
        .bt-conn { font-size: 10px; padding: 6px 10px; border-radius: 8px; border: none; background: #333; color: white; }
        .bt-conn.active { background: #2e7d32; }
        .content { flex: 1; overflow-y: auto; padding: 15px; padding-bottom: 90px; }
        .card-summary { background: rgba(44, 46, 44, 0.95); border-radius: 15px; padding: 20px; margin-bottom: 20px; }
        .total-saldo { font-size: 38px; font-weight: bold; text-align: center; color: #d4e157; margin: 10px 0; }
        .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .sub-card { background: rgba(0,0,0,0.4); padding: 10px; border-radius: 10px; text-align: center; }
        .label { font-size: 10px; color: #b0b0b0; }
        .val { font-weight: bold; font-size: 14px; }
        .riwayat-section { background: white; color: #333; border-radius: 20px 20px 0 0; padding: 20px; min-height: 500px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 12px 0; border-bottom: 1px solid #f9f9f9; font-size: 13px; }
        .bottom-nav { position: fixed; bottom: 0; width: 100%; background: #2c2e2c; display: flex; justify-content: space-around; padding: 15px 0; }
        .nav-item { color: #888; font-size: 12px; cursor: pointer; }
        .nav-item.active { color: #d4e157; font-weight: bold; border-top: 2px solid #d4e157; padding-top: 5px; }
        .page-input { background: #2c2e2c; padding: 25px; border-radius: 20px; }
        .btn-cancel { background: none; border: none; color: #888; width: 100%; margin-top: 15px; }
      `}</style>
    </div>
  );
}