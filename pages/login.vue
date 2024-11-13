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
          <div class="text-center mt-3">
            <button @click="showRegisterModal = true" class="btn btn-outline-secondary">Register</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal for Google Form -->
    <div class="modal" tabindex="-1" v-if="showRegisterModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Register</h5>
            <button type="button" class="btn-close" @click="showRegisterModal = false"></button>
          </div>
          <div class="modal-body">
            <iframe 
              src="https://docs.google.com/forms/d/e/1FAIpQLSe6HhdjR9qRHBA5C8R9z6wkNeQ26qvWOZo9kg9KGTbcDUWZFQ/viewform?embedded=true"
              width="100%" 
              height="600" 
              frameborder="0" 
              marginheight="0" 
              marginwidth="0"
              allow="autoplay; encrypted-media; fullscreen">
              Loading…
            </iframe>
          </div>
        </div>
      </div>
    </div>
    <!-- Modal Backdrop -->
    <div class="modal-backdrop fade show" v-if="showRegisterModal" @click="showRegisterModal = false"></div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      username: '',
      password: '',
      errorMessage: '',
      showRegisterModal: false
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
  },
  beforeDestroy() {
    // Remove modal classes from body when component is destroyed
    if (this.showRegisterModal) {
      document.body.classList.remove('modal-open');
    }
  },
  watch: {
    showRegisterModal(newValue) {
      // Add or remove modal-open class from body
      if (newValue) {
        document.body.classList.add('modal-open');
      } else {
        document.body.classList.remove('modal-open');
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

/* Modal styles */
.modal {
  display: block;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-dialog {
  margin-top: 2rem;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
}
</style>
