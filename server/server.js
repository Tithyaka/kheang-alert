require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { BakongKHQR, khqrData, IndividualInfo } = require('bakong-khqr');
const QRCode = require('qrcode');
const https = require('https');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 5000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');

// In-memory cache for pending donations (md5 -> donationDetails)
const pendingDonations = {};

app.use(cors());
app.use(express.json());

// Database Automated Migration
function migrateDB(db) {
  const defaultUserId = uuidv4();
  const defaultUser = {
    id: defaultUserId,
    username: 'kheang',
    // Default password: password123
    password: crypto.createHash('sha256').update('password123').digest('hex'),
    bakongAccountId: db.settings?.bakongAccountId || process.env.ACCOUNT || 'ven_tityaka1@bkrt',
    bakongToken: db.settings?.bakongToken || process.env.KHQR_TOKEN || '',
    settings: {
      alertDuration: db.settings?.alertDuration || 7000,
      soundVolume: db.settings?.soundVolume ?? 0.8,
      followTextTemplate: db.settings?.followTextTemplate || '{name} joined the neon crew!',
      donationTextTemplate: db.settings?.donationTextTemplate || '{name} sent {amount}!',
      gifUrl: db.settings?.gifUrl || 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHlmd3gydzZ2ZWZtcnkyMnQ2ZnQ2b2x2eHA0YWxxMW4xOXV0ZnpxOCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/Wwddh1z09oD2r4kQyU/giphy.gif',
      soundUrl: db.settings?.soundUrl || 'https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav'
    },
    goal: db.goal || {
      title: 'Upgrade Stream Mic',
      target: 500,
      current: 322,
      active: true
    }
  };

  const migrated = {
    users: [defaultUser],
    donations: (db.donations || []).map(d => ({ ...d, userId: defaultUserId })),
    followers: (db.followers || []).map(f => ({ ...f, userId: defaultUserId }))
  };
  return migrated;
}

// Helper function to read DB
function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const defaultData = { users: [], donations: [], followers: [] };
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2), 'utf8');
      return defaultData;
    }
    const data = fs.readFileSync(DB_PATH, 'utf8');
    let db = JSON.parse(data);
    
    // Perform database migration if single-tenant structure is found
    if (!db.users) {
      console.log('Migrating database to multi-user format...');
      db = migrateDB(db);
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
    }
    return db;
  } catch (error) {
    console.error('Error reading database:', error);
    return { users: [], donations: [], followers: [] };
  }
}

// Helper function to write DB
function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing to database:', error);
  }
}

// Broadcast message to all connected WebSocket clients matching the target username
function broadcast(message, username) {
  const payload = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.username === username) {
      client.send(payload);
    }
  });
}

// Compute statistics and metadata scoped by user ID
function computeState(userId) {
  const db = readDB();
  const user = db.users.find(u => u.id === userId || u.username === userId);
  if (!user) {
    return { error: 'User not found' };
  }

  const userDonations = (db.donations || []).filter(d => d.userId === user.id);
  const userFollowers = (db.followers || []).filter(f => f.userId === user.id);
  
  // Calculate top donation (normalize to USD for comparison)
  let topDonation = null;
  if (userDonations.length > 0) {
    topDonation = userDonations.reduce((max, d) => {
      const dUsd = d.currency === 'KHR' ? d.amount / 4000 : d.amount;
      const maxUsd = max.currency === 'KHR' ? max.amount / 4000 : max.amount;
      return dUsd > maxUsd ? d : max;
    }, userDonations[0]);
  }

  // Calculate latest donation
  let latestDonation = null;
  if (userDonations.length > 0) {
    latestDonation = userDonations[userDonations.length - 1];
  }

  // Calculate latest follower
  let latestFollower = null;
  if (userFollowers.length > 0) {
    latestFollower = userFollowers[userFollowers.length - 1];
  }

  // Calculate total donations amount (normalize KHR to USD at 1:4000)
  const totalDonations = userDonations.reduce((sum, d) => {
    const amt = parseFloat(d.amount);
    const usdVal = d.currency === 'KHR' ? amt / 4000 : amt;
    return sum + usdVal;
  }, 0);

  return {
    username: user.username,
    settings: user.settings,
    goal: user.goal,
    donations: userDonations,
    followers: userFollowers,
    stats: {
      totalDonations,
      topDonation,
      latestDonation,
      latestFollower
    }
  };
}

