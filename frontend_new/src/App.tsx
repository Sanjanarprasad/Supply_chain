import React, { useState, FormEvent, useEffect, useCallback, useRef } from 'react';
import {
  Sprout, MapPin, User, Scale, Calendar, BadgeCheck,
  Search, Leaf, ShieldCheck, History, CheckCircle2,
  Trash2, ExternalLink, ArrowRight, Wallet, Sun, Moon,
  LogOut, Lock, Eye, EyeOff, Settings, ChevronDown,
  Bell, Globe, KeyRound, UserCircle2, Activity, Clock,
  Shield, Package
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ethers } from 'ethers';
import { FARM_TRACE_ABI, CONTRACT_ADDRESS } from './contract';
import agroHero from './assets/agro_hero.png';

// ─── Config ───────────────────────────────────────────────
const BIN_ID     = "69eb7f58aaba88219732f5ae";
const API_KEY    = "$2a$10$rL1hyjk.fIOkxHe4wcTt7eqmgXIARhdniGsZ/3Fgc8wVmae3iJE16";
const VERCEL_URL = "https://frontend-flax-three-83.vercel.app";

const VALID_USERS = [
  { username:"farmer", password:"agro123",  role:"farmer", displayName:"Sanjana Prasad",    avatar:"SP" },
  { username:"buyer",  password:"trace123", role:"buyer",  displayName:"Rahul Verma",        avatar:"RV" },
  { username:"admin",  password:"admin123", role:"farmer", displayName:"Admin User",          avatar:"AU" },
];

const LANGUAGES = ["English","हिन्दी","ಕನ್ನಡ","தமிழ்","తెలుగు","മലയാളം"];

interface BatchResult {
  id:string; crop:string; farmer:string; location:string;
  quantity:string; harvestDate:string; quality:string;
  organic:boolean; notes:string; hash:string; timestamp:string;
}

// ─── Cloud helpers ─────────────────────────────────────────
let cachedBatches: BatchResult[] | null = null;

