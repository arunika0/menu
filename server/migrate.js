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
    console.log('Connected to MySQL database.');

    // Migrasi users
    for (const user of users) {
      // Hash password sebelum disimpan
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await connection.execute(
        'INSERT INTO users (username, password) VALUES (?, ?)',
        [user.username, hashedPassword]
      );
      console.log(`Inserted user: ${user.username}`);
    }

    console.log('Data migrasi berhasil!');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('MySQL connection closed.');
    }
  }
}

migrate();
