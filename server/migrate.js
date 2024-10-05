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

// Data kategori awal
const categories = [
  { name: 'Breakfast' },
  { name: 'Lunch' },
  { name: 'Shakes' }
];

// Data menu awal
const menuItems = [
  {
    name: 'Buttermilk Pancakes',
    price: 15.99,
    description: 'Delicious pancakes with syrup and fresh strawberries.',
    image: 'https://via.placeholder.com/150',
    category: 'Breakfast'
  },
  {
    name: 'Godzilla Milkshake',
    price: 6.99,
    description: 'A huge milkshake topped with donuts and whipped cream.',
    image: 'https://via.placeholder.com/150',
    category: 'Shakes'
  }
];

// Data pengguna awal
const users = [
  {
    username: 'admin',
    password: 'password' // Password akan di-hash sebelum disimpan
  }
];

async function migrate() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Terhubung ke database MySQL.');

    // Buat tabel categories jika belum ada
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE
      )
    `);
    console.log('Tabel categories sudah ada atau telah dibuat.');

    // Buat tabel menu_items dengan foreign key category_id jika belum ada
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        description TEXT,
        image VARCHAR(255),
        category_id INT,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `);
    console.log('Tabel menu_items sudah ada atau telah dibuat dengan foreign key category_id.');

    // Buat tabel users jika belum ada
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL
      )
    `);
    console.log('Tabel users sudah ada atau telah dibuat.');

    // Migrasi data categories jika tabel kosong
    const [categoryRows] = await connection.query('SELECT COUNT(*) as count FROM categories');
    if (categoryRows[0].count === 0) {
      for (const category of categories) {
        const [result] = await connection.execute(
          'INSERT INTO categories (name) VALUES (?)',
          [category.name]
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
        // Dapatkan category_id berdasarkan nama kategori
        const [catRows] = await connection.execute(
          'SELECT id FROM categories WHERE name = ?',
          [item.category]
        );
        if (catRows.length === 0) {
          console.log(`Kategori "${item.category}" tidak ditemukan. Melewati item menu: ${item.name}`);
          continue;
        }
        const categoryId = catRows[0].id;

        const [result] = await connection.execute(
          'INSERT INTO menu_items (name, price, description, image, category_id) VALUES (?, ?, ?, ?, ?)',
          [item.name, item.price, item.description, item.image, categoryId]
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
          'INSERT INTO users (username, password) VALUES (?, ?)',
          [user.username, hashedPassword]
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