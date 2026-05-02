import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [list, setList] = useState<any[]>([]);
  const [tab, setTab] = useState<'dashboard' | 'input'>('dashboard');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Bluetooth State
  const [printerCharacteristic, setPrinterCharacteristic] = useState<any>(null);
  const [isPrinterConnected, setIsPrinterConnected] = useState(false);

  // Form State
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

  // --- LOGIKA BLUETOOTH ---
  const connectPrinter = async () => {
    try {
      // Mencari perangkat Bluetooth yang mendukung service printer
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
      
      setPrinterCharacteristic(characteristic);
      setIsPrinterConnected(true);
      alert("Printer Terkoneksi!");
    } catch (error) {
      console.error(error);
      alert("Gagal koneksi printer. Pastikan Bluetooth aktif.");
    }
  };

  const sendToPrinter = async (data: any) => {
    if (!printerCharacteristic) return;

    const encoder = new TextEncoder();
    const separator = "--------------------------------\n";
    const header = "\x1B\x61\x01" + "\x1B\x45\x01" + "BUKTI KAS RW 02\n" + "JAMARAS ISTIMEWA\n" + "\x1B\x45\x00" + "\x1B\x61\x00";
    
    const content = 
      separator +
      `Tgl  : ${data.tgl}\n` +
      `Tipe : ${data.tipe.toUpperCase()}\n` +
      `Ket  : ${data.ket}\n` +
      `Oleh : ${data.oleh}\n` +
      separator +
      "\x1B\x61\x02" + `TOTAL: Rp ${data.nominal}\n\n` + "\x1B\x61\x00" +
      "\x1B\x61\x01" + "Simpan struk ini sebagai\nbukti transaksi sah.\n\n\n\n";

    await printerCharacteristic.writeValue(encoder.encode(header + content));
  };

  const handleSimpan = async () => {
    if (!amount || !desc) return alert("Lengkapi data!");
    setLoading(true);

    const nominalFix = parseInt(amount);
    const ketFix = desc.toUpperCase();
    const olehFix = penerima.toUpperCase();

    const { error } = await supabase.from('transaksi').insert([{ 
      keterangan: `${ketFix} (OLEH: ${olehFix})`, 
      nominal: nominalFix, 
      tipe, 
      created_at: new Date(date).toISOString() 
    }]);

    if (!error) {
      await fetchData();
      if (isPrinterConnected) {
        await sendToPrinter({
          tgl: date,
          tipe: tipe,
          ket: ketFix,
          oleh: olehFix,
          nominal: nominalFix.toLocaleString('id-ID')
        });
      }
      alert("Data Tersimpan!");
      setAmount(''); setDesc(''); setPenerima('');
      setTab('dashboard');
    } else {
      alert("Error: " + error.message);
    }
    setLoading(false);
  };

  const totalMasuk = list.filter(i => i.tipe === 'masuk').reduce((a, b) => a + b.nominal, 0);
  const totalKeluar = list.filter(i => i.tipe === 'keluar').reduce((a, b) => a + b.nominal, 0);

  if (!session) return (
    <div className="auth-bg">
      <div className="auth-card">
        <h2 style={{color:'#d4e157'}}>KAS RW 02</h2>
        <form onSubmit={async (e:any) => {
          e.preventDefault();
          const {error} = await supabase.auth.signInWithPassword({email: e.target.email.value, password: e.target.password.value});
          if(error) alert("Login Salah");
        }}>
          <input name="email" type="email" placeholder="Email" />
          <input name="password" type="password" placeholder="Password" />
          <button className="btn-accent">LOGIN</button>
        </form>
      </div>
      <style>{`.auth-bg { background:#1a1a1a; height:100vh; display:flex; align-items:center; justify-content:center; } .auth-card { background:#2c2e2c; padding:30px; border-radius:20px; width:80%; text-align:center; } input { width:100%; padding:12px; margin:8px 0; border-radius:8px; border:1px solid #444; background:#222; color:#fff; box-sizing:border-box; } .btn-accent { background:#d4e157; color:#000; padding:15px; width:100%; border:none; border-radius:10px; font-weight:bold; cursor:pointer; }`}</style>
    </div>
  );

  return (
    <div className="main-container">
      <header>
        <div className="user-info">
          <div>Selamat Pagi,</div>
          <div style={{fontWeight:'bold', fontSize:'20px'}}>{fullName}</div>
        </div>
        <button onClick={connectPrinter} className={`bt-conn ${isPrinterConnected ? 'active' : ''}`}>
          {isPrinterConnected ? '✅ PRINTER' : '🔌 HUBUNGKAN PRINTER'}
        </button>
      </header>

      <div className="content">
        {tab === 'dashboard' && (
          <>
            <div className="card-summary">
              <div style={{fontSize:'12px', color:'#b0b0b0'}}>Saldo Akhir</div>
              <div className="total-saldo">Rp {(totalMasuk - totalKeluar).toLocaleString('id-ID')}</div>
              <div className="grid-info">
                <div className="sub-card">
                  <div className="label">Pemasukan</div>
                  <div className="val">{totalMasuk.toLocaleString('id-ID')}</div>
                </div>
                <div className="sub-card">
                  <div className="label">Pengeluaran</div>
                  <div className="val">{totalKeluar.toLocaleString('id-ID')}</div>
                </div>
              </div>
            </div>

            <div className="riwayat-section">
              <h3>Riwayat Transaksi</h3>
              <table>
                <thead>
                  <tr><th>Tanggal</th><th>Keterangan</th><th style={{textAlign:'right'}}>Nominal</th></tr>
                </thead>
                <tbody>
                  {list.map(item => (
                    <tr key={item.id}>
                      <td>{new Date(item.created_at).toLocaleDateString('id-ID', {day:'2-digit', month:'short'})}</td>
                      <td style={{fontSize:'10px'}}>{item.keterangan.split(' (')[0]}</td>
                      <td style={{textAlign:'right', fontWeight:'bold', color: item.tipe === 'masuk' ? '#2e7d32' : '#c62828'}}>
                        {item.nominal.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'input' && (
          <div className="page-input">
             <h2 style={{color:'#d4e157'}}>Input {tipe.toUpperCase()}</h2>
             <input type="date" value={date} onChange={e => setDate(e.target.value)} />
             <input type="text" placeholder="Keterangan" value={desc} onChange={e => setDesc(e.target.value)} />
             <input type="number" placeholder="Nominal" value={amount} onChange={e => setAmount(e.target.value)} />
             <input type="text" placeholder="Penyetor/Penerima" value={penerima} onChange={e => setPenerima(e.target.value)} />
             <button className="btn-accent" onClick={handleSimpan} disabled={loading}>
               {loading ? 'PROSES...' : 'SIMPAN & CETAK'}
             </button>
             <button onClick={() => setTab('dashboard')} className="btn-cancel">BATAL</button>
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
        .main-container {
          font-family: 'Segoe UI', sans-serif;
          background: url('bgrw.png') no-repeat center center fixed;
          background-size: cover; color: white; height: 100vh; display: flex; flex-direction: column;
        }
        header { padding: 35px 20px 10px 140px; display:flex; justify-content:space-between; align-items:center; }
        .user-info { color: #1a1a1a; line-height: 1.2; }
        .bt-conn { font-size: 10px; padding: 8px; border-radius: 8px; border: none; background: #333; color: white; cursor: pointer; }
        .bt-conn.active { background: #2e7d32; }
        .content { flex: 1; overflow-y: auto; padding: 15px; padding-bottom: 90px; }
        .card-summary { background: rgba(44, 46, 44, 0.95); border-radius: 15px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); margin-bottom: 20px; }
        .total-saldo { font-size: 38px; font-weight: bold; text-align: center; color: #d4e157; margin: 10px 0; }
        .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .sub-card { background: rgba(0,0,0,0.4); padding: 10px; border-radius: 10px; text-align: center; }
        .label { fontSize: 10px; color: #b0b0b0; }
        .val { font-weight: bold; font-size: 14px; }
        .riwayat-section { background: white; color: #333; border-radius: 20px 20px 0 0; padding: 20px; min-height: 400px; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; font-size: 12px; color: #888; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        td { padding: 12px 0; border-bottom: 1px solid #f9f9f9; font-size: 13px; }
        .bottom-nav { position: fixed; bottom: 0; width: 100%; background: #2c2e2c; display: flex; justify-content: space-around; padding: 15px 0; }
        .nav-item { color: #888; font-size: 12px; cursor: pointer; }
        .nav-item.active { color: #d4e157; font-weight: bold; border-top: 2px solid #d4e157; padding-top: 5px; }
        .page-input { background: #2c2e2c; padding: 25px; border-radius: 20px; }
        .btn-cancel { background: none; border: none; color: #888; width: 100%; margin-top: 15px; cursor: pointer; }
        input { width: 100%; padding: 12px; margin: 8px 0; border-radius: 8px; border: 1px solid #444; background: #222; color: #fff; box-sizing: border-box; }
      `}</style>
    </div>
  );
}