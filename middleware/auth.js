// middleware/auth.js

export default function ({ route, redirect }) {
    // Jika halaman adalah admin dan tidak ada token, redirect ke login
    if (route.path === '/admin') {
      const token = process.client ? localStorage.getItem('token') : null;
      if (!token) {
        return redirect('/login');
      }
    }
  }
  