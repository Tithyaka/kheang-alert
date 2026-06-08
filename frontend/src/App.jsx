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
  UserPlus,
  LogIn
} from 'lucide-react';

// --- CONFIG & UTILS ---
const API_BASE = ''; // Proxied in dev, relative in prod
const WS_URL = import.meta.env.DEV 
  ? 'ws://localhost:5000' 
  : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;

// Helper to format currency (USD / KHR support)
const formatCurrency = (val, currency = 'USD') => {
  const cleanCurrency = (currency || 'USD').toUpperCase();
  if (cleanCurrency === 'KHR') {
    return new Intl.NumberFormat('km-KH', { style: 'currency', currency: 'KHR', minimumFractionDigits: 0 }).format(val || 0);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);
};

// --- AUTH PAGES ---
function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (localStorage.getItem('username')) {
      navigate('/');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('username', data.username);
        navigate('/');
      } else {
        setErrorMsg(data.error || 'Invalid username or password');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to connect to authentication server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#090a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="donation-form-container" style={{ maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', color: '#fff', fontSize: '28px', textTransform: 'uppercase', marginBottom: '8px' }}>
            KHEANG<span>ALERT</span> Login
          </h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>Sign in to manage your streaming overlays & widgets</p>
        </div>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
              placeholder="Enter your username"
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
              disabled={loading}
            />
          </div>
          {errorMsg && (
            <div style={{ color: 'var(--color-secondary)', fontSize: '13px', margin: '10px 0', fontWeight: 'bold' }}>
              {errorMsg}
            </div>
          )}
          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: '15px', marginTop: '10px' }} disabled={loading}>
            <LogIn size={18} /> {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Sign Up</Link>
        </div>
      </div>
    </div>
  );
}

function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('username', data.username);
        alert('Account created successfully! Default password is ' + password);
        navigate('/');
      } else {
        setErrorMsg(data.error || 'Username may be taken or invalid');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to connect to authentication server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#090a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="donation-form-container" style={{ maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', color: '#fff', fontSize: '28px', textTransform: 'uppercase', marginBottom: '8px' }}>
            Join KHEANG<span>ALERT</span>
          </h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>Create an account to configure your personal Bakong KHQR</p>
        </div>
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
              placeholder="Choose a username (e.g. streamer1)"
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              placeholder="Create password"
              disabled={loading}
            />
          </div>
          {errorMsg && (
            <div style={{ color: 'var(--color-secondary)', fontSize: '13px', margin: '10px 0', fontWeight: 'bold' }}>
              {errorMsg}
            </div>
          )}
          <button type="submit" className="btn-accent" style={{ width: '100%', padding: '12px', fontSize: '15px', marginTop: '10px' }} disabled={loading}>
            <UserPlus size={18} /> {loading ? 'Registering...' : 'Create Account'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Log In</Link>
        </div>
      </div>
    </div>
  );
}