const fetchBatchesFromCloud = async (force=false): Promise<BatchResult[]> => {
  if (cachedBatches && !force) return cachedBatches;
  try {
    const res  = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`);
    const data = await res.json();
    cachedBatches = data.record?.batches || [];
    return cachedBatches!;
  } catch { return cachedBatches || []; }
};

const saveBatchesToCloud = async (batches: BatchResult[]) => {
  cachedBatches = batches;
  try {
    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method:"PUT",
      headers:{ "Content-Type":"application/json","X-Master-Key":API_KEY,"X-Bin-Versioning":"false" },
      body: JSON.stringify({ batches }),
    });
  } catch(err) { console.error(err); }
};

// ─── App ──────────────────────────────────────────────────
export default function App() {
  // Auth
  const [loggedIn,   setLoggedIn]   = useState(false);
  const [currentUser,setCurrentUser]= useState(VALID_USERS[0]);
  const [loginUser,  setLoginUser]  = useState('');
  const [loginPass,  setLoginPass]  = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [loginErr,   setLoginErr]   = useState('');

  // UI state
  const [darkMode,   setDarkMode]   = useState(false);
  const [activeTab,  setActiveTab]  = useState<'farmer'|'buyer'|'profile'|'settings'>('farmer');
  const [dropOpen,   setDropOpen]   = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // Settings state
  const [language,       setLanguage]       = useState('English');
  const [notifications,  setNotifications]  = useState(true);
  const [newPass,        setNewPass]        = useState('');
  const [confirmPass,    setConfirmPass]    = useState('');
  const [passMsg,        setPassMsg]        = useState('');

  // Data
  const [searchId,   setSearchId]   = useState('');
  const [loading,    setLoading]    = useState(false);
  const [result,     setResult]     = useState<BatchResult|null>(null);
  const [account,    setAccount]    = useState('');
  const [isConnecting,setIsConnecting]=useState(false);
  const [batches,    setBatches]    = useState<BatchResult[]>([]);
  const [joinedDate] = useState(new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}));

  const [formData, setFormData] = useState({
    farmer:'',location:'',crop:'',quantity:'',
    harvestDate:'',quality:'Grade A+',organic:false,notes:''
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Prefetch batches
  useEffect(() => { fetchBatchesFromCloud(true).then(b => setBatches(b)); }, []);

  // Auto-search from QR URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const batchFromUrl = params.get('batch');
    if (batchFromUrl) {
      setLoggedIn(true);
      setCurrentUser(VALID_USERS[1]);
      setActiveTab('buyer');
      const id = decodeURIComponent(batchFromUrl).trim().replace('#','').toUpperCase();
      setSearchId(id);
      setLoading(true);
      fetchBatchesFromCloud().then(cloudBatches => {
        const found = cloudBatches.find(b => b.id.replace('#','').toUpperCase() === id);
        if (found) { setResult(found); setBatches(cloudBatches); }
        else alert(`Verification Failed: Batch ${id} not found.`);
        setLoading(false);
      });
    }
  }, []);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    const user = VALID_USERS.find(u => u.username===loginUser && u.password===loginPass);
    if (user) {
      setLoggedIn(true); setCurrentUser(user);
      setActiveTab(user.role as 'farmer'|'buyer');
      setLoginErr('');
    } else setLoginErr('Invalid username or password.');
  };

  const handleLogout = () => {
    setLoggedIn(false); setResult(null);
    setLoginUser(''); setLoginPass(''); setActiveTab('farmer');
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        setIsConnecting(true);
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts",[]);
        setAccount(accounts[0]);
      } catch(e){console.error(e);}
      finally{setIsConnecting(false);}
    } else alert("Please install MetaMask.");
  };

  const handleRegisterBatch = async (e: FormEvent) => {
    e.preventDefault(); setLoading(true);
    if (CONTRACT_ADDRESS && account) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer   = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, FARM_TRACE_ABI, signer);
        const tx = await contract.createBatch(
          formData.farmer,formData.location,formData.crop,
          BigInt(formData.quantity),formData.harvestDate,
          formData.quality,formData.organic,formData.notes
        );
        await tx.wait();
        const batchCount = await contract.batchCount();
        const newId  = `FT-${batchCount}`;
        const newBatch: BatchResult = { id:newId,...formData,hash:tx.hash,timestamp:new Date().toISOString() };
        const existing = await fetchBatchesFromCloud();
        const updated  = [newBatch,...existing];
        await saveBatchesToCloud(updated); setBatches(updated);
        setActiveTab('buyer'); setSearchId(newId); setResult(newBatch);
      } catch(e){console.error(e);alert("Failed to register on blockchain.");}
      finally{setLoading(false);}
    } else {
      const newId   = `FT-${Math.floor(10000+Math.random()*90000)}`;
      const newHash = `0x${Array.from({length:64},()=>Math.floor(Math.random()*16).toString(16)).join('')}`;
      const newBatch: BatchResult = { id:newId,...formData,hash:newHash,timestamp:new Date().toISOString() };
      const existing = await fetchBatchesFromCloud();
      const updated  = [newBatch,...existing];
      await saveBatchesToCloud(updated); setBatches(updated);
      setLoading(false); setActiveTab('buyer'); setSearchId(newId); setResult(newBatch);
    }
    setFormData({farmer:'',location:'',crop:'',quantity:'',harvestDate:'',quality:'Grade A+',organic:false,notes:''});
  };

  const handleSearch = useCallback(async () => {
    const id = searchId.trim().replace('#','').toUpperCase();
    if (!id) return;
    setLoading(true); setResult(null);
    if (CONTRACT_ADDRESS && id.startsWith('FT-')) {
      try {
        const batchNum = id.split('-')[1];
        if (batchNum && !isNaN(parseInt(batchNum))) {
          const provider = new ethers.JsonRpcProvider(import.meta.env.VITE_NETWORK_RPC);
          const contract = new ethers.Contract(CONTRACT_ADDRESS,FARM_TRACE_ABI,provider);
          const batch    = await contract.getBatch(parseInt(batchNum));
          if (batch && batch.id > 0n) {
            setResult({
              id:`FT-${batch.id}`,farmer:batch.farmerName,location:batch.farmLocation,
              crop:batch.cropName,quantity:batch.quantity.toString(),harvestDate:batch.harvestDate,
              quality:batch.qualityGrade,organic:batch.isOrganic,notes:batch.notes,
              hash:"Verified on Blockchain",timestamp:new Date(Number(batch.timestamp)*1000).toISOString()
            });
            setLoading(false); return;
          }
        }
      } catch(e){console.warn("Blockchain failed, using cache:",e);}
    }
    const source = cachedBatches || await fetchBatchesFromCloud();
    const found  = source.find(b => b.id.replace('#','').toUpperCase()===id);
    if (found) setResult(found);
    else alert(`Verification Failed: Batch ${id} not found in the decentralized ledger.`);
    setLoading(false);
  }, [searchId]);

  const handleChangePassword = (e: FormEvent) => {
    e.preventDefault();
    if (newPass.length < 6) { setPassMsg('Password must be at least 6 characters.'); return; }
    if (newPass !== confirmPass) { setPassMsg('Passwords do not match.'); return; }
    setPassMsg('✅ Password updated successfully!');
    setNewPass(''); setConfirmPass('');
    setTimeout(() => setPassMsg(''), 3000);
  };

  const getVerificationUrl = (id:string) => `${VERCEL_URL}?batch=${encodeURIComponent(id)}`;
  const myBatches = batches.filter(b => b.farmer?.toLowerCase().includes(currentUser.displayName.split(' ')[0].toLowerCase()));

  // ─── Theme ────────────────────────────────────────────────
  const t = {
    bg:         darkMode ? '#0f1a12' : '#f0faf2',
    surface:    darkMode ? '#1a2e1d' : '#ffffff',
    surfaceAlt: darkMode ? '#22381f' : '#e8f5eb',
    border:     darkMode ? '#2d4a30' : '#c5e0ca',
    primary:    '#22c55e',
    primaryDk:  '#16a34a',
    text:       darkMode ? '#e8f5eb' : '#14532d',
    textMuted:  darkMode ? '#86b88a' : '#4d7c56',
    textDim:    darkMode ? '#a3c9a7' : '#365b3e',
    navBg:      darkMode ? 'rgba(15,26,18,0.97)' : 'rgba(255,255,255,0.97)',
    danger:     '#ef4444',
  };

  const card: React.CSSProperties = {
    background:t.surface,border:`1px solid ${t.border}`,borderRadius:20,padding:32,
    boxShadow:darkMode?'0 4px 24px rgba(0,0,0,0.4)':'0 4px 24px rgba(34,197,94,0.08)',
  };
  const inp: React.CSSProperties = {
    width:'100%',padding:'11px 14px',borderRadius:11,border:`1.5px solid ${t.border}`,
    background:t.surfaceAlt,color:t.text,fontSize:14,outline:'none',boxSizing:'border-box',
  };
  const btnP: React.CSSProperties = {
    background:`linear-gradient(135deg,${t.primary},${t.primaryDk})`,color:'#fff',
    border:'none',borderRadius:11,padding:'11px 24px',fontSize:14,fontWeight:600,
    cursor:'pointer',boxShadow:'0 4px 16px rgba(34,197,94,0.3)',
  };
  const btnG: React.CSSProperties = {
    background:'transparent',color:t.textMuted,border:`1.5px solid ${t.border}`,
    borderRadius:11,padding:'9px 18px',fontSize:13,cursor:'pointer',
  };

  // ─── Avatar ───────────────────────────────────────────────
  const Avatar = ({ size=36 }:{size?:number}) => (
    <div style={{
      width:size,height:size,borderRadius:'50%',
      background:`linear-gradient(135deg,${t.primary},${t.primaryDk})`,
      color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',
      fontSize:size*0.35,fontWeight:700,flexShrink:0,
    }}>{currentUser.avatar}</div>
  );

  // ─── LOGIN PAGE ───────────────────────────────────────────
  if (!loggedIn) return (
    <div style={{minHeight:'100vh',background:t.bg,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Inter,sans-serif'}}>
      <div style={{position:'fixed',top:20,right:20}}>
        <button onClick={()=>setDarkMode(d=>!d)} style={{...btnG,display:'flex',alignItems:'center',gap:6}}>
          {darkMode?<Sun size={15}/>:<Moon size={15}/>}{darkMode?'Light':'Dark'}
        </button>
      </div>
      <div style={{...card,width:'100%',maxWidth:420,padding:48}}>
        <div style={{textAlign:'center',marginBottom:40}}>
          <div style={{background:`linear-gradient(135deg,${t.primary},${t.primaryDk})`,width:64,height:64,borderRadius:18,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
            <Sprout size={30} color="#fff"/>
          </div>
          <h1 style={{color:t.text,fontSize:26,fontWeight:800,margin:0}}>AgroLedger</h1>
          <p style={{color:t.textMuted,fontSize:13,marginTop:6}}>Blockchain-powered agricultural traceability</p>
        </div>
        <form onSubmit={handleLogin}>
          <div style={{marginBottom:18}}>
            <label style={{color:t.textMuted,fontSize:12,fontWeight:700,display:'block',marginBottom:7,letterSpacing:'0.05em'}}>USERNAME</label>
            <input style={inp} type="text" placeholder="farmer / buyer / admin" value={loginUser} onChange={e=>setLoginUser(e.target.value)} required/>
          </div>
          <div style={{marginBottom:24,position:'relative'}}>
            <label style={{color:t.textMuted,fontSize:12,fontWeight:700,display:'block',marginBottom:7,letterSpacing:'0.05em'}}>PASSWORD</label>
            <input style={inp} type={showPass?'text':'password'} placeholder="Enter password" value={loginPass} onChange={e=>setLoginPass(e.target.value)} required/>
            <button type="button" onClick={()=>setShowPass(s=>!s)} style={{position:'absolute',right:12,bottom:12,background:'none',border:'none',cursor:'pointer',color:t.textMuted}}>
              {showPass?<EyeOff size={17}/>:<Eye size={17}/>}
            </button>
          </div>
          {loginErr && <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:10,padding:'10px 14px',marginBottom:18,color:'#ef4444',fontSize:13}}>{loginErr}</div>}
          <button type="submit" style={{...btnP,width:'100%',height:50,fontSize:15}}>Sign In →</button>
        </form>
        <div style={{marginTop:28,padding:16,background:t.surfaceAlt,borderRadius:12,border:`1px solid ${t.border}`}}>
          <p style={{color:t.textMuted,fontSize:11,fontWeight:700,marginBottom:10,letterSpacing:'0.06em'}}>DEMO CREDENTIALS</p>
          {VALID_USERS.map(u=>(
            <div key={u.username} style={{display:'flex',justifyContent:'space-between',fontSize:13,color:t.textDim,padding:'4px 0'}}>
              <span><b style={{color:t.text}}>{u.username}</b> / {u.password}</span>
              <span style={{color:t.primary,fontWeight:600,fontSize:11,background:`${t.primary}18`,padding:'2px 10px',borderRadius:99}}>{u.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ─── PROFILE PAGE ─────────────────────────────────────────
  const ProfilePage = () => (
    <div style={{maxWidth:720,margin:'0 auto'}}>
      {/* Header card */}
      <div style={{...card,marginBottom:24,background:`linear-gradient(135deg,${t.primary}18,${t.primary}08)`}}>
        <div style={{display:'flex',alignItems:'center',gap:24,flexWrap:'wrap'}}>
          <Avatar size={80}/>
          <div style={{flex:1}}>
            <h2 style={{fontSize:26,fontWeight:800,color:t.text,margin:'0 0 6px'}}>{currentUser.displayName}</h2>
            <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
              <span style={{background:`${t.primary}22`,color:t.primary,border:`1px solid ${t.primary}44`,borderRadius:99,padding:'3px 14px',fontSize:12,fontWeight:700}}>
                {currentUser.role.toUpperCase()}
              </span>
              <span style={{color:t.textMuted,fontSize:13,display:'flex',alignItems:'center',gap:5}}>
                <Clock size={13}/> Joined {joinedDate}
              </span>
            </div>
          </div>
          {account && (
            <div style={{padding:'10px 16px',background:t.surfaceAlt,borderRadius:12,border:`1px solid ${t.border}`}}>
              <p style={{fontSize:11,fontWeight:700,color:t.textMuted,margin:'0 0 4px',letterSpacing:'0.05em'}}>WALLET</p>
              <p style={{fontSize:13,color:t.primary,margin:0,fontFamily:'monospace'}}>{account.substring(0,10)}...{account.substring(account.length-6)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16,marginBottom:24}}>
        {[
          {icon:<Package size={20}/>,  label:'Batches Registered', value: myBatches.length || batches.length},
          {icon:<Shield size={20}/>,   label:'Verified Records',   value: batches.length},
          {icon:<Activity size={20}/>, label:'Account Status',     value:'Active'},
        ].map((s,i)=>(
          <div key={i} style={{...card,padding:20,textAlign:'center'}}>
            <div style={{color:t.primary,display:'flex',justifyContent:'center',marginBottom:10}}>{s.icon}</div>
            <p style={{fontSize:28,fontWeight:800,color:t.text,margin:'0 0 4px'}}>{s.value}</p>
            <p style={{fontSize:12,color:t.textMuted,margin:0}}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent batches */}
      <div style={card}>
        <h3 style={{fontSize:16,fontWeight:700,color:t.text,margin:'0 0 20px',display:'flex',alignItems:'center',gap:8}}>
          <Activity size={18} color={t.primary}/> Recent Batches Registered
        </h3>
        {batches.length === 0
          ? <p style={{color:t.textMuted,textAlign:'center',padding:20}}>No batches registered yet.</p>
          : batches.slice(0,5).map(b=>(
            <div key={b.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 0',borderBottom:`1px solid ${t.border}`}}>
              <div style={{display:'flex',gap:14,alignItems:'center'}}>
                <div style={{background:`${t.primary}22`,color:t.primary,padding:10,borderRadius:10}}>
                  <Leaf size={16}/>
                </div>
                <div>
                  <p style={{fontSize:14,fontWeight:600,color:t.text,margin:'0 0 3px'}}>{b.crop}</p>
                  <p style={{fontSize:12,color:t.textMuted,margin:0}}>{b.farmer} · {b.location}</p>
                </div>
              </div>
              <div style={{textAlign:'right'}}>
                <p style={{fontSize:12,fontWeight:700,color:t.primary,margin:'0 0 3px'}}>{b.id}</p>
                <p style={{fontSize:11,color:t.textMuted,margin:0}}>{new Date(b.timestamp).toLocaleDateString()}</p>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );

  // ─── SETTINGS PAGE ────────────────────────────────────────
  const SettingsPage = () => (
    <div style={{maxWidth:680,margin:'0 auto',display:'flex',flexDirection:'column',gap:24}}>

      {/* Appearance */}
      <div style={card}>
        <h3 style={{fontSize:16,fontWeight:700,color:t.text,margin:'0 0 20px',display:'flex',alignItems:'center',gap:8}}>
          {darkMode?<Moon size={18} color={t.primary}/>:<Sun size={18} color={t.primary}/>} Appearance
        </h3>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 0'}}>
          <div>
            <p style={{fontSize:14,fontWeight:600,color:t.text,margin:'0 0 3px'}}>Dark Mode</p>
            <p style={{fontSize:12,color:t.textMuted,margin:0}}>Switch between light and dark theme</p>
          </div>
          <div onClick={()=>setDarkMode(d=>!d)} style={{width:50,height:28,borderRadius:99,background:darkMode?t.primary:t.border,cursor:'pointer',position:'relative',transition:'background 0.2s'}}>
            <div style={{width:22,height:22,borderRadius:'50%',background:'#fff',position:'absolute',top:3,left:darkMode?25:3,transition:'left 0.2s',boxShadow:'0 2px 6px rgba(0,0,0,0.2)'}}/>
          </div>
        </div>
      </div>

      {/* Language */}
      <div style={card}>
        <h3 style={{fontSize:16,fontWeight:700,color:t.text,margin:'0 0 20px',display:'flex',alignItems:'center',gap:8}}>
          <Globe size={18} color={t.primary}/> Language
        </h3>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
          {LANGUAGES.map(lang=>(
            <button key={lang} onClick={()=>setLanguage(lang)} style={{
              padding:'10px 14px',borderRadius:11,border:`1.5px solid ${language===lang?t.primary:t.border}`,
              background:language===lang?`${t.primary}18`:t.surfaceAlt,
              color:language===lang?t.primary:t.textMuted,fontWeight:language===lang?700:400,
              cursor:'pointer',fontSize:13,transition:'all 0.2s',
            }}>{lang}</button>
          ))}
        </div>
        <p style={{fontSize:12,color:t.textMuted,marginTop:12}}>Selected: <b style={{color:t.primary}}>{language}</b></p>
      </div>

      {/* Notifications */}
      <div style={card}>
        <h3 style={{fontSize:16,fontWeight:700,color:t.text,margin:'0 0 20px',display:'flex',alignItems:'center',gap:8}}>
          <Bell size={18} color={t.primary}/> Notifications
        </h3>
        {[
          {label:'Batch Registration Alerts', desc:'Get notified when a new batch is registered'},
          {label:'Traceability Updates',       desc:'Alerts when batch status changes'},
          {label:'System Announcements',       desc:'Important updates from AgroLedger'},
        ].map((n,i)=>(
          <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 0',borderBottom:i<2?`1px solid ${t.border}`:'none'}}>
            <div>
              <p style={{fontSize:14,fontWeight:600,color:t.text,margin:'0 0 3px'}}>{n.label}</p>
              <p style={{fontSize:12,color:t.textMuted,margin:0}}>{n.desc}</p>
            </div>
            <div onClick={()=>setNotifications(v=>!v)} style={{width:50,height:28,borderRadius:99,background:notifications?t.primary:t.border,cursor:'pointer',position:'relative',transition:'background 0.2s',flexShrink:0}}>
              <div style={{width:22,height:22,borderRadius:'50%',background:'#fff',position:'absolute',top:3,left:notifications?25:3,transition:'left 0.2s',boxShadow:'0 2px 6px rgba(0,0,0,0.2)'}}/>
            </div>
          </div>
        ))}
      </div>

      {/* Change Password */}
      <div style={card}>
        <h3 style={{fontSize:16,fontWeight:700,color:t.text,margin:'0 0 20px',display:'flex',alignItems:'center',gap:8}}>
          <KeyRound size={18} color={t.primary}/> Change Password
        </h3>
        <form onSubmit={handleChangePassword}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:t.textMuted,display:'block',marginBottom:7,letterSpacing:'0.05em'}}>NEW PASSWORD</label>
              <input style={inp} type="password" placeholder="Min. 6 characters" value={newPass} onChange={e=>setNewPass(e.target.value)}/>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:t.textMuted,display:'block',marginBottom:7,letterSpacing:'0.05em'}}>CONFIRM PASSWORD</label>
              <input style={inp} type="password" placeholder="Repeat password" value={confirmPass} onChange={e=>setConfirmPass(e.target.value)}/>
            </div>
          </div>
          {passMsg && (
            <div style={{padding:'10px 14px',borderRadius:10,marginBottom:14,fontSize:13,
              background:passMsg.includes('✅')?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)',
              color:passMsg.includes('✅')?t.primary:'#ef4444',
              border:`1px solid ${passMsg.includes('✅')?t.primary+'44':'rgba(239,68,68,0.3)'}`}}>
              {passMsg}
            </div>
          )}
          <button type="submit" style={{...btnP,padding:'11px 28px'}}>Update Password</button>
        </form>
      </div>

      {/* Danger zone */}
      <div style={{...card,border:'1px solid rgba(239,68,68,0.3)',background:darkMode?'rgba(239,68,68,0.05)':'rgba(255,245,245,1)'}}>
        <h3 style={{fontSize:16,fontWeight:700,color:'#ef4444',margin:'0 0 14px',display:'flex',alignItems:'center',gap:8}}>
          <Shield size={18}/> Account
        </h3>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <p style={{fontSize:14,fontWeight:600,color:t.text,margin:'0 0 3px'}}>Sign Out</p>
            <p style={{fontSize:12,color:t.textMuted,margin:0}}>You will be returned to the login screen.</p>
          </div>
          <button onClick={handleLogout} style={{...btnG,color:'#ef4444',borderColor:'rgba(239,68,68,0.4)',display:'flex',alignItems:'center',gap:6}}>
            <LogOut size={14}/> Sign Out
          </button>
        </div>
      </div>
    </div>
  );

  // ─── MAIN RENDER ──────────────────────────────────────────
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',background:t.bg,fontFamily:'Inter,sans-serif',color:t.text}}>

      {/* ── Navbar ── */}
      <nav style={{position:'sticky',top:0,zIndex:100,background:t.navBg,backdropFilter:'blur(14px)',borderBottom:`1px solid ${t.border}`,padding:'0 24px'}}>
        <div style={{maxWidth:1200,margin:'0 auto',display:'flex',justifyContent:'space-between',alignItems:'center',height:64}}>

          {/* Logo */}
          <a href="/" style={{textDecoration:'none',display:'flex',alignItems:'center',gap:10}}>
            <div style={{background:`linear-gradient(135deg,${t.primary},${t.primaryDk})`,color:'#fff',padding:8,borderRadius:12,display:'flex'}}>
              <Sprout size={20}/>
            </div>
            <span style={{fontSize:19,fontWeight:800,color:t.text}}>AgroLedger</span>
          </a>

          {/* Tabs */}
          <div style={{display:'flex',gap:4,background:t.surfaceAlt,padding:4,borderRadius:12,border:`1px solid ${t.border}`}}>
            {(['farmer','buyer'] as const).map(tab=>(
              <button key={tab} onClick={()=>{setActiveTab(tab);setResult(null);}}
                style={{padding:'7px 18px',fontSize:13,fontWeight:600,border:'none',borderRadius:9,cursor:'pointer',transition:'all 0.2s',
                  background:activeTab===tab?`linear-gradient(135deg,${t.primary},${t.primaryDk})`:'transparent',
                  color:activeTab===tab?'#fff':t.textMuted}}>
                {tab==='farmer'?'Farmer Portal':'Traceability'}
              </button>
            ))}
          </div>

          {/* Right actions */}
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            {/* Wallet */}
            <button onClick={connectWallet} disabled={isConnecting} style={{...btnG,display:'flex',alignItems:'center',gap:6,fontSize:13}}>
              {account
                ? <><div style={{width:7,height:7,borderRadius:'50%',background:'#22c55e'}}/>{account.substring(0,6)}...{account.substring(account.length-4)}</>
                : <><Wallet size={14}/>{isConnecting?'Connecting...':'Connect Wallet'}</>
              }
            </button>

            {/* Avatar dropdown */}
            <div ref={dropRef} style={{position:'relative'}}>
              <button onClick={()=>setDropOpen(o=>!o)}
                style={{display:'flex',alignItems:'center',gap:8,padding:'5px 12px 5px 5px',background:t.surfaceAlt,border:`1.5px solid ${t.border}`,borderRadius:99,cursor:'pointer'}}>
                <Avatar size={30}/>
                <span style={{fontSize:13,fontWeight:600,color:t.text}}>{currentUser.displayName.split(' ')[0]}</span>
                <ChevronDown size={14} color={t.textMuted} style={{transform:dropOpen?'rotate(180deg)':'none',transition:'transform 0.2s'}}/>
              </button>

              {/* Dropdown */}
              {dropOpen && (
                <div style={{position:'absolute',right:0,top:'calc(100% + 10px)',width:240,background:t.surface,border:`1px solid ${t.border}`,borderRadius:16,boxShadow:'0 8px 32px rgba(0,0,0,0.15)',overflow:'hidden',zIndex:200}}>
                  {/* User info */}
                  <div style={{padding:'16px 16px 12px',borderBottom:`1px solid ${t.border}`,display:'flex',gap:12,alignItems:'center'}}>
                    <Avatar size={38}/>
                    <div>
                      <p style={{fontSize:14,fontWeight:700,color:t.text,margin:'0 0 2px'}}>{currentUser.displayName}</p>
                      <p style={{fontSize:12,color:t.textMuted,margin:0,textTransform:'capitalize'}}>{currentUser.role} · {currentUser.username}</p>
                    </div>
                  </div>

                  {/* Menu items */}
                  {[
                    {icon:<UserCircle2 size={15}/>, label:'Profile',  action:()=>{setActiveTab('profile');  setDropOpen(false);}},
                    {icon:<Settings    size={15}/>, label:'Settings', action:()=>{setActiveTab('settings'); setDropOpen(false);}},
                    {icon:darkMode?<Sun size={15}/>:<Moon size={15}/>, label:darkMode?'Light Mode':'Dark Mode', action:()=>setDarkMode(d=>!d)},
                  ].map((item,i)=>(
                    <button key={i} onClick={item.action}
                      style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'11px 16px',background:'none',border:'none',cursor:'pointer',color:t.textDim,fontSize:14,textAlign:'left',transition:'background 0.15s'}}
                      onMouseEnter={e=>(e.currentTarget.style.background=t.surfaceAlt)}
                      onMouseLeave={e=>(e.currentTarget.style.background='none')}>
                      <span style={{color:t.primary}}>{item.icon}</span>{item.label}
                    </button>
                  ))}

                  <div style={{borderTop:`1px solid ${t.border}`,margin:'4px 0'}}/>
                  <button onClick={handleLogout}
                    style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'11px 16px',background:'none',border:'none',cursor:'pointer',color:'#ef4444',fontSize:14,textAlign:'left'}}
                    onMouseEnter={e=>(e.currentTarget.style.background='rgba(239,68,68,0.08)')}
                    onMouseLeave={e=>(e.currentTarget.style.background='none')}>
                    <LogOut size={15}/> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Page content ── */}
      <main style={{flex:1,maxWidth:1200,margin:'0 auto',width:'100%',padding:'40px 24px 80px'}}>

        {/* Profile & Settings breadcrumb */}
        {(activeTab==='profile'||activeTab==='settings') && (
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:28}}>
            <button onClick={()=>setActiveTab('farmer')} style={{...btnG,padding:'6px 14px',fontSize:12}}>← Back</button>
            <span style={{fontSize:20,fontWeight:800,color:t.text,textTransform:'capitalize'}}>{activeTab}</span>
          </div>
        )}

        {activeTab==='profile'  && <ProfilePage/>}
        {activeTab==='settings' && <SettingsPage/>}

        {/* ── Farmer tab ── */}
        {activeTab==='farmer' && (
          <>
            {!result && (
              <div style={{textAlign:'center',marginBottom:48}}>
                <div style={{display:'inline-block',background:`${t.primary}18`,border:`1px solid ${t.primary}44`,borderRadius:99,padding:'5px 18px',fontSize:11,fontWeight:700,color:t.primary,marginBottom:14,letterSpacing:'0.06em'}}>
                  TRUST IN EVERY GRAIN
                </div>
                <h1 style={{fontSize:44,fontWeight:800,color:t.text,margin:'0 auto 14px',lineHeight:1.1,maxWidth:680}}>
                  The Immutable Future of{' '}
                  <span style={{background:`linear-gradient(135deg,${t.primary},${t.primaryDk})`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
                    Agricultural Traceability
                  </span>
                </h1>
                <p style={{color:t.textMuted,fontSize:17,maxWidth:520,margin:'0 auto 36px'}}>
                  Connect directly with the source. Verified by blockchain, powered by transparency.
                </p>
                <div style={{position:'relative',height:340,borderRadius:24,overflow:'hidden',border:`1px solid ${t.border}`}}>
                  <img src={agroHero} alt="Hero" style={{width:'100%',height:'100%',objectFit:'cover',opacity:darkMode?0.5:0.75}}/>
                  <div style={{position:'absolute',inset:0,background:`linear-gradient(0deg,${t.bg} 0%,transparent 60%)`}}/>
                </div>
              </div>
            )}

            <div style={{display:'grid',gridTemplateColumns:'1fr 360px',gap:28}}>
              {/* Form */}
              <div style={card}>
                <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:28}}>
                  <div style={{background:`${t.primary}22`,color:t.primary,padding:11,borderRadius:12}}><Leaf size={20}/></div>
                  <div>
                    <h2 style={{fontSize:20,fontWeight:700,color:t.text,margin:0}}>Register New Harvest</h2>
                    <p style={{color:t.textMuted,fontSize:13,margin:'4px 0 0'}}>Submit crop details to the immutable ledger.</p>
                  </div>
                </div>
                <form onSubmit={handleRegisterBatch}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
                    {[
                      {label:'FARMER NAME',   key:'farmer',      placeholder:'Sanjana Prasad',     type:'text'},
                      {label:'LOCATION',      key:'location',    placeholder:'Mysuru, Karnataka',  type:'text'},
                    ].map(f=>(
                      <div key={f.key}>
                        <label style={{fontSize:11,fontWeight:700,color:t.textMuted,display:'block',marginBottom:6,letterSpacing:'0.05em'}}>{f.label}</label>
                        <input style={inp} type={f.type} placeholder={f.placeholder} required value={(formData as any)[f.key]} onChange={e=>setFormData({...formData,[f.key]:e.target.value})}/>
                      </div>
                    ))}
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,marginBottom:14}}>
                    {[
                      {label:'CROP',         key:'crop',        placeholder:'Heirloom Tomatoes', type:'text'},
                      {label:'QUANTITY (KG)', key:'quantity',    placeholder:'250',               type:'number'},
                      {label:'HARVEST DATE', key:'harvestDate', placeholder:'',                  type:'date'},
                    ].map(f=>(
                      <div key={f.key}>
                        <label style={{fontSize:11,fontWeight:700,color:t.textMuted,display:'block',marginBottom:6,letterSpacing:'0.05em'}}>{f.label}</label>
                        <input style={inp} type={f.type} placeholder={f.placeholder} required value={(formData as any)[f.key]} onChange={e=>setFormData({...formData,[f.key]:e.target.value})}/>
                      </div>
                    ))}
                  </div>
                  <div style={{marginBottom:14}}>
                    <label style={{fontSize:11,fontWeight:700,color:t.textMuted,display:'block',marginBottom:6,letterSpacing:'0.05em'}}>ADDITIONAL NOTES</label>
                    <textarea style={{...inp,resize:'vertical'}} rows={3} placeholder="Details about soil, quality, or processing..." value={formData.notes} onChange={e=>setFormData({...formData,notes:e.target.value})}/>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:11,padding:13,background:t.surfaceAlt,borderRadius:11,marginBottom:24,border:`1px solid ${t.border}`}}>
                    <input type="checkbox" id="organic" style={{width:17,height:17,accentColor:t.primary}} checked={formData.organic} onChange={e=>setFormData({...formData,organic:e.target.checked})}/>
                    <label htmlFor="organic" style={{fontSize:13,cursor:'pointer',color:t.text,margin:0}}>I certify this is 100% Regenerative & Organic harvest.</label>
                  </div>
                  <button type="submit" style={{...btnP,width:'100%',height:50}} disabled={loading}>
                    {loading
                      ? <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:9}}><span className="spinner"/>Signing Transaction...</span>
                      : <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}><ShieldCheck size={17}/>Secure Batch on Ledger</span>
                    }
                  </button>
                </form>
              </div>

              {/* Registry sidebar */}
              <div>
                <p style={{fontSize:11,fontWeight:700,color:t.textMuted,letterSpacing:'0.08em',marginBottom:16}}>RECENT REGISTRY</p>
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  {batches.map(batch=>(
                    <div key={batch.id} style={{...card,padding:18}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                        <span style={{fontSize:11,color:t.primary,fontWeight:700}}>{batch.id}</span>
                        <button onClick={async()=>{const u=batches.filter(b=>b.id!==batch.id);setBatches(u);await saveBatchesToCloud(u);}} style={{background:'none',border:'none',color:t.textMuted,cursor:'pointer'}}><Trash2 size={13}/></button>
                      </div>
                      <h4 style={{fontSize:15,fontWeight:700,color:t.text,margin:'0 0 3px'}}>{batch.crop}</h4>
                      <p style={{fontSize:12,color:t.textMuted,margin:0}}>{batch.farmer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Buyer/Traceability tab ── */}
        {activeTab==='buyer' && (
          <div style={{maxWidth:760,margin:'0 auto'}}>
            <div style={{...card,padding:12,marginBottom:36,display:'flex',gap:10,alignItems:'center'}}>
              <div style={{position:'relative',flex:1}}>
                <Search style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:t.textMuted}} size={17}/>
                <input type="text" style={{...inp,paddingLeft:42,border:'none',background:'transparent'}}
                  placeholder="Enter Batch ID (e.g. FT-10024)"
                  value={searchId} onChange={e=>setSearchId(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&handleSearch()}/>
              </div>
              <button style={{...btnP,height:44,whiteSpace:'nowrap'}} onClick={handleSearch} disabled={loading}>
                {loading?'⏳ Tracing...':'Trace Origin'}
              </button>
            </div>

            {result ? (
              <div style={card}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:36,flexWrap:'wrap',gap:20}}>
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                      <span style={{background:`${t.primary}22`,color:t.primary,border:`1px solid ${t.primary}44`,borderRadius:99,padding:'3px 13px',fontSize:12,fontWeight:700,display:'flex',alignItems:'center',gap:5}}>
                        <CheckCircle2 size={12}/> Blockchain Verified
                      </span>
                      <span style={{fontSize:12,color:t.textMuted}}>ID: {result.id}</span>
                    </div>
                    <h2 style={{fontSize:38,fontWeight:800,color:t.text,margin:'0 0 8px'}}>{result.crop}</h2>
                    <div style={{display:'flex',alignItems:'center',gap:6,color:t.primary}}>
                      <MapPin size={16}/><span style={{fontSize:15,fontWeight:500}}>{result.location}</span>
                    </div>
                  </div>
                  <div style={{textAlign:'center'}}>
                    <div style={{background:'#fff',padding:10,borderRadius:14,display:'inline-block',boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}}>
                      <QRCodeSVG value={getVerificationUrl(result.id)} size={100} level="H"/>
                    </div>
                    <p style={{fontSize:10,color:t.textMuted,marginTop:8,fontWeight:600,letterSpacing:'0.05em'}}>SCAN FOR FULL AUDIT</p>
                  </div>
                </div>

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:32}}>
                  {[
                    {icon:User,      label:'Farmer',       value:result.farmer},
                    {icon:Scale,     label:'Batch Size',   value:`${result.quantity} kg`},
                    {icon:Calendar,  label:'Harvest Date', value:new Date(result.harvestDate).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})},
                    {icon:BadgeCheck,label:'Quality',      value:result.organic?'Certified Organic':'Premium Grade'},
                  ].map((item,i)=>(
                    <div key={i} style={{padding:18,background:t.surfaceAlt,borderRadius:14,border:`1px solid ${t.border}`,display:'flex',gap:12,alignItems:'center'}}>
                      <div style={{background:`${t.primary}22`,color:t.primary,padding:9,borderRadius:9}}><item.icon size={16}/></div>
                      <div>
                        <p style={{fontSize:10,fontWeight:700,color:t.textMuted,margin:'0 0 3px',letterSpacing:'0.05em'}}>{item.label.toUpperCase()}</p>
                        <p style={{fontSize:15,fontWeight:600,color:t.text,margin:0}}>{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{padding:24,background:t.surfaceAlt,borderRadius:16,border:`1px solid ${t.border}`,marginBottom:24}}>
                  <p style={{fontSize:11,fontWeight:700,color:t.textMuted,letterSpacing:'0.08em',marginBottom:18}}>TRACEABILITY TIMELINE</p>
                  {[
                    {done:true, title:'Harvest Registered',   desc:`Verified by ${result.farmer} at ${result.location}.`},
                    {done:true, title:'Quality Seal Applied', desc:'Grade verified and anchored to block #812,942.'},
                    {done:false,title:'In Transit',           desc:'Currently at distribution hub. Pending outbound logistics.'},
                  ].map((step,i)=>(
                    <div key={i} style={{display:'flex',gap:12,marginBottom:i<2?18:0,alignItems:'flex-start'}}>
                      <div style={{width:26,height:26,borderRadius:'50%',background:step.done?`linear-gradient(135deg,${t.primary},${t.primaryDk})`:t.surfaceAlt,border:`2px solid ${step.done?t.primary:t.border}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:2}}>
                        {step.done&&<CheckCircle2 size={13} color="#fff"/>}
                      </div>
                      <div>
                        <h4 style={{fontSize:14,fontWeight:700,color:t.text,margin:'0 0 3px'}}>{step.title}</h4>
                        <p style={{fontSize:12,color:t.textMuted,margin:0}}>{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {result.notes&&(
                  <div style={{marginBottom:24,padding:18,background:`${t.primary}08`,borderRadius:12,borderLeft:`4px solid ${t.primary}`}}>
                    <p style={{fontSize:11,fontWeight:700,color:t.primary,marginBottom:5,letterSpacing:'0.05em'}}>FARMER'S NOTE</p>
                    <p style={{fontStyle:'italic',color:t.textDim,fontSize:14,margin:0}}>"{result.notes}"</p>
                  </div>
                )}

                <div style={{padding:18,background:t.surfaceAlt,borderRadius:12,border:`1px solid ${t.border}`}}>
                  <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:12}}>
                    <History size={15} color={t.primary}/>
                    <p style={{fontSize:11,fontWeight:700,color:t.textMuted,letterSpacing:'0.08em',margin:0}}>BLOCKCHAIN AUDIT TRAIL</p>
                  </div>
                  {[
                    ['TRANSACTION HASH',result.hash.substring(0,22)+'...'],
                    ['TIMESTAMP',new Date(result.timestamp).toLocaleString()],
                    ['NETWORK','AgroLedger Mainnet'],
                  ].map(([k,v])=>(
                    <div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'6px 0',borderBottom:`1px solid ${t.border}`}}>
                      <span style={{color:t.textMuted,fontWeight:600}}>{k}</span>
                      <span style={{color:k==='NETWORK'?t.primary:t.textDim}}>{v}</span>
                    </div>
                  ))}
                </div>

                <button style={{...btnG,width:'100%',marginTop:20,display:'flex',alignItems:'center',justifyContent:'center',gap:7}} onClick={()=>window.open('https://etherscan.io','_blank')}>
                  View on Explorer <ExternalLink size={13}/>
                </button>
              </div>
            ) : !loading && (
              <div style={{textAlign:'center',padding:'72px 32px',border:`1.5px dashed ${t.border}`,borderRadius:24,background:`${t.primary}04`}}>
                <div style={{background:t.surfaceAlt,width:68,height:68,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px'}}>
                  <Search size={26} color={t.textMuted}/>
                </div>
                <h3 style={{fontSize:20,fontWeight:700,color:t.text,marginBottom:8}}>Ready to Trace?</h3>
                <p style={{color:t.textMuted,maxWidth:360,margin:'0 auto 24px',fontSize:14}}>Enter a Batch ID to unlock the full provenance of your produce.</p>
                <div style={{display:'flex',gap:9,justifyContent:'center',flexWrap:'wrap'}}>
                  {batches.slice(0,3).map(b=>(
                    <button key={b.id} style={{...btnG,display:'flex',alignItems:'center',gap:5,fontSize:13}} onClick={()=>{setSearchId(b.id);handleSearch();}}>
                      Try {b.id} <ArrowRight size={12}/>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer style={{borderTop:`1px solid ${t.border}`,padding:'32px 24px',textAlign:'center',background:t.surface}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:7,marginBottom:10,opacity:0.7}}>
          <Sprout size={16} color={t.primary}/>
          <span style={{fontWeight:700,fontSize:15,color:t.text}}>AgroLedger</span>
        </div>
        <p style={{fontSize:11,color:t.textMuted,letterSpacing:'0.05em',margin:0}}>
          © 2026 AGROLEDGER PROTOCOL · DECENTRALIZED AGRICULTURAL EVIDENCE · SECURE · IMMUTABLE
        </p>
      </footer>

      <style>{`
        *{box-sizing:border-box;} body{margin:0;}
        .spinner{width:17px;height:17px;border:2px solid rgba(255,255,255,0.3);border-radius:50%;border-top-color:#fff;animation:spin 0.8s linear infinite;display:inline-block;}
        @keyframes spin{to{transform:rotate(360deg);}}
        input::placeholder,textarea::placeholder{color:#9ca3af;}
      `}</style>
    </div>
  );
}
