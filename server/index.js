// server/index.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Konfigurasi koneksi MySQL
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

// Endpoint CRUD

// READ - Dapatkan semua menu items
app.get('/api/menu', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM menu_items');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).send('Server Error');
  }
});

// CREATE - Tambah menu item baru
app.post('/api/menu', async (req, res) => {
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

// UPDATE - Edit menu item berdasarkan ID
app.put('/api/menu/:id', async (req, res) => {
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

// DELETE - Hapus menu item berdasarkan ID
app.delete('/api/menu/:id', async (req, res) => {
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
