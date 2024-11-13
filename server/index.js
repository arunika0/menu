// server/index.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const authenticateToken = require('./middleware/auth');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'https://menu.arxan.app', // Sesuaikan dengan domain frontend Anda
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

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Maksimum 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images are allowed'));
  }
});

// Serve static files dari folder `uploads`
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/**
 * Rute Utama API
 */
const router = express.Router();

/**
 * Rute Login
 * POST /api/login
 */
router.post('/login', async (req, res) => {
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

    // Buat JWT, sertakan role dan restaurant_id
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, restaurant_id: user.restaurant_id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log(`JWT Token created: ${token}`);

    res.json({ token, role: user.role, restaurant_id: user.restaurant_id });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).send('Server Error');
  }
});

/**
 * Rute CRUD Restoran
 */

// CREATE Restoran (Super Admin)
router.post('/restaurants', authenticateToken('super_admin'), upload.single('image'), async (req, res) => {
  const { name, address, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required.' });

  try {
    let imagePath = null;
    if (req.file) {
      imagePath = `https://${req.get('host')}/uploads/${req.file.filename}`;
    }
    const [result] = await pool.query(
      'INSERT INTO restaurants (name, address, description, image) VALUES (?, ?, ?, ?)',
      [name, address, description, imagePath]
    );
    const newRestaurant = { id: result.insertId, name, address, description, image: imagePath };
    res.status(201).json(newRestaurant);
  } catch (error) {
    console.error('Error adding restaurant:', error);
    res.status(500).send('Server Error');
  }
});

// READ All Restoran (Publik)
router.get('/restaurants', async (req, res) => {
  try {
    const [restaurants] = await pool.query('SELECT * FROM restaurants');
    res.json(restaurants);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).send('Server Error');
  }
});

// READ Single Restoran (Publik)
router.get('/restaurants/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const [rows] = await pool.query('SELECT * FROM restaurants WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Restaurant not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    res.status(500).send('Server Error');
  }
});

// UPDATE Restoran (Super Admin)
router.put('/restaurants/:id', authenticateToken('super_admin'), upload.single('image'), async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, address, description } = req.body;

  if (!name) return res.status(400).json({ message: 'Name is required.' });

  try {
    const [restRows] = await pool.query('SELECT * FROM restaurants WHERE id = ?', [id]);
    if (restRows.length === 0) return res.status(404).json({ message: 'Restaurant not found' });
    const restaurant = restRows[0];
    let imagePath = restaurant.image;
    if (req.file) {
      imagePath = `https://${req.get('host')}/uploads/${req.file.filename}`;
      if (restaurant.image) {
        const oldImagePath = path.join(__dirname, 'uploads', path.basename(restaurant.image));
        fs.unlink(oldImagePath, err => {
          if (err) console.error('Error deleting old image:', err);
        });
      }
    }
    const [result] = await pool.query(
      'UPDATE restaurants SET name = ?, address = ?, description = ?, image = ? WHERE id = ?',
      [name, address, description, imagePath, id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ message: 'Restaurant not found' });

    const updatedRestaurant = { id, name, address, description, image: imagePath };
    res.json(updatedRestaurant);
  } catch (error) {
    console.error('Error updating restaurant:', error);
    res.status(500).send('Server Error');
  }
});

// DELETE Restoran (Super Admin)
router.delete('/restaurants/:id', authenticateToken('super_admin'), async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const [result] = await pool.query('DELETE FROM restaurants WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Restaurant not found' });
    res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    res.status(500).send('Server Error');
  }
});

/**
 * Rute CRUD Users (Admin Restoran dan Super Admin)
 */

// CREATE Admin Restoran (Super Admin)
router.post('/users', authenticateToken('super_admin'), [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('role').isIn(['super_admin', 'restaurant_admin']).withMessage('Invalid role'),
  body('restaurant_id').custom((value, { req }) => {
    if (req.body.role === 'restaurant_admin' && !value) {
      throw new Error('restaurant_id is required for restaurant_admin role.');
    }
    return true;
  })
], async (req, res) => {
  // Cek hasil validasi
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password, role, restaurant_id } = req.body;

  try {
    // Jika role adalah restaurant_admin, periksa apakah restaurant_id valid
    if (role === 'restaurant_admin') {
      const [restRows] = await pool.query('SELECT * FROM restaurants WHERE id = ?', [restaurant_id]);
      if (restRows.length === 0) {
        return res.status(400).json({ message: 'Invalid restaurant_id.' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (username, password, role, restaurant_id) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, role, role === 'restaurant_admin' ? restaurant_id : null]
    );

    const newUser = { id: result.insertId, username, role, restaurant_id: role === 'restaurant_admin' ? restaurant_id : null };
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).send('Server Error');
  }
});