// WebSocket Connection handler
wss.on('connection', (ws, req) => {
  console.log('Overlay or Dashboard connected to WebSockets');
  
  // Extract target username from query string
  const urlParams = new URLSearchParams(req.url.split('?')[1] || '');
  const username = urlParams.get('username');
  ws.username = username;

  if (username) {
    const db = readDB();
    const user = db.users.find(u => u.username === username.toLowerCase());
    if (user) {
      ws.send(JSON.stringify({
        type: 'INIT_STATE',
        data: computeState(user.id)
      }));
    } else {
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: `User ${username} not found`
      }));
    }
  } else {
    ws.send(JSON.stringify({
      type: 'WARNING',
      message: 'No username specified. Connect via ws://host/?username=xxx'
    }));
  }

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// Middleware to authenticate user using X-Username header
function authenticateUser(req, res, next) {
  const username = req.headers['x-username'];
  if (!username) {
    return res.status(401).json({ error: 'Unauthorized: Missing X-Username header' });
  }

  const db = readDB();
  const user = db.users.find(u => u.username === username.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: User not found' });
  }

  req.user = user;
  next();
}

// --- AUTH APIs ---
// Auth: Register
app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password || username.trim() === '' || password.trim() === '') {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const cleanUsername = username.trim().toLowerCase();
  const db = readDB();

  // Check if user already exists
  if (db.users.find(u => u.username === cleanUsername)) {
    return res.status(400).json({ error: 'Username is already taken' });
  }

  const newUserId = uuidv4();
  const newUser = {
    id: newUserId,
    username: cleanUsername,
    password: crypto.createHash('sha256').update(password).digest('hex'),
    bakongAccountId: '',
    bakongToken: '',
    settings: {
      alertDuration: 7000,
      soundVolume: 0.8,
      followTextTemplate: '{name} joined the crew!',
      donationTextTemplate: '{name} sent {amount}!',
      gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHlmd3gydzZ2ZWZtcnkyMnQ2ZnQ2b2x2eHA0YWxxMW4xOXV0ZnpxOCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/Wwddh1z09oD2r4kQyU/giphy.gif',
      soundUrl: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav'
    },
    goal: {
      title: 'Upgrade Mic',
      target: 500,
      current: 0,
      active: true
    }
  };

  db.users.push(newUser);
  writeDB(db);

  res.json({ success: true, username: cleanUsername });
});

// Auth: Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const cleanUsername = username.trim().toLowerCase();
  const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
  const db = readDB();

  const user = db.users.find(u => u.username === cleanUsername && u.password === hashedPassword);
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  res.json({ success: true, username: cleanUsername });
});

// --- REST APIs ---
// Get full state
app.get('/api/state', authenticateUser, (req, res) => {
  res.json(computeState(req.user.id));
});

// Update Settings
app.put('/api/settings', authenticateUser, (req, res) => {
  const db = readDB();
  const userIndex = db.users.findIndex(u => u.id === req.user.id);
  if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

  const settingsUpdate = { ...req.body };
  if (settingsUpdate.bakongAccountId) {
    settingsUpdate.bakongAccountId = settingsUpdate.bakongAccountId.replace(/\s+/g, '');
  }
  if (settingsUpdate.bakongToken) {
    settingsUpdate.bakongToken = settingsUpdate.bakongToken.replace(/\s+/g, '');
  }

  db.users[userIndex].settings = { ...db.users[userIndex].settings, ...settingsUpdate };
  
  if (settingsUpdate.bakongAccountId) {
    db.users[userIndex].bakongAccountId = settingsUpdate.bakongAccountId;
  }
  if (settingsUpdate.bakongToken) {
    db.users[userIndex].bakongToken = settingsUpdate.bakongToken;
  }

  writeDB(db);
  
  const state = computeState(req.user.id);
  broadcast({ type: 'STATE_UPDATE', data: state }, req.user.username);
  res.json({ success: true, settings: db.users[userIndex].settings });
});

