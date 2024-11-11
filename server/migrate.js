// server/migrate.js

require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// Konfigurasi koneksi MySQL
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

// Data restoran awal
const restaurants = [
  {
    name: 'Restoran A',
    address: 'Jl. Contoh No.1, Kota A',
    description: 'Restoran A menyajikan berbagai hidangan lezat untuk sarapan dan makan siang.',
    image: 'https://via.placeholder.com/150'
  },
  {
    name: 'Restoran B',
    address: 'Jl. Contoh No.2, Kota B',
    description: 'Restoran B spesialisasi dalam hidangan manis dan minuman segar.',
    image: 'https://via.placeholder.com/150'
  }
];

// Data kategori awal
const categories = [
  { name: 'Breakfast', restaurant_id: 1 },
  { name: 'Lunch', restaurant_id: 1 },
  { name: 'Shakes', restaurant_id: 2 },
  { name: 'Desserts', restaurant_id: 2 }
];

// Data menu awal
const menuItems = [
  {
    name: 'Buttermilk Pancakes',
    price: 15.99,
    description: 'Delicious pancakes with syrup and fresh strawberries.',
    image: 'https://via.placeholder.com/150',
    category: 'Breakfast',
    restaurant_id: 1
  },
  {
    name: 'Godzilla Milkshake',
    price: 6.99,
    description: 'A huge milkshake topped with donuts and whipped cream.',
    image: 'https://via.placeholder.com/150',
    category: 'Shakes',
    restaurant_id: 2
  }
];

// Data pengguna awal
const users = [
  {
    username: 'superadmin',
    password: 'superpassword',
    role: 'super_admin',
    restaurant_id: null
  },
  {
    username: 'adminA',
    password: 'passwordA',
    role: 'restaurant_admin',
    restaurant_id: 1
  },
  {
    username: 'adminB',
    password: 'passwordB',
    role: 'restaurant_admin',
    restaurant_id: 2
  }
];

async function migrate() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Terhubung ke database MySQL.');

    // Buat tabel restaurants jika belum ada
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        address VARCHAR(255),
        description TEXT,
        image VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Tabel restaurants sudah ada atau telah dibuat.');

    // Buat tabel categories jika belum ada
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        restaurant_id INT,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
      )
    `);
    console.log('Tabel categories sudah ada atau telah dibuat.');

    // Buat tabel menu_items jika belum ada
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        description TEXT,
        image VARCHAR(255),
        category_id INT,
        restaurant_id INT,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
      )
    `);
    console.log('Tabel menu_items sudah ada atau telah dibuat dengan foreign key.');

    // Buat tabel users jika belum ada
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('super_admin', 'restaurant_admin') NOT NULL DEFAULT 'restaurant_admin',
        restaurant_id INT,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE SET NULL
      )
    `);
    console.log('Tabel users sudah ada atau telah dibuat.');

    // Migrasi data restoran jika tabel kosong
    const [restRows] = await connection.query('SELECT COUNT(*) as count FROM restaurants');
    if (restRows[0].count === 0) {
      for (const restaurant of restaurants) {
        const [result] = await connection.execute(
          'INSERT INTO restaurants (name, address, description, image) VALUES (?, ?, ?, ?)',
          [restaurant.name, restaurant.address, restaurant.description, restaurant.image]
        );
        console.log(`Menambahkan restoran: ${restaurant.name} dengan ID: ${result.insertId}`);
      }
    } else {
      console.log('Tabel restaurants sudah memiliki data.');
    }

    // Migrasi data categories jika tabel kosong
    const [categoryRows] = await connection.query('SELECT COUNT(*) as count FROM categories');
    if (categoryRows[0].count === 0) {
      for (const category of categories) {
        // Periksa apakah restaurant_id valid
        const [restRows] = await connection.query('SELECT * FROM restaurants WHERE id = ?', [category.restaurant_id]);
        if (restRows.length === 0) {
          console.log(`Restaurant ID ${category.restaurant_id} tidak ditemukan. Melewati kategori: ${category.name}`);
          continue;
        }

        const [result] = await connection.execute(
          'INSERT INTO categories (name, restaurant_id) VALUES (?, ?)',
          [category.name, category.restaurant_id]
        );
        console.log(`Menambahkan kategori: ${category.name} dengan ID: ${result.insertId}`);
      }
    } else {
      console.log('Tabel categories sudah memiliki data.');
    }

    // Migrasi data menu_items jika tabel kosong
    const [menuRows] = await connection.query('SELECT COUNT(*) as count FROM menu_items');
    if (menuRows[0].count === 0) {
      for (const item of menuItems) {
        // Dapatkan category_id berdasarkan nama kategori dan restaurant_id
        const [catRows] = await connection.execute(
          'SELECT id FROM categories WHERE name = ? AND restaurant_id = ?',
          [item.category, item.restaurant_id]
        );
        if (catRows.length === 0) {
          console.log(`Kategori "${item.category}" untuk restoran ID ${item.restaurant_id} tidak ditemukan. Melewati item menu: ${item.name}`);
          continue;
        }
        const categoryId = catRows[0].id;

        const [result] = await connection.execute(
          'INSERT INTO menu_items (name, price, description, image, category_id, restaurant_id) VALUES (?, ?, ?, ?, ?, ?)',
          [item.name, item.price, item.description, item.image, categoryId, item.restaurant_id]
        );
        console.log(`Menambahkan item menu: ${item.name} dengan ID: ${result.insertId}`);
      }
    } else {
      console.log('Tabel menu_items sudah memiliki data.');
    }

    // Migrasi data users jika tabel kosong
    const [userRows] = await connection.query('SELECT COUNT(*) as count FROM users');
    if (userRows[0].count === 0) {
      for (const user of users) {
        // Hash password sebelum disimpan
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await connection.execute(
          'INSERT INTO users (username, password, role, restaurant_id) VALUES (?, ?, ?, ?)',
          [user.username, hashedPassword, user.role, user.restaurant_id]
        );
        console.log(`Menambahkan pengguna: ${user.username}`);
      }
    } else {
      console.log('Tabel users sudah memiliki data.');
    }

    console.log('Migrasi data berhasil!');
  } catch (error) {
    console.error('Error selama migrasi:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Koneksi ke MySQL ditutup.');
    }
  }
}

migrate();
