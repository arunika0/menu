<template>
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
  </template>
  
  <script>
  export default {
    props: {
      restaurant: {
        type: Object,
        required: true
      }
    }
  };
  </script>
  
  <style scoped>
  .card-img-top {
    height: 200px;
    object-fit: cover;
  }
  </style>
  