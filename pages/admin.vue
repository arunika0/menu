<template>
    <div>
      <!-- Sidebar and Content -->
      <div class="container-fluid">
        <div class="row">
          <!-- Sidebar -->
          <nav class="col-md-2 d-none d-md-block bg-light sidebar">
            <div class="sidebar-sticky">
              <ul class="nav flex-column mt-4">
                <li class="nav-item">
                  <nuxt-link to="/admin" class="nav-link" exact>
                    Dashboard
                  </nuxt-link>
                </li>
                <li class="nav-item">
                  <nuxt-link to="/admin/menu" class="nav-link">
                    Manage Menu
                  </nuxt-link>
                </li>
                <li class="nav-item">
                  <nuxt-link to="/admin/categories" class="nav-link">
                    Manage Categories
                  </nuxt-link>
                </li>
              </ul>
            </div>
          </nav>
  
          <!-- Main Content -->
          <main role="main" class="col-md-9 ml-sm-auto col-lg-10 px-4 mt-4">
            <nuxt />
          </main>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    middleware: 'auth',
    computed: {
      isAuthenticated() {
        return this.$store.getters.isAuthenticated;
      }
    },
    methods: {
      logout() {
        this.$store.dispatch('logout');
        localStorage.removeItem('token');
        this.$axios.setToken(false);
        this.$router.push('/login');
      }
    }
  };
  </script>
  
  <style scoped>
  /* Styling khusus untuk layout admin */
  .sidebar {
    position: fixed;
    top: 56px; /* Height of the navbar */
    bottom: 0;
    left: 0;
    padding: 0;
    box-shadow: inset -1px 0 0 rgba(0, 0, 0, 0.1);
  }
  
  .sidebar .nav-link {
    font-weight: 500;
    color: #333;
  }
  
  .sidebar .nav-link:hover {
    color: #007bff;
  }
  
  main {
    margin-left: 200px; /* Width of the sidebar */
  }
  </style>