// --- MAIN APP ROUTING ---
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
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

  const loggedInUser = localStorage.getItem('username');

  const fetchState = async () => {
    if (!loggedInUser) {
      navigate('/login');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/state`, {
        headers: { 'X-Username': loggedInUser }
      });
      if (res.status === 401) {
        localStorage.removeItem('username');
        navigate('/login');
        return;
      }
      const data = await res.json();
      setState(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching state:', err);
    }
  };

  useEffect(() => {
    if (!loggedInUser) {
      navigate('/login');
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
    navigate('/login');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#090a0f', color: '#00f0ff', fontFamily: 'Rajdhani', fontSize: '24px' }}>
        LOADING KHEANG ALERT...
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
    // settings root mapping for user credentials
    setBakongAccountId(state.settings?.bakongAccountId || '');
    setBakongToken(state.settings?.bakongToken || '');
    setBakongEnv(state.settings?.bakongEnv || 'production');
    
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
          bakongEnv: bakongEnv
        })
      });
      refresh();
      alert('Bakong KHQR credentials updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Error saving Bakong settings');
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
          try {
            const testPayload = JSON.stringify({ md5: "1234567890abcdef1234567890abcdef" });
            const browserUrl = bakongEnv === 'sandbox' 
              ? "https://sit-api-bakong.nbc.gov.kh/v1/check_transaction_by_md5"
              : "https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5";
            const browserRes = await fetch(browserUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${bakongToken.replace(/\s+/g, '')}`,
                'Content-Type': 'application/json'
              },
              body: testPayload
            });
            const browserData = await browserRes.json();
            if (browserRes.ok && browserData && (browserData.responseCode === 0 || browserData.responseCode === 1)) {
              setTestResult({ 
                success: true, 
                message: 'Connection successful (verified via browser fallback)! Credentials are valid.' 
              });
            } else {
              setTestResult({ 
                success: false, 
                message: `Verification via browser fallback failed: ${browserData?.responseMessage || 'Invalid API Token.'}` 
              });
            }
          } catch (browserErr) {
            console.error("Browser verification error:", browserErr);
            setTestResult({ 
              success: true, 
              message: 'Server is geo-blocked. Token could not be checked from browser due to network error, but settings were saved.' 
            });
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
          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={updating}>
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

      {/* Bakong KHQR Settings */}
      <form onSubmit={saveBakongSettings} className="card">
        <h3 className="card-title"><Coins size={20} /> Bakong KHQR Settings & Live Testing</h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
          Configure your personal Bakong credentials. These values are used to generate your payment QR codes.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '20px', marginBottom: '20px' }}>
          <div className="form-group">
            <label>Bakong Account ID</label>
            <input 
              type="text" 
              value={bakongAccountId} 
              onChange={e => setBakongAccountId(e.target.value)} 
              placeholder="e.g. name@bank_code"
              required
            />
          </div>
          <div className="form-group">
            <label>Bakong API Env</label>
            <select 
              value={bakongEnv} 
              onChange={e => setBakongEnv(e.target.value)}
              style={{ height: '42px' }}
            >
              <option value="production">Production (Live)</option>
              <option value="sandbox">Sandbox (Testing)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Bakong Open API Access Token (JWT Bearer)</label>
            <textarea 
              rows="2"
              value={bakongToken} 
              onChange={e => setBakongToken(e.target.value)} 
              placeholder="eyJhbGciOiJIUzI1Ni..."
              style={{ fontSize: '12px', fontFamily: 'monospace', height: '42px', minHeight: '42px' }}
              required
            />
          </div>
        </div>

        {testResult && (
          <div style={{ 
            background: testResult.success ? 'rgba(57, 255, 20, 0.08)' : 'rgba(230, 57, 70, 0.08)', 
            border: `1px solid ${testResult.success ? 'var(--color-success)' : 'var(--color-secondary)'}`, 
            color: testResult.success ? 'var(--color-success)' : '#fff', 
            padding: '14px', 
            borderRadius: '8px', 
            marginBottom: '20px', 
            fontSize: '14px'
          }}>
            <strong>Connection Status:</strong> {testResult.message}
          </div>
        )}

        <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
          <button type="submit" className="btn-accent" disabled={updating}>
            Save Credentials
          </button>
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={testBakongConnection} 
            disabled={testingStatus === 'testing' || !bakongAccountId || !bakongToken}
          >
            {testingStatus === 'testing' ? 'Testing Connection...' : 'Test Connection to NBC API'}
          </button>
        </div>
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
        audio.play().catch(e => console.error("Error playing audio:", e));
      }

      setTimeout(() => {
        setActiveAlert(null);
        setTimeout(playNext, 500);
      }, nextAlert.settings?.alertDuration || 7000);
    };

    return () => ws.close();
  }, []);

  if (!activeAlert) return <div className="overlay-container"></div>;

  return (
    <div className="overlay-container">
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
  const [qrCodeOpen, setQrCodeOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrString, setQrString] = useState('');
  const [transactionMd5, setTransactionMd5] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes validity
  const [errorText, setErrorText] = useState('');

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

  // Polling loop for payment confirmation and countdown timer
  useEffect(() => {
    if (!qrCodeOpen || !transactionMd5) return;

    let pollInterval;
    let timerInterval;

    let clientVerifyToken = null;
    let clientVerifyUrl = null;

    pollInterval = setInterval(async () => {
      try {
        if (clientVerifyToken && clientVerifyUrl) {
          const payload = JSON.stringify({ md5: transactionMd5 });
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
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ md5: transactionMd5 })
              });
              const confirmData = await confirmRes.json();
              if (confirmRes.ok && confirmData.success) {
                setSuccess(true);
                setQrCodeOpen(false);
                setTransactionMd5('');
                setQrDataUrl('');
                setQrString('');
                setName('');
                setAmount('');
                setMessage('');
              }
            } else if (clientData && clientData.responseCode === 1 && clientData.errorCode === 1) {
              // Still pending
            } else {
              setErrorText(clientData?.responseMessage || 'Payment processing failed.');
              setQrCodeOpen(false);
              setTransactionMd5('');
            }
          }
        } else {
          const response = await fetch(`/api/donate/check/${transactionMd5}`);
          const data = await response.json();
          
          if (response.ok && data.success) {
            if (data.status === 'paid') {
              setSuccess(true);
              setQrCodeOpen(false);
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
              setQrCodeOpen(false);
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
          setQrCodeOpen(false);
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
  }, [qrCodeOpen, transactionMd5]);

  const handleSearchStreamer = (e) => {
    e.preventDefault();
    if (streamerInput.trim()) {
      window.location.search = `?user=${encodeURIComponent(streamerInput.trim().toLowerCase())}`;
    }
  };

  const handleSubmit = async (e) => {
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
    
    setLoading(true);
    setErrorText('');
    try {
      const response = await fetch('/api/donate/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          amount: numericAmount,
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
        setTimeLeft(300); // Reset timer
        setQrCodeOpen(true);
      } else {
        alert(data.error || 'Failed to generate payment QR code.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // View: If no user selected
  if (!streamerName) {
    return (
      <div style={{ background: '#090a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="donation-form-container" style={{ maxWidth: '450px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', color: '#fff', fontSize: '28px', textTransform: 'uppercase', marginBottom: '8px' }}>Support A Streamer</h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>Enter the username of the streamer you wish to support</p>
          </div>
          <form onSubmit={handleSearchStreamer}>
            <div className="form-group">
              <label>Streamer Username</label>
              <input 
                type="text" 
                value={streamerInput} 
                onChange={e => setStreamerInput(e.target.value)} 
                required 
                placeholder="e.g. kheang"
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: '15px', marginTop: '10px' }}>
              Find Streamer Page
            </button>
          </form>
        </div>
      </div>
    );
  }

  // View: Streamer Loading
  if (loadingStreamer) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#090a0f', color: '#00f0ff', fontFamily: 'Rajdhani', fontSize: '24px' }}>
        RETRIEVING STREAMER INFO...
      </div>
    );
  }

  // View: Streamer Not Found
  if (streamerNotFound) {
    return (
      <div style={{ background: '#090a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="donation-form-container" style={{ textAlign: 'center', maxWidth: '450px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-secondary)', fontSize: '28px', marginBottom: '15px' }}>STREAMER NOT FOUND</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '30px' }}>The user account <strong>"{streamerName}"</strong> does not exist or has not been configured yet.</p>
          <button className="btn-secondary" style={{ width: '100%' }} onClick={() => setStreamerName('')}>Try Another Username</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#090a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      {!success ? (
        <div className="donation-form-container">
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', color: '#fff', fontSize: '28px', textTransform: 'uppercase', marginBottom: '8px' }}>
              Support <span style={{ color: 'var(--color-primary)' }}>{streamerName}</span>
            </h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>Send a tip and shoutout directly to their stream overlay!</p>
          </div>
          
          {streamerInfo?.goal?.active && (
            <div style={{ background: '#171923', padding: '14px', borderRadius: '8px', border: '1px solid var(--color-border)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                <span style={{ fontWeight: 'bold' }}>Goal: {streamerInfo.goal.title}</span>
                <span style={{ color: 'var(--color-primary)' }}>{Math.round((streamerInfo.goal.current / streamerInfo.goal.target) * 100)}%</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(100, (streamerInfo.goal.current / streamerInfo.goal.target) * 100)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))'
                }}></div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Your Name / Alias</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                placeholder="Enter your nickname"
                disabled={loading}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Currency</label>
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
                  disabled={loading}
                  style={{ background: '#171923', height: '46px' }}
                >
                  <option value="USD">USD ($)</option>
                  <option value="KHR">KHR (៛)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Donation Amount</label>
                <input 
                  type="number" 
                  min={currency === 'KHR' ? '100' : '0.01'} 
                  step={currency === 'KHR' ? '100' : '0.01'}
                  value={amount} 
                  onChange={e => setAmount(e.target.value)} 
                  required 
                  placeholder={currency === 'KHR' ? 'Amount (e.g. 4000)' : 'Amount (e.g. 5.00)'}
                  disabled={loading}
                  style={{ height: '46px' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Your Message (will appear on stream!)</label>
              <textarea 
                rows="4" 
                value={message} 
                onChange={e => setMessage(e.target.value)} 
                placeholder="Add a message to your donation..."
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '16px', marginTop: '10px' }} disabled={loading}>
              <Coins size={18} /> {loading ? 'Generating QR Code...' : 'Support Streamer'}
            </button>
          </form>
        </div>
      ) : (
        <div className="donation-form-container" style={{ textAlign: 'center' }}>
          <div className="success-checkmark">✓</div>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-success)', fontSize: '28px', margin: '20px 0 10px' }}>Thank You!</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '30px' }}>Your donation has been sent to {streamerName} and will appear live on stream momentarily!</p>
          <button className="btn-secondary" onClick={() => setSuccess(false)}>Send Another Tip</button>
        </div>
      )}

      {/* QR Code Modal for Real Payment */}
      {qrCodeOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '420px', padding: '30px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', color: '#fff', fontSize: '22px', margin: '0 0 10px', textAlign: 'center' }}>
              Scan to Pay with ABA, Acleda, Bakong & more
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', textAlign: 'center', marginBottom: '16px' }}>
              Scan the QR code using ABA Mobile, Acleda Mobile, Bakong, or any banking app in Cambodia that supports KHQR to complete your donation to {streamerName}.
            </p>
            
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '20px' }}>
              {/* Bakong deep link: opens bakong app directly */}
              {qrString && (
                <a
                  href={`https://api-bakong.nbc.gov.kh/v1/generate_deeplink_by_qr?qr=${encodeURIComponent(qrString)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: '#E21836',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 10px rgba(226,24,54,0.4)',
                    transition: 'opacity 0.2s'
                  }}
                >
                  📱 Open in Bakong
                </a>
              )}
              {/* ABA deep link: opens ABA Mobile with KHQR pre-filled */}
              {qrString && (
                <a
                  href={`https://pay.ababank.com/khqr/${encodeURIComponent(qrString)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: '#005C8A',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 10px rgba(0,92,138,0.4)',
                    transition: 'opacity 0.2s'
                  }}
                >
                  💳 Open in ABA
                </a>
              )}
              <span style={{ 
                background: '#0B3B60', 
                color: '#fff', 
                border: '1px solid #e5a93b',
                padding: '8px 16px', 
                borderRadius: '8px', 
                fontSize: '13px', 
                fontWeight: 'bold',
                opacity: 0.7
              }}>Acleda ✓</span>
            </div>
            
            <div className="qr-code-img" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', padding: '15px', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.5)', border: '2px solid var(--color-primary)' }}>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="KHQR Payment Code" style={{ width: '200px', height: '200px', objectFit: 'contain' }} />
              ) : (
                <div style={{ width: '200px', height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#090a0f' }}>
                  Loading QR Code...
                </div>
              )}
              <div style={{ marginTop: '12px', fontSize: '18px', fontWeight: 'bold', color: '#090a0f', fontFamily: 'monospace' }}>
                Amount: {formatCurrency(parseFloat(amount), currency)}
              </div>
            </div>
            
            <p style={{ color: 'var(--color-primary)', fontSize: '14px', fontWeight: 'bold', margin: '20px 0 5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="pulse-loader"></span> Waiting for payment...
            </p>
            
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '20px', marginTop: '5px' }}>
              QR code expires in <span style={{ color: '#fff', fontWeight: 'bold', fontFamily: 'monospace' }}>{formatTime(timeLeft)}</span>
            </div>
            
            {errorText && (
              <div style={{ color: 'var(--color-danger)', fontSize: '13px', marginTop: '10px', fontWeight: 'bold' }}>
                {errorText}
              </div>
            )}
            
            <button className="btn-secondary" style={{ marginTop: '20px', width: '100%', borderColor: 'rgba(255,255,255,0.1)' }} onClick={() => setQrCodeOpen(false)}>
              Cancel Payment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
