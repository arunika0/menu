<template>
  <div class="container mt-5">
    <h2 class="text-center mb-4">Login</h2>

    <div class="row justify-content-center">
      <div class="col-md-6">
        <div class="card p-4">
          <form @submit.prevent="login">
            <div class="form-group">
              <label for="username">Username</label>
              <input
                type="text"
                v-model="username"
                id="username"
                class="form-control"
                required
                placeholder="Enter username"
              />
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input
                type="password"
                v-model="password"
                id="password"
                class="form-control"
                required
                placeholder="Enter password"
              />
            </div>
            <button type="submit" class="btn btn-primary btn-block">Login</button>
            <div v-if="errorMessage" class="alert alert-danger mt-3">
              {{ errorMessage }}
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      username: '',
      password: '',
      errorMessage: ''
    };
  },
  methods: {
    async login() {
      try {
        const response = await this.$axios.post('/api/login', {
          username: this.username,
          password: this.password
        });

        const { token, role, restaurant_id } = response.data;

        // Simpan token di localStorage
        localStorage.setItem('token', token);

        // Atur token di Axios
        this.$axios.setToken(token, 'Bearer');

        // Simpan data pengguna di Vuex Store
        this.$store.dispatch('login', { token, role, restaurant_id });

        // Redirect sesuai peran
        if (role === 'super_admin') {
          this.$router.push('/super-admin/dashboard');
        } else if (role === 'restaurant_admin') {
          this.$router.push('/admin');
        }
      } catch (error) {
        console.error('Login error:', error);
        if (error.response && error.response.data && error.response.data.message) {
          this.errorMessage = error.response.data.message;
        } else {
          this.errorMessage = 'An error occurred during login.';
        }
      }
    }
  },
  mounted() {
    // Jika sudah login, redirect sesuai peran
    const token = localStorage.getItem('token');
    const role = this.$store.state.user.role;
    const restaurant_id = this.$store.state.user.restaurant_id;

    if (token && role) {
      this.$axios.setToken(token, 'Bearer');
      if (role === 'super_admin') {
        this.$router.push('/super-admin/dashboard');
      } else if (role === 'restaurant_admin') {
        this.$router.push('/admin');
      }
    }
  }
};
</script>

<style scoped>
.card {
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}
</style>
