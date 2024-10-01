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
      <div v-for="item in filteredMenu" :key="item.name" class="col-md-6 mb-4">
        <div class="card">
          <img :src="item.image" class="card-img-top" :alt="item.name">
          <div class="card-body">
            <h5 class="card-title">{{ item.name }} <span class="float-right">${{ item.price }}</span></h5>
            <p class="card-text">{{ item.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const menuItems = ref([]);
const filteredMenu = ref([]);

// Mengambil data dari backend API Express
const fetchMenu = async () => {
  const response = await fetch('http://localhost:3001/api/menu');
  const data = await response.json();
  menuItems.value = data;
  filteredMenu.value = data;
};

// Filter menu berdasarkan kategori
const filterMenu = (category) => {
  if (category === 'all') {
    filteredMenu.value = menuItems.value;
  } else {
    filteredMenu.value = menuItems.value.filter(item => item.category === category);
  }
};

// Mengambil data saat komponen dimuat
onMounted(() => {
  fetchMenu();
});
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
