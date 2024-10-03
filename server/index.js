// server/index.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Pastikan ini sesuai dengan frontend Anda
  optionsSuccessStatus: 200
}));
app.use(express.json());

// Konfigurasi koneksi MySQL dengan decimalNumbers: true
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true
};

// Buat pool koneksi
const pool = mysql.createPool(dbConfig);

// Middleware untuk memverifikasi JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) return res.status(401).json({ message: 'Access Token Required' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid Access Token' });
    req.user = user;
    next();
  });
};

// Rute Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(`Login attempt: Username = ${username}, Password = ${password}`); // Log attempt

  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    console.log(`User found: ${rows.length} users`);
    if (rows.length === 0) {
      console.log('No user found with that username.');
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const user = rows[0];
    console.log(`User retrieved: ${user.username}`);

    // Verifikasi password
    const validPassword = await bcrypt.compare(password, user.password);
    console.log(`Password valid: ${validPassword}`);

    if (!validPassword) {
      console.log('Invalid password.');
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    // Buat JWT
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
      expiresIn: '1h' // Token berlaku selama 1 jam
    });
    console.log(`JWT Token created: ${token}`);

    res.json({ token });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).send('Server Error');
  }
});

// Endpoint CRUD

// READ - Dapatkan semua menu items (Publik)
app.get('/api/menu', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM menu_items');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).send('Server Error');
  }
});

// GET - Dapatkan satu item menu berdasarkan ID
app.get('/api/menu/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const [rows] = await pool.query('SELECT * FROM menu_items WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json(rows[0]); // Mengirimkan item menu yang ditemukan
  } catch (error) {
    console.error('Error fetching menu item:', error);
    res.status(500).send('Server Error');
  }
});

// CREATE - Tambah menu item baru (Autentikasi)
app.post('/api/menu', authenticateToken, async (req, res) => {
  const { name, price, description, image, category } = req.body;

  // Validasi sederhana
  if (!name || !price || !category) {
    return res.status(400).json({ message: 'Name, price, and category are required.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO menu_items (name, price, description, image, category) VALUES (?, ?, ?, ?, ?)',
      [name, price, description, image, category]
    );
    const newItem = { id: result.insertId, name, price, description, image, category };
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error adding menu item:', error);
    res.status(500).send('Server Error');
  }
});

// UPDATE - Edit menu item berdasarkan ID (Autentikasi)
app.put('/api/menu/:id', authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, price, description, image, category } = req.body;

  // Validasi sederhana
  if (!name || !price || !category) {
    return res.status(400).json({ message: 'Name, price, and category are required.' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE menu_items SET name = ?, price = ?, description = ?, image = ?, category = ? WHERE id = ?',
      [name, price, description, image, category, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    const updatedItem = { id, name, price, description, image, category };
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).send('Server Error');
  }
});

// DELETE - Hapus menu item berdasarkan ID (Autentikasi)
app.delete('/api/menu/:id', authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const [result] = await pool.query('DELETE FROM menu_items WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).send('Server Error');
  }
});

// Mulai server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