// READ All Users (Super Admin)
router.get('/users', authenticateToken('super_admin'), async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT u.id, u.username, u.role, u.restaurant_id, r.name as restaurant_name
      FROM users u
      LEFT JOIN restaurants r ON u.restaurant_id = r.id
    `);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('Server Error');
  }
});

// READ Single User (Super Admin)
router.get('/users/:id', authenticateToken('super_admin'), async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.username, u.role, u.restaurant_id, r.name as restaurant_name
      FROM users u
      LEFT JOIN restaurants r ON u.restaurant_id = r.id
      WHERE u.id = ?
    `, [id]);

    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).send('Server Error');
  }
});

// UPDATE User (Super Admin)
router.put('/users/:id', authenticateToken('super_admin'), [
  body('username').optional().notEmpty().withMessage('Username cannot be empty'),
  body('password').optional().notEmpty().withMessage('Password cannot be empty'),
  body('role').optional().isIn(['super_admin', 'restaurant_admin']).withMessage('Invalid role'),
  body('restaurant_id').optional().custom((value, { req }) => {
    if (req.body.role === 'restaurant_admin' && !value) {
      throw new Error('restaurant_id is required for restaurant_admin role.');
    }
    return true;
  })
], async (req, res) => {
  const id = parseInt(req.params.id);
  const { username, password, role, restaurant_id } = req.body;

  // Cek hasil validasi
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Cek apakah pengguna ada
    const [userRows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Jika role diubah menjadi restaurant_admin, periksa restaurant_id
    if (role === 'restaurant_admin' && !restaurant_id) {
      return res.status(400).json({ message: 'restaurant_id is required for restaurant_admin role.' });
    }

    // Jika role adalah restaurant_admin, periksa apakah restaurant_id valid
    if (role === 'restaurant_admin') {
      const [restRows] = await pool.query('SELECT * FROM restaurants WHERE id = ?', [restaurant_id]);
      if (restRows.length === 0) {
        return res.status(400).json({ message: 'Invalid restaurant_id.' });
      }
    }

    // Persiapkan field yang akan diupdate
    const fields = [];
    const values = [];

    if (username) {
      fields.push('username = ?');
      values.push(username);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      fields.push('password = ?');
      values.push(hashedPassword);
    }

    if (role) {
      fields.push('role = ?');
      values.push(role);
    }

    if (role === 'restaurant_admin') {
      fields.push('restaurant_id = ?');
      values.push(restaurant_id);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update.' });
    }

    values.push(id); // Untuk WHERE clause

    const [result] = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Ambil data pengguna yang diperbarui
    const [updatedRows] = await pool.query(`
      SELECT u.id, u.username, u.role, u.restaurant_id, r.name as restaurant_name
      FROM users u
      LEFT JOIN restaurants r ON u.restaurant_id = r.id
      WHERE u.id = ?
    `, [id]);

    res.json(updatedRows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).send('Server Error');
  }
});

// DELETE User (Super Admin)
router.delete('/users/:id', authenticateToken('super_admin'), async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).send('Server Error');
  }
});

/**
 * Rute CRUD Menu Items
 */

