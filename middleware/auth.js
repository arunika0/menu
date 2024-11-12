// middleware/auth.js

export default function ({ store, redirect, route }) {
  let token = null;

  if (process.client) {
    token = localStorage.getItem('token');
  }

  // Jika tidak ada token dan bukan halaman login, redirect ke login
  if (!token && route.name !== 'login') {
    return redirect('/login');
  }

  // Jika ada token tetapi belum disimpan di Vuex, lakukan inisialisasi
  if (token && !store.state.user.token) {
    // Decode token untuk mendapatkan informasi pengguna
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      store.dispatch('login', {
        token,
        role: payload.role,
        restaurant_id: payload.restaurant_id
      });
    } catch (error) {
      console.error('Error decoding token:', error);
      return redirect('/login');
    }
  }

  // Mengambil peran pengguna dari store
  const userRole = store.state.user.role;

  // Redirect berdasarkan peran pengguna
  if (userRole === 'super_admin' && !route.path.startsWith('/super-admin')) {
    return redirect('/super-admin/dashboard');
  }

  if (userRole === 'restaurant_admin' && route.path.startsWith('/super-admin')) {
    return redirect('/admin');
  }
}
