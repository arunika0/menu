<template>
  <div class="container mt-5">
    <h2 class="text-center mb-4">Our Menu</h2>

    <!-- Filter Buttons -->
    <div class="text-center mb-4">
      <button class="btn btn-outline-primary mr-2" :class="{ active: selectedCategory === 'all' }" @click="filterMenu('all')">All</button>
      <button v-for="category in categories" :key="category.id" class="btn btn-outline-primary mr-2" :class="{ active: selectedCategory === category.id }" @click="filterMenu(category.id)">
        {{ category.name }}
      </button>
    </div>

    <!-- Menu Items -->
    <div class="row">
      <div v-for="item in filteredMenu" :key="item.id" class="col-md-6 mb-4">
        <div class="card">
          <img :src="item.image" class="card-img-top" :alt="item.name" />
          <div class="card-body">
            <h5 class="card-title">
              {{ item.name }}
              <span class="float-right">Rp{{ parseFloat(item.price).toFixed(2) }}</span>
            </h5>
            <p class="card-text">{{ item.description }}</p>
            <p class="card-text"><small class="text-muted">Category: {{ item.category_name }}</small></p>
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
      filteredMenu: [],
      categories: [],
      selectedCategory: 'all'
    };
  },
  methods: {
    async fetchMenu() {
      try {
        const response = await this.$axios.get('/menu');
        this.menuItems = response.data;
        this.filteredMenu = this.menuItems;
      } catch (error) {
        console.error('Error fetching menu:', error);
      }
    },
    async fetchCategories() {
      try {
        const response = await this.$axios.get('/categories');
        this.categories = response.data;
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    },
    filterMenu(categoryId) {
      this.selectedCategory = categoryId;
      if (categoryId === 'all') {
        this.filteredMenu = this.menuItems;
      } else {
        this.filteredMenu = this.menuItems.filter(item => item.category_id === categoryId);
      }
    }
  },
  mounted() {
    this.fetchMenu();
    this.fetchCategories();
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

.btn.active {
  background-color: #007bff;
  color: white;
}
</style>
