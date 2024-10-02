// plugins/axios.js

export default function ({ $axios, redirect }) {
    // Cek token di localStorage saat permintaan dimulai
    $axios.onRequest(config => {
      const token = process.client ? localStorage.getItem('token') : null;
      if (token) {
        config.headers.common['Authorization'] = `Bearer ${token}`;
      }
      return config;
    });
  
    // Tangani error response
    $axios.onError(error => {
      const code = parseInt(error.response && error.response.status);
      if (code === 401 || code === 403) {
        // Hapus token jika tidak valid atau kadaluarsa
        if (process.client) {
          localStorage.removeItem('token');
        }
        // Redirect ke login
        redirect('/login');
      }
    });
  }
  