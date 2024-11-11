<template>
    <div class="container py-5">
      <h2 class="text-center mb-4">{{ restaurant.name }}'s Menu</h2>
  
      <!-- Filter Buttons -->
      <div class="d-flex justify-content-center mb-5">
        <div class="btn-group" role="group">
          <button
            class="btn btn-sky btn-sm"
            :class="{ active: selectedCategory === 'all' }"
            @click="filterMenu('all')"
          >
            All
          </button>
          <button
            v-for="category in categories"
            :key="category.id"
            class="btn btn-sky btn-sm"
            :class="{ active: selectedCategory === category.id }"
            @click="filterMenu(category.id)"
          >
            {{ category.name }}
          </button>
        </div>
      </div>
  
      <!-- Menu Items -->
      <div class="row">
        <div
          v-for="item in filteredMenu"
          :key="item.id"
          class="col-lg-4 col-md-6 mb-4 d-flex align-items-stretch"
        >
          <div class="card h-100 shadow-sm border-0 rounded-lg bg-white text-dark">
            <img
              :src="item.image"
              class="card-img-top img-fluid rounded-top"
              :alt="item.name"
            />
            <div class="card-body d-flex flex-column">
              <h5 class="card-title text-primary font-weight-bold">
                {{ item.name }}
                <span class="float-right text-dark font-weight-bold">
                  Rp{{ parseFloat(item.price).toFixed(2) }}
                </span>
              </h5>
              <p class="card-text">{{ item.description }}</p>
              <p class="card-text mt-auto">
                <small class="text-muted">Category: {{ item.category_name }}</small>
              </p>
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
        restaurant: {},
        menuItems: [],
        filteredMenu: [],
        categories: [],
        selectedCategory: 'all'
      };
    },
    methods: {
      async fetchRestaurant() {
        const id = this.$route.params.id;
        try {
          const response = await this.$axios.get(`/api/restaurants/${id}`);
          this.restaurant = response.data;
        } catch (error) {
          console.error('Error fetching restaurant:', error);
          alert('Failed to load restaurant details.');
          this.$router.push('/');
        }
      },
      async fetchMenu() {
        const id = this.$route.params.id;
        try {
          const response = await this.$axios.get(`/api/menu?restaurant_id=${id}`);
          this.menuItems = response.data;
          this.filteredMenu = this.menuItems;
        } catch (error) {
          console.error('Error fetching menu:', error);
          alert('Failed to load menu.');
        }
      },
      async fetchCategories() {
        const id = this.$route.params.id;
        try {
          const response = await this.$axios.get(`/api/categories?restaurant_id=${id}`);
          this.categories = response.data;
        } catch (error) {
          console.error('Error fetching categories:', error);
          alert('Failed to load categories.');
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
    async mounted() {
      await this.fetchRestaurant();
      await this.fetchMenu();
      await this.fetchCategories();
    }
  };
  </script>
  
  <style scoped>
  .card-img-top {
    height: 250px;
    object-fit: cover;
  }
  .btn-sky {
    background-color: #17a2b8;
    color: white;
  }
  .btn-sky.active {
    background-color: #138496;
  }
  </style>
  