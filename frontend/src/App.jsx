import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Tv, 
  Settings, 
  DollarSign, 
  Volume2, 
  TrendingUp, 
  Link as LinkIcon, 
  Coins, 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  RefreshCw,
  LogOut,
  CreditCard,
  QrCode,
  ShieldCheck,
  User,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Smartphone
} from 'lucide-react';

// --- CONFIG & UTILS ---
const API_BASE = import.meta.env.DEV ? 'http://localhost:5000' : '';
const WS_URL = import.meta.env.DEV 
  ? 'ws://127.0.0.1:5000' 
  : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;

// Helper to format currency (USD / KHR support)
const formatCurrency = (val, currency = 'USD') => {
  const cleanCurrency = (currency || 'USD').toUpperCase();
  if (cleanCurrency === 'KHR') {
    return new Intl.NumberFormat('km-KH', { style: 'currency', currency: 'KHR', minimumFractionDigits: 0 }).format(val || 0);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
};

// --- MAIN APP ROUTING ---
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/overlays/alertbox" element={<AlertBoxOverlay />} />
        <Route path="/overlays/goal" element={<GoalOverlay />} />
        <Route path="/overlays/ticker" element={<TickerOverlay />} />
        <Route path="/donate" element={<PublicDonationPage />} />
        <Route path="/*" element={<DashboardLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

// --- DASHBOARD LAYOUT ---
function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState({
    username: '',
    settings: {},
    goal: {},
    donations: [],
    followers: [],
    stats: { totalDonations: 0, topDonation: null, top5Donations: [], latestDonation: null, latestFollower: null }
  });
  const [loading, setLoading] = useState(true);
  const [promptUsername, setPromptUsername] = useState('');

  const loggedInUser = localStorage.getItem('username');

  const fetchState = async () => {
    if (!loggedInUser) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/state`, {
        headers: { 'X-Username': loggedInUser }
      });
      if (res.status === 401) {
        // Automatically register the user if they don't exist since we removed the login page
        const regRes = await fetch(`${API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: loggedInUser, password: 'defaultpassword' })
        });
        if (regRes.ok) {
           fetchState();
           return;
        } else {
           localStorage.removeItem('username');
           window.location.reload();
           return;
        }
      }
      const data = await res.json();
      setState(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching state:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loggedInUser) {
      setLoading(false);
      return;
    }

    fetchState();
    
    // Connect WebSocket scoped to user session
    const ws = new WebSocket(`${WS_URL}?username=${loggedInUser}`);
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'STATE_UPDATE' || message.type === 'INIT_STATE') {
        setState(message.data);
      }
    };
    
    ws.onclose = () => {
      console.log('WS connection closed. Reconnecting in 3s...');
      setTimeout(fetchState, 3000);
    };

    return () => ws.close();
  }, [loggedInUser, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('username');
    window.location.reload();
  };

  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    if (promptUsername.trim()) {
      localStorage.setItem('username', promptUsername.trim().toLowerCase());
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#090a0f', color: '#00f0ff', fontFamily: 'Rajdhani', fontSize: '24px' }}>
        LOADING KHEANG ALERT...
      </div>
    );
  }

  if (!loggedInUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#090a0f' }}>
        <div className="donation-form-container" style={{ maxWidth: '400px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', color: '#fff', fontSize: '28px', textTransform: 'uppercase', marginBottom: '8px' }}>
              KHEANG<span>ALERT</span>
            </h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>Enter your streamer username to continue</p>
          </div>
          <form onSubmit={handleUsernameSubmit}>
            <div className="form-group">
              <input 
                type="text" 
                value={promptUsername} 
                onChange={e => setPromptUsername(e.target.value)} 
                required 
                placeholder="e.g. kheang"
                autoFocus
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: '15px', marginTop: '10px' }}>
              Enter Dashboard
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
            <a href="https://t.me/KheangNubb" target="_blank" rel="noopener noreferrer"
              style={{ color: '#29b6f6', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: '500' }}>
              ✈️ Contact Developer on Telegram
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="brand">
          KHEANG<span>ALERT</span>
        </div>
        <div style={{ padding: '4px 10px', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '6px', fontSize: '13px', color: '#fff', textAlign: 'center', marginTop: '-15px' }}>
          Streamer: <strong style={{ color: 'var(--color-primary)' }}>{loggedInUser}</strong>
        </div>
        <nav>
          <ul className="nav-menu">
            <li>
              <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                <LayoutDashboard size={18} /> Dashboard
              </Link>
            </li>
            <li>
              <Link to="/simulator" className={`nav-link ${location.pathname === '/simulator' ? 'active' : ''}`}>
                <Tv size={18} /> Test/Simulator
              </Link>
            </li>
            <li>
              <Link to="/customizer" className={`nav-link ${location.pathname === '/customizer' ? 'active' : ''}`}>
                <Settings size={18} /> Customize
              </Link>
            </li>
            <li>
              <Link to="/tts" className={`nav-link ${location.pathname === '/tts' ? 'active' : ''}`}>
                <Volume2 size={18} /> TTS Settings
              </Link>
            </li>
            <li>
              <Link to="/widgets" className={`nav-link ${location.pathname === '/widgets' ? 'active' : ''}`}>
                <LinkIcon size={18} /> OBS Widgets
              </Link>
            </li>
            <li>
              <a href={`/donate?user=${loggedInUser}`} target="_blank" rel="noopener noreferrer" className="nav-link">
                <DollarSign size={18} /> Donation Page
              </a>
            </li>
            <li style={{ marginTop: '20px' }}>
              <button onClick={handleLogout} className="btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', background: 'transparent', border: '1px solid rgba(230, 57, 70, 0.2)', color: '#e63946' }}>
                <LogOut size={18} /> Logout
              </button>
            </li>
          </ul>
        </nav>
        <div style={{ marginTop: 'auto', padding: '10px', background: '#10121e', borderRadius: '8px', border: '1px solid #242943', fontSize: '12px', color: '#a0aec0' }}>
          <p>Local Server:</p>
          <p style={{ color: '#00f0ff', fontFamily: 'monospace' }}>http://localhost:5000</p>
        </div>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<DashboardHome state={state} refresh={fetchState} />} />
          <Route path="/simulator" element={<DashboardSimulator state={state} />} />
          <Route path="/customizer" element={<DashboardCustomizer state={state} refresh={fetchState} />} />
          <Route path="/tts" element={<DashboardTTS state={state} refresh={fetchState} />} />
          <Route path="/widgets" element={<DashboardWidgets />} />
        </Routes>
      </main>
    </div>
  );
}

