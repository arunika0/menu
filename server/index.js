require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const multer = require('multer');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'https://menu.arxan.app',
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

// Konfigurasi `multer` untuk penyimpanan file gambar
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads')); // Folder penyimpanan gambar
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Nama file unik
  }
});

const upload = multer({ storage: storage });

// Serve static files dari folder `uploads`
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
    const [rows] = await pool.query(`
      SELECT mi.*, c.name as category_name
      FROM menu_items mi
      LEFT JOIN categories c ON mi.category_id = c.id
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).send('Server Error');
  }
});

// READ - Dapatkan satu menu item berdasarkan ID (Publik)
app.get('/api/menu/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const [rows] = await pool.query(`
      SELECT mi.*, c.name as category_name
      FROM menu_items mi
      LEFT JOIN categories c ON mi.category_id = c.id
      WHERE mi.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching menu item:', error);
    res.status(500).send('Server Error');
  }
});

// CREATE - Tambah menu item baru (Autentikasi)
app.post('/api/menu', authenticateToken, async (req, res) => {
  const { name, price, description, image, category_id } = req.body;

  // Validasi sederhana
  if (!name || !price || !category_id) {
    return res.status(400).json({ message: 'Name, price, and category_id are required.' });
  }

  try {
    // Periksa apakah category_id valid
    const [catRows] = await pool.execute('SELECT * FROM categories WHERE id = ?', [category_id]);
    if (catRows.length === 0) {
      return res.status(400).json({ message: 'Invalid category_id.' });
    }

    const [result] = await pool.query(
      'INSERT INTO menu_items (name, price, description, image, category_id) VALUES (?, ?, ?, ?, ?)',
      [name, price, description, image, category_id]
    );
    const newItem = { id: result.insertId, name, price, description, image, category_id };
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error adding menu item:', error);
    res.status(500).send('Server Error');
  }
});

// UPDATE - Edit menu item berdasarkan ID (Autentikasi)
app.put('/api/menu/:id', authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, price, description, image, category_id } = req.body;

  // Validasi sederhana
  if (!name || !price || !category_id) {
    return res.status(400).json({ message: 'Name, price, and category_id are required.' });
  }

  try {
    // Periksa apakah category_id valid
    const [catRows] = await pool.execute('SELECT * FROM categories WHERE id = ?', [category_id]);
    if (catRows.length === 0) {
      return res.status(400).json({ message: 'Invalid category_id.' });
    }

    const [result] = await pool.query(
      'UPDATE menu_items SET name = ?, price = ?, description = ?, image = ?, category_id = ? WHERE id = ?',
      [name, price, description, image, category_id, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    const updatedItem = { id, name, price, description, image, category_id };
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

// READ - Dapatkan semua kategori (Publik)
app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).send('Server Error');
  }
});

// READ - Dapatkan kategori beserta menu-nya
app.get('/api/categories/:id/menu', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    // Periksa apakah kategori ada
    const [catRows] = await pool.execute('SELECT * FROM categories WHERE id = ?', [id]);
    if (catRows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Ambil menu berdasarkan category_id
    const [menuRows] = await pool.execute(`
      SELECT mi.*, c.name as category_name
      FROM menu_items mi
      LEFT JOIN categories c ON mi.category_id = c.id
      WHERE mi.category_id = ?
    `, [id]);

    res.json({
      category: catRows[0],
      menu: menuRows
    });
  } catch (error) {
    console.error('Error fetching menu by category:', error);
    res.status(500).send('Server Error');
  }
});

// POST - Upload gambar menu (Autentikasi)
app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const imageUrl = `https://${req.get('host')}/uploads/${req.file.filename}`;
  res.status(201).json({ imageUrl });
});

// Mulai server
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
