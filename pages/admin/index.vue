<template>
    <div>
      <h2 class="mb-4">Admin Dashboard</h2>
  
      <div class="row">
        <div class="col-md-4">
          <div class="card text-white bg-primary mb-3">
            <div class="card-header">Total Menu Items</div>
            <div class="card-body">
              <h5 class="card-title">{{ totalMenuItems }}</h5>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card text-white bg-success mb-3">
            <div class="card-header">Total Categories</div>
            <div class="card-body">
              <h5 class="card-title">{{ totalCategories }}</h5>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Additional Dashboard Content -->
      <div class="mt-5">
        <h4>Recent Menu Items</h4>
        <ul class="list-group">
          <li v-for="menu in recentMenu" :key="menu.id" class="list-group-item">
            {{ menu.name }} - Rp{{ menu.price.toFixed(2) }}
          </li>
        </ul>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    middleware: 'auth',
    data() {
      return {
        totalMenuItems: 0,
        totalCategories: 0,
        recentMenu: []
      };
    },
    methods: {
      async fetchStatistics() {
        try {
          const [menuResponse, categoriesResponse] = await Promise.all([
            this.$axios.get('/api/menu'),
            this.$axios.get('/api/categories')
          ]);
  
          this.totalMenuItems = menuResponse.data.length;
          this.totalCategories = categoriesResponse.data.length;
          this.recentMenu = menuResponse.data.slice(-5).reverse(); // Tampilkan 5 menu terakhir
        } catch (error) {
          console.error('Error fetching statistics:', error);
          alert('Failed to load statistics.');
        }
      }
    },
    mounted() {
      this.fetchStatistics();
    }
  };
  </script>
  
  <style scoped>
  .card-header {
    font-size: 1.2rem;
  }
  .card-title {
    font-size: 2rem;
  }
  </style>
