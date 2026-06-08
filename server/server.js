require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
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

// Helper function to read DB
function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      // Return default template if db.json is missing
      return { settings: {}, goal: {}, donations: [], followers: [] };
    }
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return { settings: {}, goal: {}, donations: [], followers: [] };
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

// Broadcast message to all connected WebSocket clients
function broadcast(message) {
  const payload = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// Compute statistics and metadata
function computeState() {
  const db = readDB();
  
  // Calculate top donation (normalize to USD for comparison)
  let topDonation = null;
  if (db.donations && db.donations.length > 0) {
    topDonation = db.donations.reduce((max, d) => {
      const dUsd = d.currency === 'KHR' ? d.amount / 4000 : d.amount;
      const maxUsd = max.currency === 'KHR' ? max.amount / 4000 : max.amount;
      return dUsd > maxUsd ? d : max;
    }, db.donations[0]);
  }

  // Calculate latest donation
  let latestDonation = null;
  if (db.donations && db.donations.length > 0) {
    latestDonation = db.donations[db.donations.length - 1];
  }

  // Calculate latest follower
  let latestFollower = null;
  if (db.followers && db.followers.length > 0) {
    latestFollower = db.followers[db.followers.length - 1];
  }

  // Calculate total donations amount (normalize KHR to USD at 1:4000)
  const totalDonations = db.donations ? db.donations.reduce((sum, d) => {
    const amt = parseFloat(d.amount);
    const usdVal = d.currency === 'KHR' ? amt / 4000 : amt;
    return sum + usdVal;
  }, 0) : 0;

  return {
    settings: db.settings,
    goal: db.goal,
    donations: db.donations || [],
    followers: db.followers || [],
    stats: {
      totalDonations,
      topDonation,
      latestDonation,
      latestFollower
    }
  };
}

// WebSocket Connection handler
wss.on('connection', (ws) => {
  console.log('Overlay or Dashboard connected to WebSockets');
  
  // Send current state on connection
  ws.send(JSON.stringify({
    type: 'INIT_STATE',
    data: computeState()
  }));

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// REST APIs
// Get full state
app.get('/api/state', (req, res) => {
  res.json(computeState());
});

// Update Settings
app.put('/api/settings', (req, res) => {
  const db = readDB();
  db.settings = { ...db.settings, ...req.body };
  writeDB(db);
  
  const state = computeState();
  broadcast({ type: 'STATE_UPDATE', data: state });
  res.json({ success: true, settings: db.settings });
});

// Test Bakong Credentials and Connection
app.post('/api/settings/test-bakong', async (req, res) => {
  const { bakongAccountId, bakongToken } = req.body;
  if (!bakongAccountId || !bakongToken) {
    return res.status(400).json({ error: 'Account ID and Token are required for testing' });
  }

  try {
    // Generate a quick test IndividualInfo structure
    const individualInfo = new IndividualInfo(
      bakongAccountId,
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
          "Authorization": `Bearer ${bakongToken}`,
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
      // 200 means success connection and authentication (e.g. token is valid)
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
app.put('/api/goal', (req, res) => {
  const db = readDB();
  db.goal = { ...db.goal, ...req.body };
  writeDB(db);
  
  const state = computeState();
  broadcast({ type: 'STATE_UPDATE', data: state });
  res.json({ success: true, goal: db.goal });
});

// Helper function to query NBC Bakong Open API
function checkTransactionOnBakong(md5Hash) {
  return new Promise((resolve, reject) => {
    const db = readDB();
    const token = db.settings?.bakongToken || process.env.KHQR_TOKEN;
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

// Initiate Donation - Generates KHQR and caches pending details
app.post('/api/donate/initiate', async (req, res) => {
  const { name, amount, message, currency } = req.body;
  const reqCurrency = (currency || 'USD').toUpperCase();
  const numericAmount = parseFloat(amount);

  if (!name || isNaN(numericAmount)) {
    return res.status(400).json({ error: 'Invalid name or amount' });
  }

  // Enforce correct minimum limits (100 KHR / 0.01 USD)
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
  const account = db.settings?.bakongAccountId || process.env.ACCOUNT;
  if (!account) {
    return res.status(500).json({ error: 'Server misconfiguration: ACCOUNT settings or env var is missing' });
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

    // Convert string to base64 QR code image DataURL
    const qrDataUrl = await QRCode.toDataURL(qrString);

    // Cache pending donation details
    pendingDonations[md5] = {
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
    const checkResponse = await checkTransactionOnBakong(md5);
    
    if (checkResponse && checkResponse.responseCode === 0) {
      // Transaction is paid successfully!
      const db = readDB();
      
      const usdAmount = pending.currency === 'KHR' ? parseFloat((pending.amount / 4000).toFixed(2)) : pending.amount;

      const newDonation = {
        id: uuidv4(),
        name: pending.name,
        amount: pending.amount,
        currency: pending.currency,
        message: pending.message,
        timestamp: new Date().toISOString()
      };

      db.donations.push(newDonation);
      
      // Automatically increment active goal progress
      if (db.goal && db.goal.active) {
        db.goal.current = parseFloat((db.goal.current + usdAmount).toFixed(2));
      }

      writeDB(db);
      const state = computeState();

      // Send real-time event to overlays
      broadcast({
        type: 'ALERT',
        event: 'donation',
        data: {
          name: newDonation.name,
          amount: newDonation.amount,
          currency: newDonation.currency,
          message: newDonation.message,
          timestamp: newDonation.timestamp,
          settings: db.settings
        }
      });

      // Also broadcast general state update
      broadcast({ type: 'STATE_UPDATE', data: state });

      // Remove from cache
      delete pendingDonations[md5];

      return res.json({
        success: true,
        status: 'paid',
        donation: newDonation
      });
    } else if (checkResponse && checkResponse.responseCode === 1 && checkResponse.errorCode === 1) {
      // Still pending / not found
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

// Submit/Add Donation
app.post('/api/donate', (req, res) => {
  const { name, amount, message } = req.body;
  if (!name || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Invalid name or amount' });
  }

  const numericAmount = parseFloat(amount);
  const db = readDB();
  
  const newDonation = {
    id: uuidv4(),
    name: name.trim(),
    amount: numericAmount,
    message: (message || '').trim(),
    timestamp: new Date().toISOString()
  };

  db.donations.push(newDonation);
  
  // Automatically increment active goal progress
  if (db.goal && db.goal.active) {
    db.goal.current = parseFloat((db.goal.current + numericAmount).toFixed(2));
  }

  writeDB(db);
  const state = computeState();

  // Send real-time event to overlays
  broadcast({
    type: 'ALERT',
    event: 'donation',
    data: {
      name: newDonation.name,
      amount: newDonation.amount,
      message: newDonation.message,
      timestamp: newDonation.timestamp,
      settings: db.settings
    }
  });

  // Also broadcast general state update (goal, tickers, lists)
  broadcast({ type: 'STATE_UPDATE', data: state });

  res.json({ success: true, donation: newDonation });
});

// Submit/Add Follower
app.post('/api/follow', (req, res) => {
  const { name } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required' });
  }

  const db = readDB();
  const newFollower = {
    id: uuidv4(),
    name: name.trim(),
    timestamp: new Date().toISOString()
  };

  db.followers.push(newFollower);
  writeDB(db);

  const state = computeState();

  // Trigger WebSocket follow alert
  broadcast({
    type: 'ALERT',
    event: 'follow',
    data: {
      name: newFollower.name,
      timestamp: newFollower.timestamp,
      settings: db.settings
    }
  });

  // Broadcast state update
  broadcast({ type: 'STATE_UPDATE', data: state });

  res.json({ success: true, follower: newFollower });
});

// Test/Simulate Alert (doesn't save to JSON file)
app.post('/api/test-alert', (req, res) => {
  const { event, name, amount, message } = req.body;
  const db = readDB();
  
  const payload = {
    type: 'ALERT',
    event: event || 'donation',
    data: {
      name: name || 'Test User',
      amount: event === 'follow' ? undefined : (amount || 10.0),
      message: event === 'follow' ? undefined : (message || 'This is a test donation message!'),
      timestamp: new Date().toISOString(),
      settings: db.settings
    }
  };

  broadcast(payload);
  res.json({ success: true, msg: 'Test alert sent' });
});

// Reset Goal Progress
app.post('/api/goal/reset', (req, res) => {
  const db = readDB();
  if (db.goal) {
    db.goal.current = 0;
  }
  writeDB(db);
  const state = computeState();
  broadcast({ type: 'STATE_UPDATE', data: state });
  res.json({ success: true, goal: db.goal });
});

// Serve frontend client static files from React build directory
const clientBuildPath = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  // SPA routing fallback
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  // Mock API fallback home for dev
  app.get('/', (req, res) => {
    res.send('Streaming Alert Server is running. Frontend build not found. Run Vite dev server.');
  });
}

// Start Server
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