// CREATE Menu Item (Super Admin dan Restaurant Admin)
router.post('/menu', authenticateToken(['super_admin', 'restaurant_admin']), upload.single('image'), async (req, res) => {
  const { name, price, description, category_id } = req.body;

  // Cek hasil validasi
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Periksa apakah category_id valid dan sesuai dengan restoran pengguna
    const [catRows] = await pool.query(`
      SELECT * FROM categories WHERE id = ? AND restaurant_id = ?
    `, [category_id, req.user.role === 'restaurant_admin' ? req.user.restaurant_id : req.body.restaurant_id || null]);

    if (catRows.length === 0) {
      return res.status(400).json({ message: 'Invalid category_id or category does not belong to your restaurant.' });
    }

    // Tentukan restaurant_id
    let restaurant_id;
    if (req.user.role === 'super_admin') {
      // Super admin harus menyertakan restaurant_id dalam body
      restaurant_id = req.body.restaurant_id;
      if (!restaurant_id) {
        return res.status(400).json({ message: 'restaurant_id is required for super_admin.' });
      }
      // Periksa apakah restaurant_id valid
      const [restRows] = await pool.query('SELECT * FROM restaurants WHERE id = ?', [restaurant_id]);
      if (restRows.length === 0) {
        return res.status(400).json({ message: 'Invalid restaurant_id.' });
      }
    } else if (req.user.role === 'restaurant_admin') {
      // Admin restoran hanya bisa menambahkan menu untuk restoran mereka sendiri
      restaurant_id = req.user.restaurant_id;
    }

    // Process uploaded image
    let imagePath = null;
    if (req.file) {
      imagePath = `https://${req.get('host')}/uploads/${req.file.filename}`;
    }

    const [result] = await pool.query(
      'INSERT INTO menu_items (name, price, description, image, category_id, restaurant_id) VALUES (?, ?, ?, ?, ?, ?)',
      [name, price, description, imagePath, category_id, restaurant_id]
    );

    const newItem = { id: result.insertId, name, price, description, image: imagePath, category_id, restaurant_id };
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error adding menu item:', error);
    res.status(500).send('Server Error');
  }
});

// Add an optional authentication middleware
function optionalAuthenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) {
      return next();
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return next();
      }
      req.user = user;
      next();
    });
  } else {
    next();
  }
}

// READ Menu Items (Publik)
router.get('/menu', optionalAuthenticateToken, async (req, res) => {
  const { restaurant_id } = req.query;
  try {
    let sql = `
      SELECT mi.*, c.name as category_name, r.name as restaurant_name
      FROM menu_items mi
      LEFT JOIN categories c ON mi.category_id = c.id
      LEFT JOIN restaurants r ON mi.restaurant_id = r.id
    `;
    const params = [];
    const conditions = [];

    if (req.user && req.user.role === 'restaurant_admin') {
      // Only return menu items from the authenticated restaurant admin's restaurant
      conditions.push('mi.restaurant_id = ?');
      params.push(req.user.restaurant_id);
    } else if (restaurant_id) {
      // Filter by restaurant_id if provided in query params
      conditions.push('mi.restaurant_id = ?');
      params.push(restaurant_id);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).send('Server Error');
  }
});

