// plugins/axios.js

export default function ({ $axios, store, redirect }) {
  // On setiap request, set header Authorization jika token ada
  $axios.onRequest(config => {
    const token = store.state.user.token || (process.client ? localStorage.getItem('token') : null);
    if (token) {
      config.headers.common['Authorization'] = `Bearer ${token}`;
    }
    return config;
  });

  // Handle error response
  $axios.onError(error => {
    const code = parseInt(error.response && error.response.status);
    if (code === 401 || code === 403) {
      // Clear user data dari Vuex store
      store.commit('clearUser');

      // Hapus token dari localStorage
      if (process.client) {
        localStorage.removeItem('token');
      }

      // Redirect ke halaman login
      redirect('/login');
    }
  });
}
