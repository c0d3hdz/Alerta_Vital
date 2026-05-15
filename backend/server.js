const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/users', async (req, res) => {
  const { google_id, name, email, picture } = req.body;
  if (!google_id || !name) return res.status(400).json({ error: 'google_id and name required' });

  try {
    const [rows] = await pool.query(
      'SELECT id FROM users WHERE google_id = ? LIMIT 1',
      [google_id]
    );

    if (rows.length > 0) {
      const userId = rows[0].id;
      await pool.query(
        'UPDATE users SET name = ?, email = ?, picture = ?, last_login = NOW() WHERE id = ?',
        [name, email || null, picture || null, userId]
      );
      return res.json({ id: userId, google_id, name, email, picture });
    }

    const [result] = await pool.query(
      'INSERT INTO users (google_id, name, email, picture, created_at, last_login) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [google_id, name, email || null, picture || null]
    );

    res.json({ id: result.insertId, google_id, name, email, picture });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/devices', async (req, res) => {
  const { user_id, device_id, name, type, is_simulated } = req.body;
  if (!user_id || !device_id || !name) return res.status(400).json({ error: 'user_id, device_id and name required' });

  try {
    const [rows] = await pool.query(
      'SELECT id FROM devices WHERE device_id = ? AND user_id = ? LIMIT 1',
      [device_id, user_id]
    );

    if (rows.length > 0) {
      const deviceId = rows[0].id;
      await pool.query(
        'UPDATE devices SET name = ?, type = ?, is_simulated = ?, last_connected = NOW() WHERE id = ?',
        [name, type || 'unknown', is_simulated ? 1 : 0, deviceId]
      );
      return res.json({ id: deviceId, user_id, device_id, name, type, is_simulated });
    }

    const [result] = await pool.query(
      'INSERT INTO devices (user_id, device_id, name, type, is_simulated, last_connected) VALUES (?, ?, ?, ?, ?, NOW())',
      [user_id, device_id, name, type || 'unknown', is_simulated ? 1 : 0]
    );

    res.json({ id: result.insertId, user_id, device_id, name, type, is_simulated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/sessions', async (req, res) => {
  const { user_id, device_id, start_ts, end_ts, avg_bpm, avg_spo2, avg_sys } = req.body;
  if (!user_id || !device_id || !start_ts) return res.status(400).json({ error: 'user_id, device_id and start_ts required' });

  try {
    const [result] = await pool.query(
      'INSERT INTO sessions (user_id, device_id, start_ts, end_ts, avg_bpm, avg_spo2, avg_sys) VALUES (?, ?, FROM_UNIXTIME(?), FROM_UNIXTIME(?), ?, ?, ?)',
      [user_id, device_id, start_ts, end_ts || null, avg_bpm || null, avg_spo2 || null, avg_sys || null]
    );
    res.json({ id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/readings', async (req, res) => {
  const { session_id, timestamp, bpm, spo2, sys, ecg_value } = req.body;
  if (!session_id || !timestamp) return res.status(400).json({ error: 'session_id and timestamp required' });

  try {
    const [result] = await pool.query(
      'INSERT INTO readings (session_id, timestamp, bpm, spo2, sys, ecg_value) VALUES (?, FROM_UNIXTIME(?), ?, ?, ?, ?)',
      [session_id, timestamp, bpm || null, spo2 || null, sys || null, ecg_value || null]
    );
    res.json({ id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/alerts', async (req, res) => {
  const { session_id, user_id, type, message, start_ts, end_ts, avg_bpm, duration_sec, preview_data } = req.body;
  if (!user_id || !type || !message || !start_ts) return res.status(400).json({ error: 'user_id, type, message and start_ts required' });

  try {
    const [result] = await pool.query(
      'INSERT INTO alerts (session_id, user_id, type, message, start_ts, end_ts, avg_bpm, duration_sec, preview_data, created_at) VALUES (?, ?, ?, ?, FROM_UNIXTIME(?), FROM_UNIXTIME(?), ?, ?, ?, NOW())',
      [session_id || null, user_id, type, message, start_ts, end_ts || null, avg_bpm || null, duration_sec || null, JSON.stringify(preview_data || [])]
    );
    res.json({ id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/alerts', async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });

  try {
    const [rows] = await pool.query(
      'SELECT * FROM alerts WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [user_id]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend started on http://localhost:${PORT}`);
});
