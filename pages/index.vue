<template>
  <div class="container py-5">
    <h2 class="text-center mb-4">Our Restaurants</h2>

    <!-- Daftar Restoran -->
    <div class="row">
      <div
        v-for="restaurant in restaurants"
        :key="restaurant.id"
        class="col-lg-4 col-md-6 mb-4"
      >
        <div class="card h-100 shadow-sm border-0 rounded-lg bg-white text-dark">
          <img
            :src="restaurant.image"
            class="card-img-top img-fluid rounded-top"
            :alt="restaurant.name"
          />
          <div class="card-body d-flex flex-column">
            <h5 class="card-title text-primary font-weight-bold">
              {{ restaurant.name }}
            </h5>
            <p class="card-text">{{ restaurant.description }}</p>
            <p class="card-text">
              <small class="text-muted">Address: {{ restaurant.address }}</small>
            </p>
            <nuxt-link :to="`/restaurants/${restaurant.id}`" class="btn btn-primary mt-auto">
              View Menu
            </nuxt-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      restaurants: []
    };
  },
  methods: {
    async fetchRestaurants() {
      try {
        const response = await this.$axios.get('/api/restaurants');
        this.restaurants = response.data;
      } catch (error) {
        console.error('Error fetching restaurants:', error);
        // Tampilkan pesan error kepada pengguna jika diperlukan
      }
    }
  },
  mounted() {
    this.fetchRestaurants();
  }
};
</script>

<style scoped>
.card-img-top {
  height: 200px;
  object-fit: cover;
}
</style>