// --- LINK & QR CODE GENERATOR ---
function DonationLinkGenerator() {
  const loggedInUser = localStorage.getItem('username');
  const [prefName, setPrefName] = useState('');
  const [prefAmount, setPrefAmount] = useState('10');
  const [prefMsg, setPrefMsg] = useState('');
  const [prefCurrency, setPrefCurrency] = useState('USD');
  const [copied, setCopied] = useState(false);

  const baseDomain = window.location.origin;
  
  // Construct parameters
  const params = [];
  params.push(`user=${loggedInUser}`);
  if (prefName.trim()) params.push(`name=${encodeURIComponent(prefName.trim())}`);
  if (prefAmount && !isNaN(prefAmount) && parseFloat(prefAmount) > 0) params.push(`amount=${prefAmount}`);
  if (prefMsg.trim()) params.push(`message=${encodeURIComponent(prefMsg.trim())}`);
  params.push(`currency=${prefCurrency}`);
  
  const queryString = params.length > 0 ? `?${params.join('&')}` : '';
  const finalLink = `${baseDomain}/donate${queryString}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(finalLink)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(finalLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card">
      <h3 className="card-title" style={{ marginBottom: '12px' }}><Coins size={18} /> Donation Link Generator</h3>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
        Generate a pre-filled donation link or QR code for viewers. When paid, it sends tips to your account.
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '10px', marginBottom: '12px' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '11px', marginBottom: '4px' }}>Currency</label>
          <select
            value={prefCurrency}
            onChange={e => {
              const newCur = e.target.value;
              setPrefCurrency(newCur);
              if (newCur === 'KHR') {
                setPrefAmount('4000');
              } else {
                setPrefAmount('10');
              }
            }}
            style={{ padding: '6px 10px', fontSize: '12px', height: '34px', background: '#171923', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-md)', color: '#fff' }}
          >
            <option value="USD">USD ($)</option>
            <option value="KHR">KHR (៛)</option>
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '11px', marginBottom: '4px' }}>Amount</label>
          <input 
            type="number" 
            min={prefCurrency === 'KHR' ? '100' : '0.01'} 
            step={prefCurrency === 'KHR' ? '100' : '0.01'}
            value={prefAmount} 
            onChange={e => setPrefAmount(e.target.value)} 
            style={{ padding: '6px 10px', fontSize: '12px', height: '34px' }}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '11px', marginBottom: '4px' }}>Name (optional)</label>
          <input 
            type="text" 
            value={prefName} 
            onChange={e => setPrefName(e.target.value)} 
            placeholder="e.g. VIP Fan"
            style={{ padding: '6px 10px', fontSize: '12px', height: '34px' }}
          />
        </div>
      </div>
      
      <div className="form-group" style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: '11px', marginBottom: '4px' }}>Message (optional)</label>
        <input 
          type="text" 
          value={prefMsg} 
          onChange={e => setPrefMsg(e.target.value)} 
          placeholder="e.g. Tip from stream!"
          style={{ padding: '6px 10px', fontSize: '12px' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#171923', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', marginBottom: '16px' }}>
        <div style={{ background: '#fff', padding: '6px', borderRadius: '6px', width: '82px', height: '82px', flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img src={qrCodeUrl} alt="Donation URL QR" style={{ width: '70px', height: '70px' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>Shareable URL</label>
          <input 
            type="text" 
            readOnly 
            value={finalLink} 
            style={{ padding: '4px 8px', fontSize: '11px', fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', width: '100%', border: 'none', borderRadius: '4px', color: '#fff' }} 
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="btn-primary" style={{ flex: 1, padding: '8px 12px', fontSize: '12px' }} onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
        <a href={finalLink} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ flex: 1, padding: '8px 12px', fontSize: '12px', textDecoration: 'none', textAlign: 'center' }}>
          <ExternalLink size={14} /> Open Page
        </a>
      </div>
    </div>
  );
}

// --- DASHBOARD HOME ---
function DashboardHome({ state, refresh }) {
  const { stats, donations, followers } = state;
  const recentActivities = [
    ...(donations || []).map(d => ({ ...d, type: 'donation' })),
    ...(followers || []).map(f => ({ ...f, type: 'follow' }))
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', marginBottom: '24px', textTransform: 'uppercase', color: '#fff' }}>Overview Dashboard</h2>
      
      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="card">
          <div className="stat-label">Total Donations</div>
          <div className="stat-value" style={{ color: 'var(--color-primary)' }}>{formatCurrency(stats.totalDonations)}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Total received (USD Value)</div>
        </div>
        <div className="card">
          <div className="stat-label">Top Donation</div>
          <div className="stat-value" style={{ color: 'var(--color-secondary)' }}>
            {stats.topDonation ? formatCurrency(stats.topDonation.amount, stats.topDonation.currency) : '$0.00'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {stats.topDonation ? `by ${stats.topDonation.name}` : 'No donations yet'}
          </div>
        </div>
        <div className="card">
          <div className="stat-label">Latest Donation</div>
          <div className="stat-value" style={{ color: '#fff' }}>
            {stats.latestDonation ? formatCurrency(stats.latestDonation.amount, stats.latestDonation.currency) : '$0.00'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {stats.latestDonation ? `by ${stats.latestDonation.name}` : 'No donations yet'}
          </div>
        </div>
        <div className="card">
          <div className="stat-label">Latest Follower</div>
          <div className="stat-value" style={{ color: 'var(--color-success)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {stats.latestFollower ? stats.latestFollower.name : 'No followers'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Recent subscriber</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Recent Activity */}
        <div className="card">
          <h3 className="card-title">Recent Activity</h3>
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {recentActivities.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', padding: '20px 0' }}>No recent activity. Use the Simulator to fire test events!</p>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>User</th>
                    <th>Detail</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivities.map((act) => (
                    <tr key={act.id}>
                      <td>
                        <span className={`alert-badge ${act.type === 'donation' ? 'badge-donation' : 'badge-follow'}`}>
                          {act.type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 'bold' }}>{act.name}</td>
                      <td>{act.type === 'donation' ? `${formatCurrency(act.amount, act.currency)} - "${act.message}"` : 'Just followed!'}</td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>
                        {new Date(act.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right side Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Goal Progress Card */}
          <div className="card">
            <h3 className="card-title">Donation Goal</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
              Track progress for your current goal.
            </p>
            {state.goal?.active ? (
              <div style={{ background: '#171923', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold' }}>{state.goal.title}</span>
                  <span style={{ color: 'var(--color-primary)' }}>{Math.round((state.goal.current / state.goal.target) * 100)}%</span>
                </div>
                <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, (state.goal.current / state.goal.target) * 100)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))'
                  }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  <span>Raised: {formatCurrency(state.goal.current)}</span>
                  <span>Goal: {formatCurrency(state.goal.target)}</span>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '12px' }}>No active goal. Configure one in the Customize tab.</p>
            )}
            <button className="btn-secondary" style={{ width: '100%' }} onClick={refresh}>
              <RefreshCw size={16} /> Refresh Stats
            </button>
          </div>

          {/* Top 5 Donations Leaderboard Card */}
          <div className="card">
            <h3 className="card-title">
              <TrendingUp size={18} style={{ color: 'var(--color-primary)' }} /> Top 5 Donations
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
              All-time top contributors sorted by value.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(!stats.top5Donations || stats.top5Donations.length === 0) ? (
                <div style={{ color: 'var(--color-text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px 0', border: '1px dashed var(--color-border)', borderRadius: '8px' }}>
                  No donations recorded yet.
                </div>
              ) : (
                stats.top5Donations.map((d, index) => {
                  const rankEmojis = ['🥇', '🥈', '🥉', '4th', '5th'];
                  const rankColors = [
                    '#ffd700', // Gold
                    '#c0c0c0', // Silver
                    '#cd7f32', // Bronze
                    'var(--color-text-secondary)',
                    'var(--color-text-muted)'
                  ];
                  const isTop3 = index < 3;
                  
                  return (
                    <div
                      key={d.id || index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        background: 'rgba(23, 25, 35, 0.6)',
                        border: `1px solid ${isTop3 ? 'rgba(0, 240, 255, 0.15)' : 'var(--color-border)'}`,
                        borderRadius: '8px',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateX(4px)';
                        e.currentTarget.style.background = 'rgba(24, 27, 46, 0.8)';
                        e.currentTarget.style.borderColor = 'var(--color-primary)';
                        e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 240, 255, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.background = 'rgba(23, 25, 35, 0.6)';
                        e.currentTarget.style.borderColor = isTop3 ? 'rgba(0, 240, 255, 0.15)' : 'var(--color-border)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      title={d.message ? `"${d.message}"` : 'No message'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <span style={{ 
                          fontSize: isTop3 ? '18px' : '12px', 
                          fontWeight: '800', 
                          color: rankColors[index],
                          width: '24px',
                          display: 'inline-block',
                          textAlign: 'center'
                        }}>
                          {rankEmojis[index]}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '14px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {d.name}
                          </div>
                          {d.message && (
                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '11px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {d.message}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span style={{ 
                          fontFamily: 'var(--font-display)', 
                          fontWeight: '700', 
                          color: isTop3 ? 'var(--color-secondary)' : 'var(--color-primary)',
                          fontSize: '15px'
                        }}>
                          {formatCurrency(d.amount, d.currency)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <DonationLinkGenerator />
        </div>
      </div>
    </div>
  );
}

// --- SIMULATOR ---
function DashboardSimulator() {
  const loggedInUser = localStorage.getItem('username');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('10');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleTrigger = async (type, isTestOnly = false) => {
    setLoading(true);
    setSuccessMsg('');
    const endpoint = isTestOnly ? '/api/test-alert' : (type === 'donation' ? '/api/donate' : '/api/follow');
    const payload = {
      event: type,
      name: name || (type === 'donation' ? 'Sok Chamroeun' : 'Srey Leak'),
      amount: parseFloat(amount) || 10.0,
      message: message || 'Hello from a fan! keep it up!',
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Username': loggedInUser || ''
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setSuccessMsg(`${type.toUpperCase()} alert triggered successfully!`);
        setName('');
        setMessage('');
      } else {
        alert('Failed to trigger alert');
      }
    } catch (e) {
      console.error(e);
      alert('Error triggering alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', marginBottom: '24px', textTransform: 'uppercase', color: '#fff' }}>Alert Simulator</h2>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
        Test overlays. You can trigger live mock alerts, or save real test events directly into the database.
      </p>

      <div className="card">
        <h3 className="card-title">Trigger Controls</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div className="form-group">
            <label>Username / Donor Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. John Doe (blank for random)" />
          </div>
          <div className="form-group">
            <label>Amount ($)</label>
            <input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Only for donation" />
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: '24px' }}>
          <label>Donation Message</label>
          <textarea rows="3" value={message} onChange={e => setMessage(e.target.value)} placeholder="Write a message..." />
        </div>

        {successMsg && (
          <div style={{ background: 'rgba(57, 255, 20, 0.1)', border: '1px solid var(--color-success)', color: 'var(--color-success)', padding: '12px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle size={16} /> {successMsg}
          </div>
        )}

        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <button className="btn-primary" disabled={loading} onClick={() => handleTrigger('donation', true)}>
            Test Donation Alert (Mock)
          </button>
          <button className="btn-accent" disabled={loading} onClick={() => handleTrigger('follow', true)}>
            Test Follower Alert (Mock)
          </button>
          <div style={{ width: '100%', borderBottom: '1px dashed var(--color-border)', margin: '10px 0' }}></div>
          <button className="btn-secondary" disabled={loading} style={{ borderColor: 'var(--color-primary)' }} onClick={() => handleTrigger('donation', false)}>
            Add Real Donation to DB & Trigger
          </button>
          <button className="btn-secondary" disabled={loading} style={{ borderColor: 'var(--color-secondary)' }} onClick={() => handleTrigger('follow', false)}>
            Add Real Follow to DB & Trigger
          </button>
        </div>
      </div>
    </div>
  );
}

// --- CUSTOMIZER ---
function DashboardCustomizer({ state, refresh }) {
  const loggedInUser = localStorage.getItem('username');
  const [alertDuration, setAlertDuration] = useState(7000);
  const [soundVolume, setSoundVolume] = useState(0.8);
  const [followTextTemplate, setFollowTextTemplate] = useState('');
  const [donationTextTemplate, setDonationTextTemplate] = useState('');
  const [gifUrl, setGifUrl] = useState('');
  const [soundUrl, setSoundUrl] = useState('');

  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState(500);
  const [goalCurrent, setGoalCurrent] = useState(0);
  const [goalActive, setGoalActive] = useState(true);

  const [bakongAccountId, setBakongAccountId] = useState('');
  const [bakongToken, setBakongToken] = useState('');
  const [bakongEnv, setBakongEnv] = useState('production');
  const [testingStatus, setTestingStatus] = useState('');
  const [testResult, setTestResult] = useState(null);

  // New gateway and credential settings states
  const [abaMerchantLinkUsd, setAbaMerchantLinkUsd] = useState('');
  const [abaMerchantLinkKhr, setAbaMerchantLinkKhr] = useState('');
  const [usdPaymentMethod, setUsdPaymentMethod] = useState('bakong'); // 'aba', 'bakong'
  const [khrPaymentMethod, setKhrPaymentMethod] = useState('bakong'); // 'aba', 'bakong'

  // Presets and limits states
  const [presetUsd1, setPresetUsd1] = useState('1');
  const [presetUsd2, setPresetUsd2] = useState('5');
  const [presetUsd3, setPresetUsd3] = useState('10');
  const [presetUsd4, setPresetUsd4] = useState('20');
  const [presetUsd5, setPresetUsd5] = useState('50');
  const [minUsd, setMinUsd] = useState('');
  const [maxUsd, setMaxUsd] = useState('');

  const [presetKhr1, setPresetKhr1] = useState('4000');
  const [presetKhr2, setPresetKhr2] = useState('10000');
  const [presetKhr3, setPresetKhr3] = useState('20000');
  const [presetKhr4, setPresetKhr4] = useState('50000');
  const [presetKhr5, setPresetKhr5] = useState('100000');
  const [minKhr, setMinKhr] = useState('');
  const [maxKhr, setMaxKhr] = useState('');

  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (state.settings) {
      setAlertDuration(state.settings.alertDuration || 7000);
      setSoundVolume(state.settings.soundVolume ?? 0.8);
      setFollowTextTemplate(state.settings.followTextTemplate || '');
      setDonationTextTemplate(state.settings.donationTextTemplate || '');
      setGifUrl(state.settings.gifUrl || '');
      setSoundUrl(state.settings.soundUrl || '');
    }
    // settings credentials loading
    setBakongAccountId(state.settings?.bakongAccountId || '');
    setBakongToken(state.settings?.bakongToken || '');
    setBakongEnv(state.settings?.bakongEnv || 'production');
    
    setAbaMerchantLinkUsd(state.settings?.abaMerchantLinkUsd || '');
    setAbaMerchantLinkKhr(state.settings?.abaMerchantLinkKhr || '');
    setUsdPaymentMethod(state.settings?.usdPaymentMethod || 'bakong');
    setKhrPaymentMethod(state.settings?.khrPaymentMethod || 'bakong');

    setPresetUsd1(state.settings?.presetUsd1 || '1');
    setPresetUsd2(state.settings?.presetUsd2 || '5');
    setPresetUsd3(state.settings?.presetUsd3 || '10');
    setPresetUsd4(state.settings?.presetUsd4 || '20');
    setPresetUsd5(state.settings?.presetUsd5 || '50');
    setMinUsd(state.settings?.minUsd || '');
    setMaxUsd(state.settings?.maxUsd || '');

    setPresetKhr1(state.settings?.presetKhr1 || '4000');
    setPresetKhr2(state.settings?.presetKhr2 || '10000');
    setPresetKhr3(state.settings?.presetKhr3 || '20000');
    setPresetKhr4(state.settings?.presetKhr4 || '50000');
    setPresetKhr5(state.settings?.presetKhr5 || '100000');
    setMinKhr(state.settings?.minKhr || '');
    setMaxKhr(state.settings?.maxKhr || '');
    
    if (state.goal) {
      setGoalTitle(state.goal.title || '');
      setGoalTarget(state.goal.target || 500);
      setGoalCurrent(state.goal.current || 0);
      setGoalActive(state.goal.active ?? true);
    }
  }, [state]);

  const saveSettings = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await fetch(`${API_BASE}/api/settings`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-Username': loggedInUser || ''
        },
        body: JSON.stringify({
          alertDuration: Number(alertDuration),
          soundVolume: parseFloat(soundVolume),
          followTextTemplate,
          donationTextTemplate,
          gifUrl,
          soundUrl
        })
      });
      refresh();
      alert('Settings updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Error saving settings');
    } finally {
      setUpdating(false);
    }
  };

  const saveGoal = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await fetch(`${API_BASE}/api/goal`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-Username': loggedInUser || ''
        },
        body: JSON.stringify({
          title: goalTitle,
          target: Number(goalTarget),
          current: Number(goalCurrent),
          active: goalActive
        })
      });
      refresh();
      alert('Goal updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Error saving goal');
    } finally {
      setUpdating(false);
    }
  };

  const saveBakongSettings = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await fetch(`${API_BASE}/api/settings`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-Username': loggedInUser || ''
        },
        body: JSON.stringify({
          bakongAccountId: bakongAccountId.replace(/\s+/g, ''),
          bakongToken: bakongToken.replace(/\s+/g, ''),
          bakongEnv: bakongEnv,
          abaMerchantLinkUsd: abaMerchantLinkUsd.trim(),
          abaMerchantLinkKhr: abaMerchantLinkKhr.trim(),
          usdPaymentMethod,
          khrPaymentMethod,
          presetUsd1,
          presetUsd2,
          presetUsd3,
          presetUsd4,
          presetUsd5,
          minUsd,
          maxUsd,
          presetKhr1,
          presetKhr2,
          presetKhr3,
          presetKhr4,
          presetKhr5,
          minKhr,
          maxKhr
        })
      });
      refresh();
      alert('Payment settings and credentials updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Error saving payment settings');
    } finally {
      setUpdating(false);
    }
  };

  const testBakongConnection = async () => {
    if (!bakongAccountId || !bakongToken) {
      alert('Please enter both Bakong Account ID and JWT Token first.');
      return;
    }
    setTestingStatus('testing');
    setTestResult(null);
    try {
      const response = await fetch(`${API_BASE}/api/settings/test-bakong`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Username': loggedInUser || ''
        },
        body: JSON.stringify({
          bakongAccountId: bakongAccountId.replace(/\s+/g, ''),
          bakongToken: bakongToken.replace(/\s+/g, ''),
          bakongEnv: bakongEnv
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        if (data.isBlocked) {
          // NBC API CORS policy blocks Authorization header from browsers.
          // Instead, decode the JWT locally to verify token expiry.
          try {
            const cleanToken = bakongToken.replace(/\s+/g, '');
            const parts = cleanToken.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]));
              const expDate = new Date((payload.exp || 0) * 1000);
              const now = new Date();
              if (payload.exp && expDate > now) {
                const diffDays = Math.floor((expDate - now) / (1000 * 60 * 60 * 24));
                setTestResult({ 
                  success: true, 
                  message: `✅ Credentials saved. Token is valid for ${diffDays} more day(s) (expires ${expDate.toLocaleDateString()}). Note: your server is hosted outside Cambodia so NBC API verification runs via client-side fallback. Donors can still pay using QR + ABA/Bakong app.` 
                });
              } else {
                setTestResult({ 
                  success: false, 
                  message: `⚠️ JWT Token is EXPIRED (expired ${expDate.toLocaleDateString()}). Please get a new token from api-bakong.nbc.gov.kh and update it here.` 
                });
              }
            } else {
              setTestResult({ success: true, message: '✅ Credentials saved. Server is hosted outside Cambodia (geo-blocked by NBC). Donors can still pay using the QR code with ABA Mobile, Bakong, or Acleda.' });
            }
          } catch (jwtErr) {
            setTestResult({ success: true, message: '✅ Credentials saved. Server is hosted outside Cambodia (geo-blocked by NBC). Donors can still pay using the QR code with ABA Mobile, Bakong, or Acleda.' });
          }
        } else {
          setTestResult({ success: true, message: data.message });
        }
      } else {
        setTestResult({ success: false, message: data.message || 'Verification request failed.' });
      }
    } catch (err) {
      console.error(err);
      setTestResult({ success: false, message: 'Could not connect to test server endpoint.' });
    } finally {
      setTestingStatus('');
    }
  };

  const resetGoal = async () => {
    if (window.confirm('Reset current progress towards this goal?')) {
      await fetch(`${API_BASE}/api/goal/reset`, { 
        method: 'POST',
        headers: { 'X-Username': loggedInUser || '' }
      });
      refresh();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Alert Customization */}
        <form onSubmit={saveSettings} className="card">
          <h3 className="card-title"><Volume2 size={20} /> Alert Customization</h3>
          <div className="form-group">
            <label>Alert Duration (milliseconds)</label>
            <input type="number" value={alertDuration} onChange={e => setAlertDuration(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Alert Sound Volume (0.0 to 1.0)</label>
            <input type="number" step="0.1" min="0" max="1" value={soundVolume} onChange={e => setSoundVolume(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Donation Text Template (use {"{name}"} and {"{amount}"})</label>
            <input type="text" value={donationTextTemplate} onChange={e => setDonationTextTemplate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Follower Text Template (use {"{name}"})</label>
            <input type="text" value={followTextTemplate} onChange={e => setFollowTextTemplate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Alert GIF URL</label>
            <input type="text" value={gifUrl} onChange={e => setGifUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="form-group">
            <label>Alert Sound URL (MP3/WAV)</label>
            <input type="text" value={soundUrl} onChange={e => setSoundUrl(e.target.value)} placeholder="https://..." />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={updating}>
            Save Alert Settings
          </button>
        </form>

        {/* Goal Customization */}
        <form onSubmit={saveGoal} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 className="card-title"><TrendingUp size={20} /> Goal Settings</h3>
            <div className="form-group">
              <label>Goal Title</label>
              <input type="text" value={goalTitle} onChange={e => setGoalTitle(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Goal Target ($)</label>
              <input type="number" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Current Progress ($)</label>
              <input type="number" value={goalCurrent} onChange={e => setGoalCurrent(e.target.value)} />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input 
                type="checkbox" 
                checked={goalActive} 
                id="goalActive"
                onChange={e => setGoalActive(e.target.checked)} 
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <label htmlFor="goalActive" style={{ margin: 0, cursor: 'pointer' }}>Activate Goal Overlay</label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="submit" className="btn-accent" style={{ flex: 1 }} disabled={updating}>
              Save Goal
            </button>
            <button type="button" className="btn-danger" onClick={resetGoal}>
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Payment Settings & Credentials */}
      <form onSubmit={saveBakongSettings} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Credentials Section Card */}
        <div className="card">
          <h3 className="card-title"><Coins size={20} /> Payment Credentials</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
            Configure your ABA Merchant links and Bakong ID to receive tips from viewers.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div className="form-group">
              <label>ABA Merchant Link (USD)</label>
              <input 
                type="text" 
                value={abaMerchantLinkUsd} 
                onChange={e => setAbaMerchantLinkUsd(e.target.value)} 
                placeholder="https://link.payway.com.kh/ABAPAY..."
              />
            </div>
            <div className="form-group">
              <label>ABA Merchant Link (KHR)</label>
              <input 
                type="text" 
                value={abaMerchantLinkKhr} 
                onChange={e => setAbaMerchantLinkKhr(e.target.value)} 
                placeholder="https://link.payway.com.kh/ABAPAY..."
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 2fr', gap: '20px', marginBottom: '20px' }}>
            <div className="form-group">
              <label>Bakong ID (Account ID)</label>
              <input 
                type="text" 
                value={bakongAccountId} 
                onChange={e => setBakongAccountId(e.target.value)} 
                placeholder="e.g. name@bank_code"
              />
            </div>
            <div className="form-group">
              <label>Bakong Env</label>
              <select 
                value={bakongEnv} 
                onChange={e => setBakongEnv(e.target.value)}
                style={{ height: '42px' }}
              >
                <option value="production">Production</option>
                <option value="sandbox">Sandbox</option>
              </select>
            </div>
            <div className="form-group">
              <label>Bakong Open API JWT Token (optional, for auto-check)</label>
              <input 
                type="text" 
                value={bakongToken} 
                onChange={e => setBakongToken(e.target.value)} 
                placeholder="JWT Token starting with eyJhbGc..."
                style={{ fontSize: '11px', fontFamily: 'monospace' }}
              />
            </div>
          </div>

          {testResult && (
            <div style={{ 
              background: testResult.success ? 'rgba(57, 255, 20, 0.08)' : 'rgba(230, 57, 70, 0.08)', 
              border: `1px solid ${testResult.success ? 'var(--color-success)' : 'var(--color-secondary)'}`, 
              color: testResult.success ? 'var(--color-success)' : '#fff', 
              padding: '12px', 
              borderRadius: '8px', 
              marginBottom: '16px', 
              fontSize: '13px'
            }}>
              <strong>Status:</strong> {testResult.message}
            </div>
          )}

          <div style={{ display: 'flex', gap: '15px' }}>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={testBakongConnection} 
              disabled={testingStatus === 'testing' || !bakongAccountId || !bakongToken}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              {testingStatus === 'testing' ? 'Testing Connection...' : 'Verify Bakong Token Connection'}
            </button>
          </div>
        </div>

        {/* Currency Settings Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* USD Settings Card */}
          <div className="card">
            <h3 className="card-title">$ USD Settings</h3>
            
            {usdPaymentMethod === 'aba' && !abaMerchantLinkUsd && (
              <div className="settings-warning-text">
                ⚠️ Payment Method - ABA Merchant Link (USD) not configured.
              </div>
            )}
            {usdPaymentMethod === 'bakong' && !bakongAccountId && (
              <div className="settings-warning-text">
                ⚠️ Payment Method - Bakong ID not configured.
              </div>
            )}
            {((usdPaymentMethod === 'aba' && abaMerchantLinkUsd) || (usdPaymentMethod === 'bakong' && bakongAccountId)) && (
              <div style={{ fontSize: '12px', color: 'var(--color-success)', marginBottom: '10px' }}>
                ✓ Payment Method configured.
              </div>
            )}

            <label style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Payment Method</label>
            <div className="gateway-selection-grid">
              <div 
                className={`gateway-select-card ${usdPaymentMethod === 'aba' ? 'active' : ''}`}
                onClick={() => setUsdPaymentMethod('aba')}
                type="button"
              >
                <div className="gateway-logo-wrapper">
                  <div className="gateway-logo-aba">aba</div>
                </div>
                <div className="gateway-card-title">ABA PayWay</div>
              </div>

              <div 
                className={`gateway-select-card ${usdPaymentMethod === 'bakong' ? 'active' : ''}`}
                onClick={() => setUsdPaymentMethod('bakong')}
                type="button"
              >
                <div className="gateway-logo-wrapper">
                  <div className="gateway-logo-bakong">bk</div>
                </div>
                <div className="gateway-card-title">Bakong</div>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <label style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Preset Amounts ($) — set to 0 to hide</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '16px' }}>
                <input type="text" value={presetUsd1} onChange={e => setPresetUsd1(e.target.value)} style={{ padding: '8px 4px', textAlign: 'center', fontSize: '12px' }} />
                <input type="text" value={presetUsd2} onChange={e => setPresetUsd2(e.target.value)} style={{ padding: '8px 4px', textAlign: 'center', fontSize: '12px' }} />
                <input type="text" value={presetUsd3} onChange={e => setPresetUsd3(e.target.value)} style={{ padding: '8px 4px', textAlign: 'center', fontSize: '12px' }} />
                <input type="text" value={presetUsd4} onChange={e => setPresetUsd4(e.target.value)} style={{ padding: '8px 4px', textAlign: 'center', fontSize: '12px' }} />
                <input type="text" value={presetUsd5} onChange={e => setPresetUsd5(e.target.value)} style={{ padding: '8px 4px', textAlign: 'center', fontSize: '12px' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '11px' }}>Min Amount ($)</label>
                  <input type="text" value={minUsd} onChange={e => setMinUsd(e.target.value)} placeholder="None" style={{ padding: '8px 10px', fontSize: '12px' }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '11px' }}>Max Amount ($)</label>
                  <input type="text" value={maxUsd} onChange={e => setMaxUsd(e.target.value)} placeholder="None" style={{ padding: '8px 10px', fontSize: '12px' }} />
                </div>
              </div>
            </div>
          </div>

          {/* KHR Settings Card */}
          <div className="card">
            <h3 className="card-title">៛ KHR Settings</h3>

            {khrPaymentMethod === 'aba' && !abaMerchantLinkKhr && (
              <div className="settings-warning-text">
                ⚠️ Payment Method - ABA Merchant Link (KHR) not configured.
              </div>
            )}
            {khrPaymentMethod === 'bakong' && !bakongAccountId && (
              <div className="settings-warning-text">
                ⚠️ Payment Method - Bakong ID not configured.
              </div>
            )}
            {((khrPaymentMethod === 'aba' && abaMerchantLinkKhr) || (khrPaymentMethod === 'bakong' && bakongAccountId)) && (
              <div style={{ fontSize: '12px', color: 'var(--color-success)', marginBottom: '10px' }}>
                ✓ Payment Method configured.
              </div>
            )}

            <label style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Payment Method</label>
            <div className="gateway-selection-grid">
              <div 
                className={`gateway-select-card ${khrPaymentMethod === 'aba' ? 'active' : ''}`}
                onClick={() => setKhrPaymentMethod('aba')}
                type="button"
              >
                <div className="gateway-logo-wrapper">
                  <div className="gateway-logo-aba">aba</div>
                </div>
                <div className="gateway-card-title">ABA PayWay</div>
              </div>

              <div 
                className={`gateway-select-card ${khrPaymentMethod === 'bakong' ? 'active' : ''}`}
                onClick={() => setKhrPaymentMethod('bakong')}
                type="button"
              >
                <div className="gateway-logo-wrapper">
                  <div className="gateway-logo-bakong">bk</div>
                </div>
                <div className="gateway-card-title">Bakong</div>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <label style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Preset Amounts (៛) — set to 0 to hide</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '16px' }}>
                <input type="text" value={presetKhr1} onChange={e => setPresetKhr1(e.target.value)} style={{ padding: '8px 4px', textAlign: 'center', fontSize: '11px' }} />
                <input type="text" value={presetKhr2} onChange={e => setPresetKhr2(e.target.value)} style={{ padding: '8px 4px', textAlign: 'center', fontSize: '11px' }} />
                <input type="text" value={presetKhr3} onChange={e => setPresetKhr3(e.target.value)} style={{ padding: '8px 4px', textAlign: 'center', fontSize: '11px' }} />
                <input type="text" value={presetKhr4} onChange={e => setPresetKhr4(e.target.value)} style={{ padding: '8px 4px', textAlign: 'center', fontSize: '11px' }} />
                <input type="text" value={presetKhr5} onChange={e => setPresetKhr5(e.target.value)} style={{ padding: '8px 4px', textAlign: 'center', fontSize: '11px' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '11px' }}>Min Amount (៛)</label>
                  <input type="text" value={minKhr} onChange={e => setMinKhr(e.target.value)} placeholder="None" style={{ padding: '8px 10px', fontSize: '12px' }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '11px' }}>Max Amount (៛)</label>
                  <input type="text" value={maxKhr} onChange={e => setMaxKhr(e.target.value)} placeholder="None" style={{ padding: '8px 10px', fontSize: '12px' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Save Button */}
        <button type="submit" className="steam-neon-btn steam-neon-btn-primary" style={{ padding: '16px' }} disabled={updating}>
          {updating ? 'Saving All Settings...' : 'Save All Payment Settings'}
        </button>
      </form>
    </div>
  );
}

// --- TTS SETTINGS ---
function DashboardTTS({ state, refresh }) {
  const loggedInUser = localStorage.getItem('username');
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [ttsVolume, setTtsVolume] = useState(1);
  const [ttsLang, setTtsLang] = useState('km-KH');
  const [ttsVoiceURI, setTtsVoiceURI] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (state.settings) {
      setTtsEnabled(state.settings.ttsEnabled || false);
      setTtsVolume(state.settings.ttsVolume ?? 1);
      setTtsLang(state.settings.ttsLang || 'km-KH');
      setTtsVoiceURI(state.settings.ttsVoiceURI || '');
    }
  }, [state]);

  const saveTtsSettings = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await fetch(`${API_BASE}/api/settings`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-Username': loggedInUser || ''
        },
        body: JSON.stringify({
          ttsEnabled,
          ttsVolume: parseFloat(ttsVolume),
          ttsLang,
          ttsVoiceURI
        })
      });
      refresh();
      alert('TTS Settings updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Error saving TTS settings');
    } finally {
      setUpdating(false);
    }
  };

  const handleTestTTS = () => {
    const testText = ttsLang === 'km-KH' 
      ? 'សួស្តី នេះជាការសាកល្បងសំឡេងរបស់ខ្ញុំ' 
      : 'Hello, this is a test of my voice';
      
    if (ttsVoiceURI === 'browser') {
      const utter = new SpeechSynthesisUtterance(testText);
      utter.lang = ttsLang;
      utter.volume = parseFloat(ttsVolume);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } else {
      const voice = ttsVoiceURI || 'Sreymom';
      const ttsUrl = `${API_BASE}/api/tts?text=${encodeURIComponent(testText)}&voice=${encodeURIComponent(voice)}`;
      const audio = new Audio(ttsUrl);
      audio.volume = parseFloat(ttsVolume);
      audio.play().catch(err => {
        console.error('TTS preview failed:', err);
        alert('Could not play TTS preview. Make sure the server is running.');
      });
    }
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', marginBottom: '24px', textTransform: 'uppercase', color: '#fff' }}>
        Text-To-Speech (TTS) Settings
      </h2>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
        Configure the TTS system to read donation messages and alerts aloud.
      </p>

      <form onSubmit={saveTtsSettings} className="card">
        <h3 className="card-title">
          <Volume2 size={20} /> TTS Configuration
        </h3>
        
        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', marginBottom: '20px' }}>
          <input 
            type="checkbox" 
            checked={ttsEnabled} 
            id="ttsEnabled"
            onChange={e => setTtsEnabled(e.target.checked)} 
            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
          />
          <label htmlFor="ttsEnabled" style={{ margin: 0, cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}>
            Enable TTS (Read messages aloud)
          </label>
        </div>

        {ttsEnabled && (
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '8px', border: '1px solid var(--color-border)', marginBottom: '20px' }}>
            <div className="form-group">
              <label>TTS Language</label>
              <select value={ttsLang} onChange={e => setTtsLang(e.target.value)} style={{ width: '100%', padding: '8px', background: '#090a0f', color: '#fff', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
                <option value="km-KH">Khmer (km-KH)</option>
                <option value="en-US">English (en-US)</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>TTS Voice (Custom Cloud / Browser Default)</label>
              <select value={ttsVoiceURI} onChange={e => setTtsVoiceURI(e.target.value)} style={{ width: '100%', padding: '8px', background: '#090a0f', color: '#fff', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
                <option value="Sreymom">Sreymom (Premium Khmer Female)</option>
                <option value="Piseth">Piseth (Premium Khmer Male)</option>
                <option value="Chingchang">Chingchang (Premium Meme Voice)</option>
                <option value="browser">Local Browser Default (Speech Synthesis)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>TTS Volume (0.0 to 1.0)</label>
              <input type="number" step="0.1" min="0" max="1" value={ttsVolume} onChange={e => setTtsVolume(e.target.value)} />
            </div>

            <div style={{ marginTop: '20px' }}>
              <button
                type="button"
                onClick={handleTestTTS}
                className="btn-secondary"
                style={{ width: '100%', borderColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                🔊 Preview TTS Voice
              </button>
            </div>
          </div>
        )}

        <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={updating}>
          Save TTS Settings
        </button>
      </form>
    </div>
  );
}

// --- OBS WIDGET LINKS ---
function DashboardWidgets() {
  const [copied, setCopied] = useState('');
  const username = localStorage.getItem('username') || '';
  const host = window.location.origin;

  const widgets = [
    { name: 'Alert Box', path: `/overlays/alertbox?username=${username}`, size: '1920 x 1080', desc: 'Shows animated notifications on new donations and follows' },
    { name: 'Donation Goal Bar', path: `/overlays/goal?username=${username}`, size: '400 x 80', desc: 'A progress bar indicating current donation goal' },
    { name: 'Stream Ticker', path: `/overlays/ticker?username=${username}`, size: '600 x 60', desc: 'Displays latest follower, latest donation and top donor info' }
  ];

  const handleCopy = (path) => {
    navigator.clipboard.writeText(`${host}${path}`);
    setCopied(path);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', marginBottom: '24px', textTransform: 'uppercase', color: '#fff' }}>OBS Browser Sources</h2>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
        Add these URLs as Browser Sources inside OBS. Use the recommended size values.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {widgets.map(w => (
          <div key={w.path} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ flex: '1 1 300px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', fontFamily: 'var(--font-display)' }}>{w.name}</h3>
                <span style={{ fontSize: '12px', background: '#171923', padding: '2px 8px', border: '1px solid var(--color-border)', borderRadius: '4px', color: 'var(--color-primary)' }}>
                  {w.size}
                </span>
              </div>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '5px' }}>{w.desc}</p>
              <code style={{ display: 'block', marginTop: '10px', wordBreak: 'break-all' }}>{`${host}${w.path}`}</code>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => handleCopy(w.path)}>
                <Copy size={16} /> {copied === w.path ? 'Copied!' : 'Copy Link'}
              </button>
              <a href={w.path} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ textDecoration: 'none' }}>
                <ExternalLink size={16} /> Open
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- OVERLAY: ALERT BOX ---
function AlertBoxOverlay() {
  const [activeAlert, setActiveAlert] = useState(null);
  const queueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const [audioBlocked, setAudioBlocked] = useState(false);

  const unlockAudio = () => {
    // Play a silent sound to unlock audio context
    const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAAA');
    audio.play().then(() => {
      setAudioBlocked(false);
    }).catch(err => console.error("Unlock audio failed:", err));
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const username = params.get('username') || '';

    const ws = new WebSocket(`${WS_URL}?username=${username}`);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'ALERT') {
        queueRef.current.push(message.data);
        if (!isPlayingRef.current) {
          playNext();
        }
      }
    };

    const playNext = () => {
      if (queueRef.current.length === 0) {
        isPlayingRef.current = false;
        setActiveAlert(null);
        return;
      }

      isPlayingRef.current = true;
      const nextAlert = queueRef.current.shift();
      setActiveAlert(nextAlert);

      if (nextAlert.settings?.soundUrl) {
        const audio = new Audio(nextAlert.settings.soundUrl);
        audio.volume = nextAlert.settings.soundVolume ?? 0.8;
        audio.play().catch(e => {
          console.error("Error playing audio:", e);
          if (e.name === 'NotAllowedError') {
            setAudioBlocked(true);
          }
        });
      }

      if (nextAlert.settings?.ttsEnabled) {
        let ttsText = '';
        if (nextAlert.amount) {
          const template = nextAlert.settings?.donationTextTemplate;
          if (template) {
            let amountStr = '';
            const cur = (nextAlert.currency || 'USD').toUpperCase();
            if (cur === 'KHR') {
              amountStr = `${nextAlert.amount} រៀល`;
            } else {
              amountStr = `${nextAlert.amount} ដុល្លារ`;
            }
            ttsText = template
              .replace(/{name}/g, nextAlert.name)
              .replace(/{amount}/g, amountStr);
          } else {
            const cur = (nextAlert.currency || 'USD').toUpperCase();
            if (cur === 'KHR') {
              ttsText = `${nextAlert.name} បានផ្ញើ ${nextAlert.amount} រៀល`;
            } else {
              ttsText = `${nextAlert.name} បានផ្ញើ ${nextAlert.amount} ដុល្លារ`;
            }
          }
          if (nextAlert.message) {
            ttsText += `. ${nextAlert.message}`;
          }
        } else {
          const template = nextAlert.settings?.followTextTemplate;
          if (template) {
            ttsText = template.replace(/{name}/g, nextAlert.name);
          } else {
            ttsText = `${nextAlert.name} បានតាមដាន`;
          }
        }

        const voiceType = nextAlert.settings?.ttsVoiceURI || 'Sreymom';

        if (voiceType === 'browser') {
          const utter = new SpeechSynthesisUtterance(ttsText);
          utter.lang = nextAlert.settings?.ttsLang || 'km-KH';
          utter.volume = nextAlert.settings?.ttsVolume ?? 1;
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utter);
        } else {
          const volume = nextAlert.settings?.ttsVolume ?? 1;
          setTimeout(() => {
            const ttsUrl = `${API_BASE}/api/tts?text=${encodeURIComponent(ttsText)}&voice=${encodeURIComponent(voiceType)}`;
            const audio = new Audio(ttsUrl);
            audio.volume = volume;
            audio.play().catch(e => {
              console.error("Error playing cloud TTS:", e);
              if (e.name === 'NotAllowedError') {
                setAudioBlocked(true);
              }
            });
          }, 1200);
        }
      }

      setTimeout(() => {
        setActiveAlert(null);
        setTimeout(playNext, 500);
      }, nextAlert.settings?.alertDuration || 7000);
    };

    return () => ws.close();
  }, []);

  if (!activeAlert) {
    return (
      <div className="overlay-container">
        {audioBlocked && (
          <button 
            onClick={unlockAudio}
            style={{
              position: 'fixed',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(255, 0, 127, 0.9)',
              color: '#fff',
              border: '1px solid var(--color-secondary)',
              boxShadow: '0 0 15px rgba(255, 0, 127, 0.6)',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              zIndex: 9999,
              fontFamily: 'var(--font-display)',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Volume2 size={16} /> Click to Unblock Sound/TTS
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="overlay-container">
      {audioBlocked && (
        <button 
          onClick={unlockAudio}
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 0, 127, 0.9)',
            color: '#fff',
            border: '1px solid var(--color-secondary)',
            boxShadow: '0 0 15px rgba(255, 0, 127, 0.6)',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            zIndex: 9999,
            fontFamily: 'var(--font-display)',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Volume2 size={16} /> Click to Unblock Sound/TTS
        </button>
      )}
      <div className="alert-box" key={activeAlert.timestamp}>
        {activeAlert.settings?.gifUrl && (
          <img src={activeAlert.settings.gifUrl} alt="Alert GIF" className="alert-gif" />
        )}
        <div className="alert-text-container">
          <div className="alert-title">
            {activeAlert.amount ? 'New Donation!' : 'New Follower!'}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            <span className="alert-username">{activeAlert.name}</span>
            {activeAlert.amount && (
              <> has sent <span className="alert-amount">{formatCurrency(activeAlert.amount, activeAlert.currency)}</span></>
            )}
          </div>
          {activeAlert.message && (
            <div className="alert-message">"{activeAlert.message}"</div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- OVERLAY: GOAL TRACKER ---
function GoalOverlay() {
  const [goal, setGoal] = useState({ title: '', target: 100, current: 0, active: false });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const username = params.get('username') || '';

    const ws = new WebSocket(`${WS_URL}?username=${username}`);
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'STATE_UPDATE' || message.type === 'INIT_STATE') {
        if (message.data.goal) {
          setGoal(message.data.goal);
        }
      }
    };
    return () => ws.close();
  }, []);

  if (!goal.active) return null;

  const percent = Math.min(100, Math.round((goal.current / goal.target) * 100));

  return (
    <div className="overlay-container" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: '20px' }}>
      <div className="goal-container">
        <div className="goal-header">
          <span className="goal-title">{goal.title}</span>
          <span className="goal-numbers">{formatCurrency(goal.current)} / {formatCurrency(goal.target)}</span>
        </div>
        <div className="goal-bar-bg">
          <div className="goal-bar-fill" style={{ width: `${percent}%` }}></div>
          <span className="goal-percent">{percent}%</span>
        </div>
      </div>
    </div>
  );
}

// --- OVERLAY: TICKER ---
function TickerOverlay() {
  const [stats, setStats] = useState({ topDonation: null, latestDonation: null, latestFollower: null });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const username = params.get('username') || '';

    const ws = new WebSocket(`${WS_URL}?username=${username}`);
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'STATE_UPDATE' || message.type === 'INIT_STATE') {
        setStats(message.data.stats);
      }
    };
    return () => ws.close();
  }, []);

  return (
    <div className="overlay-container" style={{ display: 'flex', alignItems: 'flex-end', padding: '20px' }}>
      <div className="ticker-container">
        <div className="ticker-item">
          <span className="ticker-label">Recent Follower</span>
          <span className="ticker-value">
            {stats.latestFollower ? stats.latestFollower.name : 'None'}
          </span>
        </div>
        <div style={{ width: '1px', background: 'var(--color-border)' }}></div>
        <div className="ticker-item">
          <span className="ticker-label">Recent Donation</span>
          <span className="ticker-value">
            {stats.latestDonation ? `${stats.latestDonation.name} (${formatCurrency(stats.latestDonation.amount, stats.latestDonation.currency)})` : 'None'}
          </span>
        </div>
        <div style={{ width: '1px', background: 'var(--color-border)' }}></div>
        <div className="ticker-item">
          <span className="ticker-label">Top Donor</span>
          <span className="ticker-value">
            {stats.topDonation ? `${stats.topDonation.name} (${formatCurrency(stats.topDonation.amount, stats.topDonation.currency)})` : 'None'}
          </span>
        </div>
      </div>
    </div>
  );
}

// --- PAGE: PUBLIC DONATION GATEWAY ---
function PublicDonationPage() {
  const [streamerName, setStreamerName] = useState('');
  const [streamerInput, setStreamerInput] = useState('');
  const [streamerInfo, setStreamerInfo] = useState(null);
  const [streamerNotFound, setStreamerNotFound] = useState(false);
  const [loadingStreamer, setLoadingStreamer] = useState(false);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);
  
  // Checkout Wizard steps
  const [checkoutStep, setCheckoutStep] = useState(1); // 1 = Details, 2 = Pay Method, 3 = Pay Box
  const [payMethod, setPayMethod] = useState('aba'); // 'aba', 'khqr', 'card'
  
  // Credit Card mock inputs
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardSubmitted, setCardSubmitted] = useState(false);
  const [cardError, setCardError] = useState('');

  const [success, setSuccess] = useState(false);
  const [successDetails, setSuccessDetails] = useState({ name: '', amount: 0, currency: 'USD' });
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrString, setQrString] = useState('');
  const [transactionMd5, setTransactionMd5] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes validity
  const [errorText, setErrorText] = useState('');
  const [isGeoBlocked, setIsGeoBlocked] = useState(false);
  const [paymentCode, setPaymentCode] = useState('');

  // 1. Check query parameters on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pUser = params.get('user') || '';
    const pName = params.get('name') || '';
    const pAmount = params.get('amount') || '';
    const pMessage = params.get('message') || '';
    const pCurrency = params.get('currency') || 'USD';
    
    if (pUser) {
      setStreamerName(pUser.toLowerCase());
    }
    if (pName) setName(pName);
    if (pAmount) setAmount(pAmount);
    if (pMessage) setMessage(pMessage);
    if (pCurrency) {
      const upperCur = pCurrency.toUpperCase();
      if (upperCur === 'KHR' || upperCur === 'USD') {
        setCurrency(upperCur);
      }
    }
  }, []);

  // 2. Fetch public info of the streamer when streamerName changes
  useEffect(() => {
    if (!streamerName) return;

    const fetchStreamer = async () => {
      setLoadingStreamer(true);
      setStreamerNotFound(false);
      try {
        const res = await fetch(`/api/donate/streamer/${streamerName}`);
        if (res.ok) {
          const data = await res.json();
          setStreamerInfo(data);
        } else {
          setStreamerNotFound(true);
        }
      } catch (err) {
        console.error(err);
        setStreamerNotFound(true);
      } finally {
        setLoadingStreamer(false);
      }
    };
    fetchStreamer();
  }, [streamerName]);

  const activeMethod = currency === 'KHR'
    ? (streamerInfo?.settings?.khrPaymentMethod || 'bakong')
    : (streamerInfo?.settings?.usdPaymentMethod || 'bakong');

  useEffect(() => {
    if (activeMethod === 'aba') {
      setPayMethod('aba_merchant');
    } else {
      if (payMethod === 'aba_merchant') {
        setPayMethod('aba');
      }
    }
  }, [activeMethod]);

  // Polling loop for payment confirmation and countdown timer (only for QR codes)
  useEffect(() => {
    if (checkoutStep !== 3 || !transactionMd5 || payMethod === 'card' || payMethod === 'aba_merchant') return;

    let pollInterval;
    let timerInterval;

    let clientVerifyToken = null;
    let clientVerifyUrl = null;

    pollInterval = setInterval(async () => {
      try {
        if (clientVerifyToken && clientVerifyUrl) {
          const payload = JSON.stringify({ md5: transactionMd5 });
          try {
            const clientRes = await fetch(clientVerifyUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${clientVerifyToken}`,
                'Content-Type': 'application/json'
              },
              body: payload
            });
            if (clientRes.ok) {
              const clientData = await clientRes.json();
              if (clientData && clientData.responseCode === 0) {
                const confirmRes = await fetch(`/api/donate/confirm`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    md5: transactionMd5,
                    remark: clientData.data?.remark || null
                  })
                });
                const confirmData = await confirmRes.json();
                if (confirmRes.ok && confirmData.success) {
                  setSuccessDetails({ name, amount: parseFloat(amount) || 0, currency });
                  setSuccess(true);
                  setCheckoutStep(1);
                  setTransactionMd5('');
                  setQrDataUrl('');
                  setQrString('');
                  setIsGeoBlocked(false);
                  setName('');
                  setAmount('');
                  setMessage('');
                }
              } else if (clientData && clientData.responseCode === 1 && clientData.errorCode === 1) {
                // Still pending — keep polling
              } else {
                setErrorText(clientData?.responseMessage || 'Payment processing failed.');
                setCheckoutStep(2);
                setTransactionMd5('');
              }
            }
          } catch (corsErr) {
            console.warn('Browser-side CORS block. Showing manual confirm.', corsErr);
            clearInterval(pollInterval);
            setIsGeoBlocked(true);
          }
        } else {
          const response = await fetch(`/api/donate/check/${transactionMd5}`);
          const data = await response.json();
          
          if (response.ok && data.success) {
            if (data.status === 'paid') {
              setSuccessDetails({ name, amount: parseFloat(amount) || 0, currency });
              setSuccess(true);
              setCheckoutStep(1);
              setTransactionMd5('');
              setQrDataUrl('');
              setQrString('');
              setName('');
              setAmount('');
              setMessage('');
            } else if (data.status === 'check_client') {
              clientVerifyToken = data.token;
              clientVerifyUrl = data.apiUrl;
            } else if (data.status === 'failed') {
              setErrorText(data.message || 'Payment processing failed.');
              setCheckoutStep(2);
              setTransactionMd5('');
            }
          }
        }
      } catch (err) {
        console.error("Error polling donation status:", err);
      }
    }, 3000);

    timerInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(pollInterval);
          clearInterval(timerInterval);
          setCheckoutStep(2);
          setTransactionMd5('');
          alert('Payment request expired. Please try again.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(timerInterval);
    };
  }, [checkoutStep, transactionMd5, payMethod]);

  const handleSearchStreamer = (e) => {
    e.preventDefault();
    if (streamerInput.trim()) {
      window.location.search = `?user=${encodeURIComponent(streamerInput.trim().toLowerCase())}`;
    }
  };

  const handleDetailsSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !amount || isNaN(amount)) {
      alert('Please fill out all fields with valid information.');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (currency === 'KHR') {
      if (numericAmount < 100) {
        alert('Minimum donation in KHR is 100 Riels');
        return;
      }
    } else {
      if (numericAmount < 0.01) {
        alert('Minimum donation in USD is $0.01');
        return;
      }
    }

    setCheckoutStep(2);
  };

  const initiatePayment = async () => {
    setLoading(true);
    setErrorText('');
    setCardError('');
    try {
      const response = await fetch('/api/donate/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          amount: parseFloat(amount),
          currency,
          message: message.trim(),
          username: streamerName
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setQrDataUrl(data.qrDataUrl);
        setQrString(data.qrString || '');
        setTransactionMd5(data.md5);
        setPaymentCode(data.paymentCode || '');
        setTimeLeft(300); // Reset timer
        setCheckoutStep(3);
      } else {
        alert(data.error || 'Failed to initiate transaction.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCardSubmit = async (e) => {
    e.preventDefault();
    if (cardNumber.replace(/\s+/g, '').length !== 16) {
      setCardError('Card Number must be exactly 16 digits.');
      return;
    }
    if (!cardHolder.trim()) {
      setCardError('Cardholder Name is required.');
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      setCardError('Expiry Date must be in MM/YY format.');
      return;
    }
    if (cardCvv.length !== 3 || isNaN(cardCvv)) {
      setCardError('CVV must be exactly 3 digits.');
      return;
    }

    setCardSubmitted(true);
    setCardError('');

    // Simulate PayWay credit card authentication latency
    setTimeout(async () => {
      try {
        const res = await fetch('/api/donate/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            md5: transactionMd5,
            remark: `[ABA PayWay Card] ${message.trim()}`
          })
        });
        const d = await res.json();
        if (res.ok && d.success) {
          setSuccessDetails({ name, amount: parseFloat(amount) || 0, currency });
          setSuccess(true);
          setCheckoutStep(1);
          setTransactionMd5('');
          setCardNumber('');
          setCardHolder('');
          setCardExpiry('');
          setCardCvv('');
          setName('');
          setAmount('');
          setMessage('');
        } else {
          setCardError(d.error || 'Card processing failed. Please check details.');
        }
      } catch (e) {
        setCardError('Network error during card authorization. Please try again.');
      } finally {
        setCardSubmitted(false);
      }
    }, 1800);
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.slice(0, 2)}/${v.slice(2, 4)}`;
    }
    return v;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // View: If no user selected
  if (!streamerName) {
    return (
      <div className="steam-neon-page" style={{ justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <div className="steam-neon-card" style={{ maxWidth: '450px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', color: '#fff', fontSize: '28px', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>
              SUPPORT A <span>STREAMER</span>
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Enter the streamer username to open their neon gateway</p>
          </div>
          <form onSubmit={handleSearchStreamer}>
            <div className="steam-input-group">
              <label>Streamer Username</label>
              <div className="steam-input-wrapper">
                <span className="steam-input-icon"><User size={18} /></span>
                <input 
                  type="text" 
                  value={streamerInput} 
                  onChange={e => setStreamerInput(e.target.value)} 
                  required 
                  placeholder="e.g. kheang"
                />
              </div>
            </div>
            <button type="submit" className="steam-neon-btn steam-neon-btn-primary" style={{ marginTop: '10px' }}>
              Find Streamer Page <ChevronRight size={16} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // View: Streamer Loading
  if (loadingStreamer) {
    return (
      <div className="steam-neon-page" style={{ justifyContent: 'center', alignItems: 'center', color: 'var(--color-primary)', fontFamily: 'var(--font-display)', fontSize: '24px', letterSpacing: '2px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
          <div className="pulse-loader" style={{ width: '20px', height: '20px' }}></div>
          RETRIEVING NEON GATEWAY...
        </div>
      </div>
    );
  }

  // View: Streamer Not Found
  if (streamerNotFound) {
    return (
      <div className="steam-neon-page" style={{ justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <div className="steam-neon-card" style={{ textAlign: 'center', maxWidth: '450px', width: '100%' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-secondary)', fontSize: '28px', marginBottom: '15px', textTransform: 'uppercase' }}>
            GATEWAY OFFLINE
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '30px', fontSize: '14px' }}>
            The streamer account <strong>"{streamerName}"</strong> does not exist or has not configured their credentials yet.
          </p>
          <button className="steam-neon-btn steam-neon-btn-secondary" onClick={() => setStreamerName('')}>
            <ChevronLeft size={16} /> Try Another Username
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="steam-neon-page">
      {/* Header bar */}
      <header className="steam-neon-header">
        <div className="steam-neon-header-container">
          <div className="steam-logo">
            KHEANG<span>ALERT</span>
          </div>
          <ul className="steam-nav-links">
            <li className="steam-nav-item">Store</li>
            <li className="steam-nav-item">Community</li>
            <li className="steam-nav-item active">Support</li>
          </ul>
        </div>
      </header>

      {/* Main content grid */}
      <div className="steam-neon-container">
        {/* Left Side: Checkout Flow */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {!success ? (
            <div className="steam-neon-card">
              {/* Wizard Steps indicator */}
              <div className="wizard-steps-header">
                <div className={`wizard-step-indicator ${checkoutStep >= 1 ? 'active' : ''} ${checkoutStep > 1 ? 'completed' : ''}`}>
                  {checkoutStep > 1 ? '✓' : '1'}
                </div>
                <div className={`wizard-step-indicator ${checkoutStep >= 2 ? 'active' : ''} ${checkoutStep > 2 ? 'completed' : ''}`}>
                  {checkoutStep > 2 ? '✓' : '2'}
                </div>
                <div className={`wizard-step-indicator ${checkoutStep >= 3 ? 'active' : ''}`}>
                  3
                </div>
              </div>

              {/* STEP 1: Donation Form */}
              {checkoutStep === 1 && (
                <form onSubmit={handleDetailsSubmit}>
                  <div className="steam-neon-card-title">
                    <Coins size={20} style={{ color: 'var(--color-primary)' }} /> Donation Checkout Details
                  </div>

                  <div className="steam-input-group">
                    <label>Your Name / Alias</label>
                    <div className="steam-input-wrapper">
                      <span className="steam-input-icon"><User size={16} /></span>
                      <input 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        required 
                        placeholder="Enter your nickname"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '15px' }}>
                    <div className="steam-input-group">
                      <label>Currency</label>
                      <div className="steam-input-wrapper input-without-icon">
                        <select
                          value={currency}
                          onChange={e => {
                            const newCur = e.target.value;
                            setCurrency(newCur);
                            if (newCur === 'KHR') {
                              setAmount('4000');
                            } else {
                              setAmount('10');
                            }
                          }}
                        >
                          <option value="USD">USD ($)</option>
                          <option value="KHR">KHR (៛)</option>
                        </select>
                      </div>
                    </div>

                    <div className="steam-input-group">
                      <label>Donation Amount</label>
                      <div className="steam-input-wrapper input-without-icon">
                        <input 
                          type="number" 
                          min={currency === 'KHR' ? '100' : '0.01'} 
                          step={currency === 'KHR' ? '100' : '0.01'}
                          value={amount} 
                          onChange={e => setAmount(e.target.value)} 
                          required 
                          placeholder={currency === 'KHR' ? 'e.g. 4000' : 'e.g. 10.00'}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="steam-input-group">
                    <label>Your Message (will appear on stream!)</label>
                    <div className="steam-input-wrapper">
                      <span className="steam-input-icon"><MessageSquare size={16} style={{ marginTop: '-24px' }} /></span>
                      <textarea 
                        rows="4" 
                        value={message} 
                        onChange={e => setMessage(e.target.value)} 
                        placeholder="Add a message to your donation..."
                      />
                    </div>
                  </div>

                  <button type="submit" className="steam-neon-btn steam-neon-btn-primary" style={{ marginTop: '10px' }}>
                    Choose Payment Method <ChevronRight size={16} />
                  </button>
                </form>
              )}

              {/* STEP 2: Payment Selector */}
              {checkoutStep === 2 && (
                <div>
                  <div className="steam-neon-card-title">
                    <ShieldCheck size={20} style={{ color: 'var(--color-primary)' }} /> Select Payment Method
                  </div>

                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
                    Select how you would like to securely transfer your donation to <strong>{streamerName}</strong>.
                  </p>

                  <div className="payment-selector-tabs">
                    {activeMethod === 'aba' ? (
                      <div 
                        className={`payment-tab-btn active`}
                        onClick={() => setPayMethod('aba_merchant')}
                        style={{ flex: 1, textAlign: 'center' }}
                      >
                        <span className="payment-tab-btn-icon">💳</span>
                        <span>ABA PAYWAY</span>
                        <span style={{ fontSize: '9px', opacity: 0.7 }}>Secure Merchant Link</span>
                      </div>
                    ) : (
                      <>
                        <div 
                          className={`payment-tab-btn ${payMethod === 'aba' ? 'active' : ''}`}
                          onClick={() => setPayMethod('aba')}
                        >
                          <span className="payment-tab-btn-icon">💳</span>
                          <span>ABA PAY</span>
                          <span style={{ fontSize: '9px', opacity: 0.7 }}>Mobile App link</span>
                        </div>

                        <div 
                          className={`payment-tab-btn ${payMethod === 'khqr' ? 'active' : ''}`}
                          onClick={() => setPayMethod('khqr')}
                        >
                          <span className="payment-tab-btn-icon">📲</span>
                          <span>Universal KHQR</span>
                          <span style={{ fontSize: '9px', opacity: 0.7 }}>Scan with any bank</span>
                        </div>

                        <div 
                          className={`payment-tab-btn ${payMethod === 'card' ? 'active' : ''}`}
                          onClick={() => setPayMethod('card')}
                        >
                          <span className="payment-tab-btn-icon">🌐</span>
                          <span>Credit Card</span>
                          <span style={{ fontSize: '9px', opacity: 0.7 }}>PayWay secure card</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div style={{ background: 'rgba(23, 26, 33, 0.5)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(42, 71, 94, 0.4)', marginBottom: '24px' }}>
                    {payMethod === 'aba_merchant' && (
                      <div>
                        <h4 style={{ color: '#fff', fontSize: '15px', marginBottom: '6px' }}>ABA PayWay Merchant Link</h4>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                          Checkout directly via the streamer's official ABA Merchant Link. You can pay with your ABA Mobile app or any credit card.
                        </p>
                      </div>
                    )}
                    {payMethod === 'aba' && (
                      <div>
                        <h4 style={{ color: '#fff', fontSize: '15px', marginBottom: '6px' }}>Direct ABA Mobile App checkout</h4>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                          This will generate a payment link that instantly redirects to your ABA Mobile app on smartphone. Once verified, your alert goes live!
                        </p>
                      </div>
                    )}
                    {payMethod === 'khqr' && (
                      <div>
                        <h4 style={{ color: '#fff', fontSize: '15px', marginBottom: '6px' }}>Universal KHQR payment</h4>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                          Generates a standardized Bakong KHQR code. Scan with ABA Mobile, Acleda Mobile, Wing, or any Cambodian banking app to pay.
                        </p>
                      </div>
                    )}
                    {payMethod === 'card' && (
                      <div>
                        <h4 style={{ color: '#fff', fontSize: '15px', marginBottom: '6px' }}>Secure credit or debit card</h4>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                          Checkout using Visa, Mastercard, or UnionPay credit card via a secure simulated PayWay card processing gateway.
                        </p>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <button 
                      className="steam-neon-btn steam-neon-btn-secondary" 
                      onClick={() => setCheckoutStep(1)}
                      disabled={loading}
                    >
                      <ChevronLeft size={16} /> Back to Details
                    </button>
                    <button 
                      className="steam-neon-btn steam-neon-btn-primary" 
                      onClick={initiatePayment}
                      disabled={loading}
                    >
                      {loading ? 'Initiating...' : 'Proceed to Pay'} <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: QR Code scan or Card processing */}
              {checkoutStep === 3 && (
                <div>
                  <div className="steam-neon-card-title">
                    <ShieldCheck size={20} style={{ color: 'var(--color-primary)' }} /> Secure Checkout Portal
                  </div>

                  {/* Option 3C: ABA PayWay Merchant Link redirection */}
                  {payMethod === 'aba_merchant' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', textAlign: 'center' }}>
                        To complete your donation, click the link below to open the streamer's secure ABA PayWay portal. Complete the transaction there, then click the confirmation button below.
                      </p>

                      <div style={{ background: 'rgba(0, 240, 255, 0.05)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '8px', padding: '12px', width: '100%', textAlign: 'center', marginBottom: '10px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Amount to Pay</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-primary)', fontFamily: 'monospace', marginTop: '4px' }}>
                          {formatCurrency(parseFloat(amount), currency)}
                        </div>
                      </div>

                      {paymentCode && (
                        <div style={{ background: 'rgba(255, 180, 0, 0.05)', border: '1px dashed rgba(255, 180, 0, 0.3)', borderRadius: '8px', padding: '12px', width: '100%', textAlign: 'center', marginBottom: '5px' }}>
                          <div style={{ fontSize: '11px', color: '#ffb400', fontWeight: 'bold' }}>⚠️ REQUIRED ABA TRANSACTION DESCRIPTION</div>
                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                            <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', fontFamily: 'monospace', letterSpacing: '1px' }}>
                              {paymentCode}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(paymentCode);
                                alert('Code copied! Please paste it in your ABA app description field.');
                              }}
                              style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: '#fff',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                cursor: 'pointer'
                              }}
                            >
                              Copy
                            </button>
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                            Put this code in ABA Transfer description so the Telegram bot can instantly trigger the alert.
                          </div>
                        </div>
                      )}

                      {/* Open ABA PayWay Button */}
                      <a
                        href={currency === 'KHR' ? streamerInfo?.settings?.abaMerchantLinkKhr : streamerInfo?.settings?.abaMerchantLinkUsd}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="steam-neon-btn steam-neon-btn-primary"
                        style={{
                          width: '100%',
                          textDecoration: 'none',
                          textAlign: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '10px',
                          padding: '14px'
                        }}
                      >
                        💳 Open ABA PayWay to Pay
                      </a>

                      <div style={{ width: '100%', borderBottom: '1px dashed var(--color-border)', margin: '10px 0' }}></div>

                      {/* Manual Confirmation Button */}
                      <button
                        className="steam-neon-btn"
                        style={{
                          width: '100%',
                          background: 'linear-gradient(90deg, #00ff87, #60efff)',
                          color: '#090a0f',
                          fontWeight: 'bold',
                          padding: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          border: 'none',
                          boxShadow: '0 0 15px rgba(0, 255, 135, 0.3)'
                        }}
                        onClick={async () => {
                          setLoading(true);
                          try {
                            const res = await fetch('/api/donate/confirm', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ 
                                md5: transactionMd5,
                                remark: `[ABA PayWay] ${message.trim()}`
                              })
                            });
                            const d = await res.json();
                            if (res.ok && d.success) {
                              setSuccessDetails({ name, amount: parseFloat(amount) || 0, currency });
                              setSuccess(true);
                              setCheckoutStep(1);
                              setTransactionMd5('');
                              setName('');
                              setAmount('');
                              setMessage('');
                            } else {
                              alert(d.error || 'Confirmation failed. Try again.');
                            }
                          } catch (e) {
                            alert('Network error. Try again.');
                          } finally {
                            setLoading(false);
                          }
                        }}
                        disabled={loading}
                      >
                        {loading ? 'Processing...' : "✅ I've Paid — Alert Stream"}
                      </button>
                    </div>
                  )}

                  {/* Option 3A: ABA/Bakong QR Scan */}
                  {(payMethod === 'aba' || payMethod === 'khqr') && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', textAlign: 'center', marginBottom: '15px' }}>
                        Scan the KHQR below with your banking app or tap direct mobile links to checkout.
                      </p>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '20px' }}>
                        {qrString && (payMethod === 'khqr' || payMethod === 'aba') && (
                          <a
                            href={`https://pay.ababank.com/khqr/${encodeURIComponent(qrString)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              background: '#005C8A',
                              color: '#fff',
                              padding: '8px 16px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 2px 10px rgba(0,92,138,0.4)',
                            }}
                          >
                            💳 Open in ABA
                          </a>
                        )}
                        
                        {qrString && payMethod === 'khqr' && (
                          <a
                            href={`https://api-bakong.nbc.gov.kh/v1/generate_deeplink_by_qr?qr=${encodeURIComponent(qrString)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              background: '#E21836',
                              color: '#fff',
                              padding: '8px 16px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 2px 10px rgba(226,24,54,0.4)',
                            }}
                          >
                            📱 Open in Bakong
                          </a>
                        )}
                      </div>

                      <div className="qr-code-img" style={{ border: '2px solid var(--color-primary)', width: '220px', height: '220px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#fff', padding: '10px' }}>
                        {qrDataUrl ? (
                          <img src={qrDataUrl} alt="KHQR payment code" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                          <div style={{ color: '#000', fontSize: '13px' }}>Generating Code...</div>
                        )}
                      </div>

                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', margin: '15px 0 5px 0', fontFamily: 'monospace' }}>
                        Amount: {formatCurrency(parseFloat(amount), currency)}
                      </div>

                      {isGeoBlocked ? (
                        <div style={{ width: '100%', marginTop: '10px' }}>
                          <div style={{ background: 'rgba(255,180,0,0.1)', border: '1px solid rgba(255,180,0,0.3)', borderRadius: '8px', padding: '12px', marginBottom: '15px', fontSize: '12px', color: '#ffb400', textAlign: 'center' }}>
                            ⚠️ Auto-checking geo-blocked. Tap below to confirm payment completion manually.
                          </div>
                          <button
                            className="steam-neon-btn steam-neon-btn-primary"
                            onClick={async () => {
                              try {
                                const res = await fetch('/api/donate/confirm', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ md5: transactionMd5 })
                                });
                                const d = await res.json();
                                if (res.ok && d.success) {
                                  setSuccessDetails({ name, amount: parseFloat(amount) || 0, currency });
                                  setSuccess(true);
                                  setCheckoutStep(1);
                                  setTransactionMd5('');
                                  setQrDataUrl('');
                                  setQrString('');
                                  setIsGeoBlocked(false);
                                  setName('');
                                  setAmount('');
                                  setMessage('');
                                } else {
                                  alert(d.error || 'Confirmation failed. Try again.');
                                }
                              } catch (e) {
                                alert('Network error. Try again.');
                              }
                            }}
                          >
                            ✅ I've Paid — Alert Stream
                          </button>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', marginTop: '10px' }}>
                          <p style={{ color: 'var(--color-primary)', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                            <span className="pulse-loader"></span> Waiting for bank confirmation...
                          </p>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                            Expires in <span style={{ color: '#fff', fontWeight: 'bold', fontFamily: 'monospace' }}>{formatTime(timeLeft)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Option 3B: Credit Card checkout form simulation */}
                  {payMethod === 'card' && (
                    <div>
                      {/* Physical Card Preview */}
                      <div className="neon-credit-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div className="card-chip"></div>
                          <div className="card-type-logo">
                            {cardNumber.startsWith('4') ? 'Visa' : cardNumber.startsWith('5') ? 'Mastercard' : 'PayWay'}
                          </div>
                        </div>
                        <div className="card-number-display">
                          {cardNumber ? formatCardNumber(cardNumber) : '•••• •••• •••• ••••'}
                        </div>
                        <div className="card-details-row">
                          <div>
                            <div className="card-holder-label">Card Holder</div>
                            <div className="card-holder-value">{cardHolder ? cardHolder : 'YOUR FULL NAME'}</div>
                          </div>
                          <div>
                            <div className="card-expiry-label">Expires</div>
                            <div className="card-expiry-value">{cardExpiry ? cardExpiry : 'MM/YY'}</div>
                          </div>
                        </div>
                      </div>

                      {cardError && (
                        <div style={{ color: 'var(--color-secondary)', background: 'rgba(255, 0, 127, 0.1)', border: '1px solid rgba(255, 0, 127, 0.3)', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '15px' }}>
                          {cardError}
                        </div>
                      )}

                      <form onSubmit={handleCardSubmit}>
                        <div className="steam-input-group">
                          <label>Cardholder Name</label>
                          <div className="steam-input-wrapper">
                            <span className="steam-input-icon"><User size={16} /></span>
                            <input 
                              type="text" 
                              value={cardHolder} 
                              onChange={e => setCardHolder(e.target.value.toUpperCase())}
                              required 
                              disabled={cardSubmitted}
                              placeholder="e.g. SOK KANHA"
                            />
                          </div>
                        </div>

                        <div className="steam-input-group">
                          <label>Card Number</label>
                          <div className="steam-input-wrapper">
                            <span className="steam-input-icon"><CreditCard size={16} /></span>
                            <input 
                              type="text" 
                              maxLength="19"
                              value={cardNumber} 
                              onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                              required 
                              disabled={cardSubmitted}
                              placeholder="4111 2222 3333 4444"
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                          <div className="steam-input-group">
                            <label>Expiry Date</label>
                            <div className="steam-input-wrapper input-without-icon">
                              <input 
                                type="text" 
                                maxLength="5"
                                value={cardExpiry} 
                                onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                                required 
                                disabled={cardSubmitted}
                                placeholder="MM/YY"
                              />
                            </div>
                          </div>

                          <div className="steam-input-group">
                            <label>CVV / CVC</label>
                            <div className="steam-input-wrapper input-without-icon">
                              <input 
                                type="password" 
                                maxLength="3"
                                value={cardCvv} 
                                onChange={e => setCardCvv(e.target.value.replace(/[^0-9]/g, ''))}
                                required 
                                disabled={cardSubmitted}
                                placeholder="123"
                              />
                            </div>
                          </div>
                        </div>

                        <button 
                          type="submit" 
                          className="steam-neon-btn steam-neon-btn-primary" 
                          style={{ marginTop: '10px' }}
                          disabled={cardSubmitted}
                        >
                          {cardSubmitted ? (
                            <>
                              <span className="pulse-loader"></span> Securely Authenticating...
                            </>
                          ) : (
                            <>Confirm & Pay {formatCurrency(parseFloat(amount), currency)}</>
                          )}
                        </button>
                      </form>
                    </div>
                  )}

                  <button 
                    className="steam-neon-btn steam-neon-btn-secondary" 
                    style={{ marginTop: '15px' }}
                    onClick={() => {
                      setCheckoutStep(2);
                      setTransactionMd5('');
                    }}
                    disabled={cardSubmitted}
                  >
                    <ChevronLeft size={16} /> Cancel Payment
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Achievement success unlocked banner */
            <div style={{ textAlign: 'center' }}>
              <div className="steam-achievement-unlocked-banner">
                <div className="achievement-icon-wrapper">
                  <div className="achievement-icon">
                    <Trophy style={{ color: '#ffd700' }} size={32} />
                  </div>
                </div>
                <div className="achievement-details">
                  <div className="achievement-header">Achievement Unlocked</div>
                  <div className="achievement-name">Generous Patron</div>
                  <div className="achievement-desc">
                    {successDetails.name} sent {formatCurrency(successDetails.amount, successDetails.currency)} to {streamerName}!
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                  Your tip has been credited to their account. The overlay alert and TTS voice will trigger live on stream!
                </p>
                <button 
                  className="steam-neon-btn steam-neon-btn-secondary" 
                  style={{ maxWidth: '280px' }}
                  onClick={() => setSuccess(false)}
                >
                  Send Another Tip
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Streamer Info Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="steam-neon-card">
            <div className="streamer-badge-profile">
              <div className="streamer-avatar">
                <div className="streamer-avatar-img">
                  {streamerName ? streamerName.charAt(0).toUpperCase() : 'G'}
                </div>
              </div>
              <div className="streamer-name">{streamerName}</div>
              <div className="streamer-subtext">Verified KheangAlert Streamer</div>
            </div>

            {streamerInfo?.goal?.active ? (
              <div className="steam-level-container">
                <div className="steam-level-header">
                  <span className="steam-level-label">STREAM LEVEL GOAL</span>
                  <span className="steam-level-value">
                    {Math.round((streamerInfo.goal.current / streamerInfo.goal.target) * 100)}%
                  </span>
                </div>
                <div className="steam-level-progress-bg">
                  <div 
                    className="steam-level-progress-fill" 
                    style={{ width: `${Math.min(100, (streamerInfo.goal.current / streamerInfo.goal.target) * 100)}%` }}
                  ></div>
                  <div className="goal-percent">
                    XP {streamerInfo.goal.title}
                  </div>
                </div>
                <div className="steam-level-stats">
                  <span>Raised: {formatCurrency(streamerInfo.goal.current)}</span>
                  <span>Goal: {formatCurrency(streamerInfo.goal.target)}</span>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '15px 0' }}>
                No active Level XP goals for this streamer.
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', fontSize: '12px', borderTop: '1px solid rgba(42, 71, 94, 0.4)', paddingTop: '15px', justifyContent: 'center' }}>
              <ShieldCheck size={14} style={{ color: 'var(--color-success)' }} />
              <span>Secure PayWay tunnel connection.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Developer Contact Footer */}
      <footer style={{ marginTop: 'auto', textAlign: 'center', padding: '24px', fontSize: '12px', color: 'var(--color-text-muted)', borderTop: '1px solid rgba(255,255,255,0.03)', background: '#090a0f' }}>
        <a href="https://t.me/KheangNubb" target="_blank" rel="noopener noreferrer"
          style={{ color: '#29b6f6', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: '500' }}>
          ✈️ Contact Developer on Telegram
        </a>
        <span style={{ margin: '0 8px', opacity: 0.3 }}>·</span>
        <span>Powered by StreamNeon PayWay Gateway</span>
      </footer>
    </div>
  );
}
