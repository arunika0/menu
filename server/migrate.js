// server/migrate.js

require('dotenv').config();
const mysql = require('mysql2/promise');

// Konfigurasi koneksi MySQL
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

// Data menu awal
const menuItems = [
  {
    name: 'Buttermilk Pancakes',
    price: 15.99,
    description: 'Delicious pancakes with syrup and fresh strawberries.',
    image: 'https://via.placeholder.com/150',
    category: 'breakfast'
  },
  {
    name: 'Godzilla Milkshake',
    price: 6.99,
    description: 'A huge milkshake topped with donuts and whipped cream.',
    image: 'https://via.placeholder.com/150',
    category: 'shakes'
  },
  // ...item lainnya
];

async function migrate() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database.');

    for (const item of menuItems) {
      const [result] = await connection.execute(
        'INSERT INTO menu_items (name, price, description, image, category) VALUES (?, ?, ?, ?, ?)',
        [item.name, item.price, item.description, item.image, item.category]
      );
      console.log(`Inserted menu item with ID: ${result.insertId}`);
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
