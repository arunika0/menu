<template>
    <div class="card h-100 shadow-sm border-0 rounded-lg bg-white text-dark">
      <img
        :src="menuItem.image"
        class="card-img-top img-fluid rounded-top"
        :alt="menuItem.name"
      />
      <div class="card-body d-flex flex-column">
        <h5 class="card-title text-primary font-weight-bold">
          {{ menuItem.name }}
          <span class="float-right text-dark font-weight-bold">
            Rp{{ parseFloat(menuItem.price).toFixed(2) }}
          </span>
        </h5>
        <p class="card-text">{{ menuItem.description }}</p>
        <p class="card-text mt-auto">
          <small class="text-muted">Category: {{ menuItem.category_name }}</small>
        </p>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      menuItem: {
        type: Object,
        required: true
      }
    }
  };
  </script>
  
  <style scoped>
  .card-img-top {
    height: 250px;
    object-fit: cover;
  }
  </style>
  