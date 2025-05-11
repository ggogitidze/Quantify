const axios = require('axios');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require("fs");


require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


app.use(express.static(path.join(__dirname, '../public'))); 

// DB Setup
const db = new sqlite3.Database('./server/quantportfolio.db', (err) => {
  if (err) return console.error(err.message);
  console.log("Connected to SQLite DB.");
});


db.run(`
    CREATE TABLE IF NOT EXISTS watchlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      ticker TEXT NOT NULL,
      UNIQUE(user_id, ticker),
      FOREIGN KEY(user_id) REFERENCES users(id)
  )
  `);
  

db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT,
  email TEXT,
  password TEXT
)`);




// API routes
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`, 
    [username, email, hashed], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: "User registered." });
    });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err || !user) return res.status(400).json({ error: "Invalid credentials" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// verify JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Access denied" });
  
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ error: "Invalid token" });
      req.userId = user.userId;
      next();
    });
  }
  
  db.run(`CREATE TABLE IF NOT EXISTS portfolio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    ticker TEXT,
    shares REAL,
    buy_price REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  

  // Add portfolio entry
  app.post('/api/portfolio', authenticateToken, (req, res) => {
    const { ticker, shares, buy_price } = req.body;
    const userId = req.userId;
  
    const query = `INSERT INTO portfolio (user_id, ticker, shares, buy_price) VALUES (?, ?, ?, ?)`;
    db.run(query, [userId, ticker, shares, buy_price], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: "Entry added" });
    });
  });
  
  // Get user's portfolio
  app.get('/api/portfolio', authenticateToken, (req, res) => {
    const userId = req.userId;
    db.all(`SELECT * FROM portfolio WHERE user_id = ?`, [userId], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });


app.get('/api/quote/:ticker', async (req, res) => {
  const ticker = req.params.ticker;
  const apiKey = process.env.TWELVE_DATA_API_KEY;

  try {
    const response = await axios.get(`https://api.twelvedata.com/price`, {
      params: {
        symbol: ticker,
        apikey: apiKey,
      },
    });

    const price = parseFloat(response.data.price);

    res.json({
      symbol: ticker,
      price,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch price' });
  }
});

// DELETE portfolio entry
app.delete('/api/portfolio/:id', authenticateToken, (req, res) => {
    const entryId = req.params.id;
    const userId = req.userId;
  
    db.run(`DELETE FROM portfolio WHERE id = ? AND user_id = ?`, [entryId, userId], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Entry deleted' });
    });
  });
  
  // UPDATE portfolio entry
app.put('/api/portfolio/:id', authenticateToken, (req, res) => {
  const entryId = req.params.id;
  const userId = req.userId;
  const { shares, buy_price } = req.body;
  
  db.run(
    `UPDATE portfolio SET shares = ?, buy_price = ? WHERE id = ? AND user_id = ?`,
    [shares, buy_price, entryId, userId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Entry updated' });
    }
  );
});

app.get("/api/performance", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const entries = await db.all(`
      SELECT ticker, shares, buy_price, created_at 
      FROM portfolio 
      WHERE user_id = ?
      ORDER BY created_at ASC
    `, [userId]);

    res.json({ entries });
  } catch (err) {
    console.error("Error fetching performance data:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.get("/api/price/:ticker", authenticateToken, async (req, res) => {
  const ticker = req.params.ticker;
  const apiKey = process.env.TWELVE_DATA_API_KEY;

  try {
    const response = await fetch(`https://api.twelvedata.com/price?symbol=${ticker}&apikey=${apiKey}`);
    const data = await response.json();

    if (data.price) {
      res.json({ price: parseFloat(data.price) });
    } else {
      res.status(400).json({ error: "Price not found" });
    }
  } catch (err) {
    console.error("Price fetch error:", err);
    res.status(500).json({ error: "Failed to fetch price" });
  }
});



app.get('/api/watchlist', authenticateToken, (req, res) => {
  const userId = req.userId;
  db.all(`SELECT ticker FROM watchlist WHERE user_id = ?`, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(r => r.ticker));
  });
});
  
app.post('/api/watchlist', authenticateToken, (req, res) => {
  const userId = req.userId;
  const { ticker } = req.body;
  
  db.run(`INSERT OR IGNORE INTO watchlist (user_id, ticker) VALUES (?, ?)`, [userId, ticker], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Ticker added' });
  });
});
  
app.delete('/api/watchlist/:ticker', authenticateToken, (req, res) => {
  const userId = req.userId;
  const ticker = req.params.ticker;
  
  db.run(`DELETE FROM watchlist WHERE user_id = ? AND ticker = ?`, [userId, ticker], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Ticker removed' });
  });
});

app.put('/api/update-password', authenticateToken, (req, res) => {
  const userId = req.userId;
  const { currentPassword, newPassword } = req.body;

  db.get(`SELECT password FROM users WHERE id = ?`, [userId], async (err, row) => {
    if (err || !row) return res.status(500).json({ error: 'User not found.' });

    const valid = await bcrypt.compare(currentPassword, row.password);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect.' });

    const newHash = await bcrypt.hash(newPassword, 10);
    db.run(`UPDATE users SET password = ? WHERE id = ?`, [newHash, userId], function (err) {
      if (err) return res.status(500).json({ error: 'Failed to update password.' });
      res.json({ message: 'Password updated successfully.' });
    });
  });
});

app.get("/api/settings", authenticateToken, (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Unauthorized" }); 
  }

  const userId = req.user.id;
  db.get("SELECT dark_mode FROM users WHERE id = ?", [userId], (err, row) => {
    if (err) return res.status(500).json({ error: "DB error" });
    res.json({ dark_mode: !!row?.dark_mode });
  });
});

app.put("/api/settings", authenticateToken, (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = req.user.id;
  const { dark_mode } = req.body;

  db.run(
    "UPDATE users SET dark_mode = ? WHERE id = ?",
    [dark_mode ? 1 : 0, userId],
    (err) => {
      if (err) return res.status(500).json({ error: "Failed to update" });
      res.json({ message: "Settings updated" });
    }
  );
});


