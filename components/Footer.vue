<template>
    <footer class="text-center mt-5 mb-3">
      <p>&copy; {{ currentYear }} Menu Arxan. All rights reserved.</p>
    </footer>
  </template>
  
  <script>
  export default {
    computed: {
      currentYear() {
        return new Date().getFullYear();
      }
    }
  };
  </script>
  
  <style scoped>
  footer {
    color: #6c757d;
  }
  </style>
  