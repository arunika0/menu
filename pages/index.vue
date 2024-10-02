<!-- pages/index.vue -->

<template>
  <div class="container mt-5">
    <h2 class="text-center mb-4">Our Menu</h2>

    <!-- Filter Buttons -->
    <div class="text-center mb-4">
      <button class="btn btn-outline-primary" @click="filterMenu('all')">All</button>
      <button class="btn btn-outline-primary" @click="filterMenu('breakfast')">Breakfast</button>
      <button class="btn btn-outline-primary" @click="filterMenu('lunch')">Lunch</button>
      <button class="btn btn-outline-primary" @click="filterMenu('shakes')">Shakes</button>
    </div>

    <!-- Menu Items -->
    <div class="row">
      <div v-for="item in filteredMenu" :key="item.id" class="col-md-6 mb-4">
        <div class="card">
          <img :src="item.image" class="card-img-top" :alt="item.name" />
          <div class="card-body">
            <h5 class="card-title">
              {{ item.name }}
              <span class="float-right">Rp{{ item.price.toFixed(2) }}</span>
            </h5>
            <p class="card-text">{{ item.description }}</p>
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
      menuItems: [],
      filteredMenu: []
    };
  },
  methods: {
    async fetchMenu() {
      try {
        const response = await this.$axios.get('/menu');
        this.menuItems = response.data;
        this.filteredMenu = response.data;
      } catch (error) {
        console.error('Error fetching menu:', error);
      }
    },
    filterMenu(category) {
      if (category === 'all') {
        this.filteredMenu = this.menuItems;
      } else {
        this.filteredMenu = this.menuItems.filter(item => item.category === category);
      }
    }
  },
  mounted() {
    this.fetchMenu();
  }
};
</script>

<style scoped>
.card {
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.card-img-top {
  height: 200px;
  object-fit: cover;
}
</style>
