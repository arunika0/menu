<template>
    <div>
      <h2 class="mb-4">Super Admin Dashboard</h2>
  
      <div class="row">
        <div class="col-md-4">
          <div class="card text-white bg-primary mb-3">
            <div class="card-header">Total Restaurants</div>
            <div class="card-body">
              <h5 class="card-title">{{ totalRestaurants }}</h5>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card text-white bg-success mb-3">
            <div class="card-header">Total Admins</div>
            <div class="card-body">
              <h5 class="card-title">{{ totalAdmins }}</h5>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card text-white bg-info mb-3">
            <div class="card-header">Total Menu Items</div>
            <div class="card-body">
              <h5 class="card-title">{{ totalMenuItems }}</h5>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Additional Dashboard Content -->
      <div class="mt-5">
        <h4>Recent Activities</h4>
        <!-- Implementasikan jika diperlukan -->
        <p>No recent activities.</p>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    layout: 'super-admin', // Pastikan layout super-admin digunakan
    data() {
      return {
        totalRestaurants: 0,
        totalAdmins: 0,
        totalMenuItems: 0
      };
    },
    methods: {
      async fetchStatistics() {
        try {
          const [restaurantsResponse, adminsResponse, menuResponse] = await Promise.all([
            this.$axios.get('/api/restaurants'),
            this.$axios.get('/api/users'),
            this.$axios.get('/api/menu')
          ]);
  
          this.totalRestaurants = restaurantsResponse.data.length;
          this.totalAdmins = adminsResponse.data.filter(user => user.role === 'restaurant_admin').length;
          this.totalMenuItems = menuResponse.data.length;
        } catch (error) {
          console.error('Error fetching statistics:', error);
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
  