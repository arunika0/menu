<template>
    <div>
      <!-- Super Admin Navbar -->
      <b-navbar toggleable="lg" type="dark" variant="dark">
        <b-navbar-brand href="/super-admin/dashboard">Super Admin Dashboard</b-navbar-brand>
  
        <b-navbar-toggle target="super-admin-nav-collapse"></b-navbar-toggle>
  
        <b-collapse id="super-admin-nav-collapse" is-nav>
          <b-navbar-nav class="ml-auto">
            <b-nav-item to="/super-admin/dashboard">Home</b-nav-item>
            <b-nav-item to="/super-admin/restaurants">Manage Restaurants</b-nav-item>
            <b-nav-item to="/super-admin/admins">Manage Admins</b-nav-item>
            <b-nav-item-dropdown text="Account" right>
              <b-dropdown-item @click="logout">Logout</b-dropdown-item>
            </b-nav-item-dropdown>
          </b-navbar-nav>
        </b-collapse>
      </b-navbar>
  
      <!-- Sidebar and Content -->
      <div class="container-fluid">
        <div class="row">
          <!-- Sidebar -->
          <nav class="col-md-2 d-none d-md-block bg-dark sidebar">
            <div class="sidebar-sticky">
              <ul class="nav flex-column mt-4">
                <li class="nav-item">
                  <nuxt-link to="/super-admin/dashboard" class="nav-link text-white" exact>
                    Dashboard
                  </nuxt-link>
                </li>
                <li class="nav-item">
                  <nuxt-link to="/super-admin/restaurants" class="nav-link text-white">
                    Manage Restaurants
                  </nuxt-link>
                </li>
                <li class="nav-item">
                  <nuxt-link to="/super-admin/admins" class="nav-link text-white">
                    Manage Admins
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
  
      <!-- Footer -->
      <footer class="text-center mt-5 mb-3">
        <p>&copy; {{ new Date().getFullYear() }} Menu Arxan Super Admin. All rights reserved.</p>
      </footer>
    </div>
  </template>
  
  <script>
  export default {
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
  /* Styling khusus untuk layout super admin */
  .sidebar {
    position: fixed;
    top: 56px; /* Height of the navbar */
    bottom: 0;
    left: 0;
    padding: 0;
    width: 200px;
    background-color: #343a40;
  }
  
  .sidebar .nav-link {
    color: #ffffff;
    font-weight: 500;
  }
  
  .sidebar .nav-link:hover {
    color: #ffc107;
  }
  
  main {
    margin-left: 200px; /* Width of the sidebar */
  }
  
  .sidebar-sticky {
    height: calc(100vh - 56px);
    padding-top: 1rem;
    overflow-x: hidden;
    overflow-y: auto;
  }
  </style>
  