// READ Single Menu Item (Publik)
router.get('/menu/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const [rows] = await pool.query(`
      SELECT mi.*, c.name as category_name, r.name as restaurant_name
      FROM menu_items mi
      LEFT JOIN categories c ON mi.category_id = c.id
      LEFT JOIN restaurants r ON mi.restaurant_id = r.id
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

// UPDATE Menu Item (Super Admin dan Restaurant Admin)
router.put('/menu/:id', authenticateToken(['super_admin', 'restaurant_admin']), upload.single('image'), async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, price, description, category_id, restaurant_id } = req.body;

  // Cek hasil validasi
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Ambil menu item yang akan diupdate
    const [menuRows] = await pool.query('SELECT * FROM menu_items WHERE id = ?', [id]);
    if (menuRows.length === 0) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    const menuItem = menuRows[0];

    // Jika pengguna adalah restaurant_admin, pastikan menu item milik mereka
    if (req.user.role === 'restaurant_admin' && menuItem.restaurant_id !== req.user.restaurant_id) {
      return res.status(403).json({ message: 'Forbidden: You can only update your own menu items.' });
    }

    // Jika super_admin, dan restaurant_id disediakan, pastikan restaurant_id valid
    if (req.user.role === 'super_admin' && restaurant_id) {
      const [restRows] = await pool.query('SELECT * FROM restaurants WHERE id = ?', [restaurant_id]);
      if (restRows.length === 0) {
        return res.status(400).json({ message: 'Invalid restaurant_id.' });
      }
    }

    // Jika category_id disediakan, pastikan category_id valid dan sesuai dengan restaurant
    if (category_id) {
      const [catRows] = await pool.query(`
        SELECT * FROM categories WHERE id = ? AND restaurant_id = ?
      `, [category_id, req.user.role === 'super_admin' ? (restaurant_id || menuItem.restaurant_id) : req.user.restaurant_id]);

      if (catRows.length === 0) {
        return res.status(400).json({ message: 'Invalid category_id or category does not belong to your restaurant.' });
      }
    }

    // Process uploaded image
    let imagePath;
    if (req.file) {
      imagePath = `https://${req.get('host')}/uploads/${req.file.filename}`;
      // Optionally delete the old image file
      if (menuItem.image) {
        const oldImagePath = path.join(__dirname, 'uploads', path.basename(menuItem.image));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    } else {
      imagePath = menuItem.image; // Keep existing image if no new image uploaded
    }

    // Persiapkan field yang akan diupdate
    const fields = [];
    const values = [];

    if (name) {
      fields.push('name = ?');
      values.push(name);
    }

    if (price !== undefined) {
      fields.push('price = ?');
      values.push(price);
    }

    if (description !== undefined) {
      fields.push('description = ?');
      values.push(description);
    }

    if (category_id !== undefined) {
      fields.push('category_id = ?');
      values.push(category_id);
    }

    if (restaurant_id !== undefined && req.user.role === 'super_admin') {
      fields.push('restaurant_id = ?');
      values.push(restaurant_id);
    }

    if (req.file) {
      fields.push('image = ?');
      values.push(imagePath);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update.' });
    }

    values.push(id); // Untuk WHERE clause

    const [result] = await pool.query(
      `UPDATE menu_items SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    // Ambil data menu item yang diperbarui
    const [updatedRows] = await pool.query(`
      SELECT mi.*, c.name as category_name, r.name as restaurant_name
      FROM menu_items mi
      LEFT JOIN categories c ON mi.category_id = c.id
      LEFT JOIN restaurants r ON mi.restaurant_id = r.id
      WHERE mi.id = ?
    `, [id]);

    res.json(updatedRows[0]);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).send('Server Error');
  }
});

// DELETE Menu Item (Super Admin dan Restaurant Admin)
router.delete('/menu/:id', authenticateToken(['super_admin', 'restaurant_admin']), async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    // Dapatkan data menu sebelum dihapus untuk menghapus gambar
    const [rows] = await pool.query('SELECT image, restaurant_id FROM menu_items WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    const { image, restaurant_id } = rows[0];

    // Jika pengguna adalah restaurant_admin, pastikan menu item milik mereka
    if (req.user.role === 'restaurant_admin' && restaurant_id !== req.user.restaurant_id) {
      return res.status(403).json({ message: 'Forbidden: You can only delete your own menu items.' });
    }

    // Hapus file gambar jika ada
    if (image) {
      const filename = path.basename(image);
      const imagePath = path.join(__dirname, 'uploads', filename);

      try {
        await fs.promises.unlink(imagePath);
        console.log('Image file deleted successfully');
      } catch (err) {
        console.error('Error deleting image file:', err);
        // Lanjutkan tanpa menghentikan proses
      }
    }

    // Hapus data menu dari database
    const [result] = await pool.query('DELETE FROM menu_items WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).send('Server Error');
  }
});

/**
 * Rute CRUD Categories
 */

// CREATE Kategori (Super Admin dan Restaurant Admin)
router.post('/categories', authenticateToken(['super_admin', 'restaurant_admin']), [
  body('name').notEmpty().withMessage('Name is required')
], async (req, res) => {
  const { name } = req.body;

  // Cek hasil validasi
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    let rest_id;
    if (req.user.role === 'super_admin') {
      rest_id = restaurant_id;
      if (!rest_id) {
        return res.status(400).json({ message: 'restaurant_id is required for super_admin.' });
      }
      // Periksa apakah restaurant_id valid
      const [restRows] = await pool.query('SELECT * FROM restaurants WHERE id = ?', [rest_id]);
      if (restRows.length === 0) {
        return res.status(400).json({ message: 'Invalid restaurant_id.' });
      }
    } else if (req.user.role === 'restaurant_admin') {
      rest_id = req.user.restaurant_id;
    }

    // Cek apakah kategori sudah ada untuk restoran tersebut
    const [existing] = await pool.query('SELECT * FROM categories WHERE name = ? AND restaurant_id = ?', [name, rest_id]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Category already exists for this restaurant.' });
    }

    const [result] = await pool.query(
      'INSERT INTO categories (name, restaurant_id) VALUES (?, ?)',
      [name, rest_id]
    );

    const newCategory = { id: result.insertId, name, restaurant_id: rest_id };
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error adding category:', error);
    res.status(500).send('Server Error');
  }
});

// READ All Categories (Publik)
router.get('/categories', optionalAuthenticateToken, async (req, res) => {
  const { restaurant_id } = req.query;
  try {
    let sql = `
      SELECT c.*, r.name as restaurant_name
      FROM categories c
      LEFT JOIN restaurants r ON c.restaurant_id = r.id
    `;
    const params = [];
    const conditions = [];

    if (req.user && req.user.role === 'restaurant_admin') {
      // Only return categories from the authenticated restaurant admin's restaurant
      conditions.push('c.restaurant_id = ?');
      params.push(req.user.restaurant_id);
    } else if (restaurant_id) {
      // Filter by restaurant_id if provided in query params
      conditions.push('c.restaurant_id = ?');
      params.push(restaurant_id);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    const [categories] = await pool.query(sql, params);
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).send('Server Error');
  }
});

// READ Single Category (Publik)
router.get('/categories/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const [rows] = await pool.query(`
      SELECT c.*, r.name as restaurant_name
      FROM categories c
      LEFT JOIN restaurants r ON c.restaurant_id = r.id
      WHERE c.id = ?
    `, [id]);

    if (rows.length === 0) return res.status(404).json({ message: 'Category not found' });

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).send('Server Error');
  }
});

// UPDATE Kategori (Super Admin dan Restaurant Admin)
router.put('/categories/:id', authenticateToken(['super_admin', 'restaurant_admin']), [
  body('name').optional().notEmpty().withMessage('Name cannot be empty')
], async (req, res) => {
  const id = parseInt(req.params.id);
  const { name } = req.body;

  // Cek hasil validasi
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Ambil kategori yang akan diupdate
    const [catRows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (catRows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    const category = catRows[0];

    // Jika pengguna adalah restaurant_admin, pastikan kategori milik mereka
    if (req.user.role === 'restaurant_admin' && category.restaurant_id !== req.user.restaurant_id) {
      return res.status(403).json({ message: 'Forbidden: You can only update your own categories.' });
    }

    // Jika restaurant_id diubah oleh super_admin, pastikan restaurant_id valid
    let rest_id = category.restaurant_id;
    if (req.user.role === 'super_admin' && restaurant_id) {
      const [restRows] = await pool.query('SELECT * FROM restaurants WHERE id = ?', [restaurant_id]);
      if (restRows.length === 0) {
        return res.status(400).json({ message: 'Invalid restaurant_id.' });
      }
      rest_id = restaurant_id;
    }

    // Cek apakah nama kategori sudah ada untuk restoran tersebut (kecuali kategori yang sedang diupdate)
    if (name) {
      const [existing] = await pool.query('SELECT * FROM categories WHERE name = ? AND restaurant_id = ? AND id != ?', [name, rest_id, id]);
      if (existing.length > 0) {
        return res.status(400).json({ message: 'Another category with the same name already exists for this restaurant.' });
      }
    }

    // Persiapkan field yang akan diupdate
    const fields = [];
    const values = [];

    if (name) {
      fields.push('name = ?');
      values.push(name);
    }

    if (req.user.role === 'super_admin' && restaurant_id) {
      fields.push('restaurant_id = ?');
      values.push(rest_id);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update.' });
    }

    values.push(id); // Untuk WHERE clause

    const [result] = await pool.query(
      `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Ambil data kategori yang diperbarui
    const [updatedRows] = await pool.query(`
      SELECT c.*, r.name as restaurant_name
      FROM categories c
      LEFT JOIN restaurants r ON c.restaurant_id = r.id
      WHERE c.id = ?
    `, [id]);

    res.json(updatedRows[0]);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).send('Server Error');
  }
});

// DELETE Kategori (Super Admin dan Restaurant Admin)
router.delete('/categories/:id', authenticateToken(['super_admin', 'restaurant_admin']), async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    // Ambil kategori yang akan dihapus
    const [catRows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (catRows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    const category = catRows[0];

    // Jika pengguna adalah restaurant_admin, pastikan kategori milik mereka
    if (req.user.role === 'restaurant_admin' && category.restaurant_id !== req.user.restaurant_id) {
      return res.status(403).json({ message: 'Forbidden: You can only delete your own categories.' });
    }

    // Hapus kategori
    const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).send('Server Error');
  }
});

/**
 * Rute CRUD Users (Already Covered in Users Section)
 * - CREATE Admin Restoran
 * - READ All Users
 * - READ Single User
 * - UPDATE User
 * - DELETE User
 */

/**
 * Rute Upload Gambar Menu
 * POST /api/upload
 */
router.post('/upload', authenticateToken(['super_admin', 'restaurant_admin']), upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const imageUrl = `https://${req.get('host')}/uploads/${req.file.filename}`;
  res.status(201).json({ imageUrl });
});

/**
 * Gunakan Router dengan Prefix /api
 */
app.use('/api', router);

/**
 * Mulai Server
 */
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
