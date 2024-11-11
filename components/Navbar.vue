<template>
    <b-navbar toggleable="lg" type="light" variant="light">
      <b-navbar-brand href="/">Menu Arxan</b-navbar-brand>
  
      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
  
      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav class="ml-auto">
          <b-nav-item to="/">Home</b-nav-item>
          <b-nav-item v-if="!isAuthenticated" to="/login">Login</b-nav-item>
          <b-nav-item-dropdown v-else text="Account" right>
            <b-dropdown-item @click="logout">Logout</b-dropdown-item>
          </b-nav-item-dropdown>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
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
  /* Styling khusus untuk Navbar */
  </style>
  