// Test Bakong Credentials and Connection
app.post('/api/settings/test-bakong', authenticateUser, async (req, res) => {
  const { bakongAccountId, bakongToken } = req.body;
  if (!bakongAccountId || !bakongToken) {
    return res.status(400).json({ error: 'Account ID and Token are required for testing' });
  }

  const cleanAccountId = bakongAccountId.replace(/\s+/g, '');
  const cleanToken = bakongToken.replace(/\s+/g, '');

  try {
    const individualInfo = new IndividualInfo(
      cleanAccountId,
      "Test Connection",
      "Phnom Penh",
      {
        currency: khqrData.currency.usd,
        amount: 0.01,
        storeLabel: "Test Store",
        terminalLabel: "Test Terminal",
        expirationTimestamp: Date.now() + 60 * 1000
      }
    );

    const khqr = new BakongKHQR();
    const qrResponse = khqr.generateIndividual(individualInfo);

    if (!qrResponse || qrResponse.status.code !== 0 || !qrResponse.data) {
      return res.json({ 
        success: false, 
        step: 'generation', 
        message: qrResponse?.status?.message || 'Failed to generate test KHQR' 
      });
    }

    const md5 = qrResponse.data.md5;

    // Call NBC API to check transaction status to verify token validity
    const payload = JSON.stringify({ md5 });
    const url = new URL("https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5");
    
    const apiCall = () => new Promise((resolve, reject) => {
      const reqApi = https.request({
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: "POST",
        headers: {
          "Authorization": `Bearer ${cleanToken}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload)
        }
      }, (resApi) => {
        let data = "";
        resApi.on("data", (chunk) => { data += chunk; });
        resApi.on("end", () => resolve({ status: resApi.statusCode, body: data }));
      });
      
      reqApi.on("error", (e) => reject(e));
      reqApi.write(payload);
      reqApi.end();
    });

    const apiResult = await apiCall();
    
    if (apiResult.status === 200) {
      return res.json({
        success: true,
        message: 'Bakong API Connection successful! Credentials are verified.'
      });
    } else {
      let errorMsg = 'HTTP ' + apiResult.status;
      try {
        const parsed = JSON.parse(apiResult.body);
        errorMsg += ': ' + (parsed.message || parsed.responseMessage || apiResult.body);
      } catch (e) {}
      
      return res.json({
        success: false,
        step: 'verification',
        message: `NBC API returned error: ${errorMsg}. Please verify your API token.`
      });
    }

  } catch (error) {
    console.error("Test Bakong error:", error);
    res.json({
      success: false,
      step: 'system',
      message: 'System error: ' + error.message
    });
  }
});

// Update Goal Settings
app.put('/api/goal', authenticateUser, (req, res) => {
  const db = readDB();
  const userIndex = db.users.findIndex(u => u.id === req.user.id);
  if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

  db.users[userIndex].goal = { ...db.users[userIndex].goal, ...req.body };
  writeDB(db);
  
  const state = computeState(req.user.id);
  broadcast({ type: 'STATE_UPDATE', data: state }, req.user.username);
  res.json({ success: true, goal: db.users[userIndex].goal });
});

// Reset Goal Progress
app.post('/api/goal/reset', authenticateUser, (req, res) => {
  const db = readDB();
  const userIndex = db.users.findIndex(u => u.id === req.user.id);
  if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

  db.users[userIndex].goal.current = 0;
  writeDB(db);
  
  const state = computeState(req.user.id);
  broadcast({ type: 'STATE_UPDATE', data: state }, req.user.username);
  res.json({ success: true, goal: db.users[userIndex].goal });
});

// Helper function to query NBC Bakong Open API with specific token
function checkTransactionOnBakongWithToken(md5Hash, token) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ md5: md5Hash });
    const url = new URL("https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5");
    
    const req = https.request({
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error("Invalid JSON from Bakong API: " + data));
        }
      });
    });
    
    req.on("error", (e) => { reject(e); });
    req.write(payload);
    req.end();
  });
}

// --- PUBLIC STREAMER INFO API ---
app.get('/api/donate/streamer/:username', (req, res) => {
  const { username } = req.params;
  const db = readDB();
  const user = db.users.find(u => u.username === username.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'Streamer not found' });
  }

  res.json({
    username: user.username,
    settings: {
      gifUrl: user.settings?.gifUrl,
      soundUrl: user.settings?.soundUrl,
      soundVolume: user.settings?.soundVolume,
      donationTextTemplate: user.settings?.donationTextTemplate
    },
    goal: user.goal
  });
});

// Initiate Donation - Generates KHQR and caches pending details
app.post('/api/donate/initiate', async (req, res) => {
  const { name, amount, message, currency, username } = req.body;
  const reqCurrency = (currency || 'USD').toUpperCase();
  const numericAmount = parseFloat(amount);

  if (!username) {
    return res.status(400).json({ error: 'Target streamer username is required' });
  }

  if (!name || isNaN(numericAmount)) {
    return res.status(400).json({ error: 'Invalid name or amount' });
  }

  if (reqCurrency === 'KHR') {
    if (numericAmount < 100) {
      return res.status(400).json({ error: 'Minimum donation in KHR is 100 Riels' });
    }
  } else {
    if (numericAmount < 0.01) {
      return res.status(400).json({ error: 'Minimum donation in USD is $0.01' });
    }
  }

  const db = readDB();
  const user = db.users.find(u => u.username === username.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'Streamer account not found' });
  }

  const account = user.bakongAccountId || process.env.ACCOUNT;
  if (!account) {
    return res.status(500).json({ error: 'Streamer has not configured their Bakong Account ID yet' });
  }

  try {
    const individualInfo = new IndividualInfo(
      account,
      "Streamer Donation",
      "Phnom Penh",
      {
        currency: reqCurrency === 'KHR' ? khqrData.currency.khr : khqrData.currency.usd,
        amount: numericAmount,
        storeLabel: "Kheang Alert",
        terminalLabel: "Overlay",
        expirationTimestamp: Date.now() + 5 * 60 * 1000 // 5 minutes validity
      }
    );

    const khqr = new BakongKHQR();
    const response = khqr.generateIndividual(individualInfo);

    if (!response || response.status.code !== 0 || !response.data) {
      console.error("Bakong KHQR generation error:", response);
      return res.status(500).json({ error: response?.status?.message || 'Failed to generate KHQR code' });
    }

    const qrString = response.data.qr;
    const md5 = response.data.md5;

    const qrDataUrl = await QRCode.toDataURL(qrString);

    pendingDonations[md5] = {
      userId: user.id,
      username: user.username,
      name: name.trim(),
      amount: numericAmount,
      currency: reqCurrency,
      message: (message || '').trim(),
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      md5,
      qrString,
      qrDataUrl
    });

  } catch (error) {
    console.error("Error initiating donation:", error);
    res.status(500).json({ error: 'Failed to initiate donation payment' });
  }
});

// Check/Poll Donation Status
app.get('/api/donate/check/:md5', async (req, res) => {
  const { md5 } = req.params;
  const pending = pendingDonations[md5];

  if (!pending) {
    return res.status(404).json({ error: 'Donation transaction not found or already processed' });
  }

  try {
    const db = readDB();
    const user = db.users.find(u => u.id === pending.userId);
    if (!user) {
      return res.status(404).json({ error: 'Streamer account not found' });
    }

    const rawToken = user.bakongToken || process.env.KHQR_TOKEN;
    const token = (rawToken || '').replace(/\s+/g, '');
    const checkResponse = await checkTransactionOnBakongWithToken(md5, token);
    
    if (checkResponse && checkResponse.responseCode === 0) {
      const usdAmount = pending.currency === 'KHR' ? parseFloat((pending.amount / 4000).toFixed(2)) : pending.amount;

      const newDonation = {
        id: uuidv4(),
        userId: pending.userId,
        name: pending.name,
        amount: pending.amount,
        currency: pending.currency,
        message: pending.message,
        timestamp: new Date().toISOString()
      };

      db.donations.push(newDonation);
      
      const userIndex = db.users.findIndex(u => u.id === pending.userId);
      if (userIndex !== -1 && db.users[userIndex].goal && db.users[userIndex].goal.active) {
        db.users[userIndex].goal.current = parseFloat((db.users[userIndex].goal.current + usdAmount).toFixed(2));
      }

      writeDB(db);
      const state = computeState(pending.userId);

      broadcast({
        type: 'ALERT',
        event: 'donation',
        data: {
          name: newDonation.name,
          amount: newDonation.amount,
          currency: newDonation.currency,
          message: newDonation.message,
          timestamp: newDonation.timestamp,
          settings: user.settings
        }
      }, pending.username);

      broadcast({ type: 'STATE_UPDATE', data: state }, pending.username);

      delete pendingDonations[md5];

      return res.json({
        success: true,
        status: 'paid',
        donation: newDonation
      });
    } else if (checkResponse && checkResponse.responseCode === 1 && checkResponse.errorCode === 1) {
      return res.json({
        success: true,
        status: 'pending'
      });
    } else {
      console.warn("Bakong check_transaction returned unexpected response:", checkResponse);
      return res.json({
        success: false,
        status: 'failed',
        message: checkResponse?.responseMessage || 'Transaction failed or returned error status'
      });
    }

  } catch (error) {
    console.error("Error checking transaction status:", error);
    res.status(500).json({ error: 'Failed to verify transaction status' });
  }
});

// Submit/Add Donation (Override / Simulator)
app.post('/api/donate', authenticateUser, (req, res) => {
  const { name, amount, message } = req.body;
  if (!name || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Invalid name or amount' });
  }

  const numericAmount = parseFloat(amount);
  const db = readDB();
  
  const newDonation = {
    id: uuidv4(),
    userId: req.user.id,
    name: name.trim(),
    amount: numericAmount,
    message: (message || '').trim(),
    timestamp: new Date().toISOString()
  };

  db.donations.push(newDonation);
  
  const userIndex = db.users.findIndex(u => u.id === req.user.id);
  if (userIndex !== -1 && db.users[userIndex].goal && db.users[userIndex].goal.active) {
    db.users[userIndex].goal.current = parseFloat((db.users[userIndex].goal.current + numericAmount).toFixed(2));
  }

  writeDB(db);
  const state = computeState(req.user.id);

  broadcast({
    type: 'ALERT',
    event: 'donation',
    data: {
      name: newDonation.name,
      amount: newDonation.amount,
      message: newDonation.message,
      timestamp: newDonation.timestamp,
      settings: req.user.settings
    }
  }, req.user.username);

  broadcast({ type: 'STATE_UPDATE', data: state }, req.user.username);

  res.json({ success: true, donation: newDonation });
});

// Submit/Add Follower
app.post('/api/follow', authenticateUser, (req, res) => {
  const { name } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required' });
  }

  const db = readDB();
  const newFollower = {
    id: uuidv4(),
    userId: req.user.id,
    name: name.trim(),
    timestamp: new Date().toISOString()
  };

  db.followers.push(newFollower);
  writeDB(db);

  const state = computeState(req.user.id);

  broadcast({
    type: 'ALERT',
    event: 'follow',
    data: {
      name: newFollower.name,
      timestamp: newFollower.timestamp,
      settings: req.user.settings
    }
  }, req.user.username);

  broadcast({ type: 'STATE_UPDATE', data: state }, req.user.username);

  res.json({ success: true, follower: newFollower });
});

// Test/Simulate Alert
app.post('/api/test-alert', authenticateUser, (req, res) => {
  const { event, name, amount, message } = req.body;
  
  const payload = {
    type: 'ALERT',
    event: event || 'donation',
    data: {
      name: name || 'Test User',
      amount: event === 'follow' ? undefined : (amount || 10.0),
      message: event === 'follow' ? undefined : (message || 'This is a test donation message!'),
      timestamp: new Date().toISOString(),
      settings: req.user.settings
    }
  };

  broadcast(payload, req.user.username);
  res.json({ success: true, msg: 'Test alert sent' });
});

// Serve frontend client static files from React build directory
const clientBuildPath = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('Streaming Alert Server is running. Frontend build not found.');
  });
}

// Start Server
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
