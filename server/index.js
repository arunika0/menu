const express = require('express');
const cors = require('cors');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Data menu yang akan disajikan melalui API
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
  {
    name: 'Diner Double',
    price: 13.99,
    description: 'Classic double cheeseburger with fries.',
    image: 'https://via.placeholder.com/150',
    category: 'lunch'
  },
  {
    name: 'Country Delight',
    price: 20.99,
    description: 'Hearty breakfast with eggs, bacon, and toast.',
    image: 'https://via.placeholder.com/150',
    category: 'breakfast'
  },
  {
    name: 'Oreo Dream',
    price: 18.99,
    description: 'Creamy milkshake with Oreo cookies.',
    image: 'https://via.placeholder.com/150',
    category: 'shakes'
  },
  {
    name: 'Egg Attack',
    price: 220.99,
    description: 'Vegan burger with a fried egg and avocado.',
    image: 'https://via.placeholder.com/150',
    category: 'lunch'
  }
];

// Endpoint untuk mendapatkan menu items    
app.get('/api/menu', (req, res) => {
  res.json(menuItems);
});

// Jalankan server Express
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
