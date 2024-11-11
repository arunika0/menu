<template>
    <div>
      <h2 class="mb-4">Manage Restaurants</h2>
  
      <!-- Form Tambah/Edit Restoran -->
      <div class="card p-4 mb-4">
        <h5>{{ isEditing ? 'Edit Restaurant' : 'Add New Restaurant' }}</h5>
        <form @submit.prevent="isEditing ? updateRestaurant() : addRestaurant()">
          <div class="form-group">
            <label>Name</label>
            <input type="text" v-model="restaurantForm.name" class="form-control" required />
          </div>
          <div class="form-group">
            <label>Address</label>
            <input type="text" v-model="restaurantForm.address" class="form-control" />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="restaurantForm.description" class="form-control"></textarea>
          </div>
          <div class="form-group">
            <label>Image</label>
            <input type="file" @change="onImageChange" class="form-control" />
          </div>
          <button type="submit" class="btn btn-primary mt-3">
            {{ isEditing ? 'Update Restaurant' : 'Add Restaurant' }}
          </button>
          <button v-if="isEditing" type="button" class="btn btn-secondary mt-3 ml-2" @click="cancelEdit">
            Cancel
          </button>
        </form>
      </div>
  
      <!-- Daftar Restoran -->
      <table class="table table-bordered">
        <thead>
          <tr>
            <th>Name</th>
            <th>Address</th>
            <th>Description</th>
            <th>Image</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="restaurant in restaurants" :key="restaurant.id">
            <td>{{ restaurant.name }}</td>
            <td>{{ restaurant.address }}</td>
            <td>{{ restaurant.description }}</td>
            <td>
              <img v-if="restaurant.image" :src="restaurant.image" alt="Restaurant Image" class="img-thumbnail" style="max-width: 100px;" />
              <span v-else>-</span>
            </td>
            <td>
              <button class="btn btn-warning btn-sm" @click="editRestaurant(restaurant)">Edit</button>
              <button class="btn btn-danger btn-sm" @click="deleteRestaurant(restaurant.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script>
  export default {
    layout: 'super-admin', // Pastikan layout super-admin digunakan
    data() {
      return {
        restaurants: [],
        restaurantForm: {
          id: null,
          name: '',
          address: '',
          description: '',
          image: ''
        },
        isEditing: false,
        selectedImage: null
      };
    },
    methods: {
      async fetchRestaurants() {
        try {
          const response = await this.$axios.get('/api/restaurants');
          this.restaurants = response.data;
        } catch (error) {
          console.error('Error fetching restaurants:', error);
          alert('Failed to load restaurants.');
        }
      },
      async addRestaurant() {
        try {
          const formData = new FormData();
          formData.append('name', this.restaurantForm.name);
          formData.append('address', this.restaurantForm.address);
          formData.append('description', this.restaurantForm.description);
          if (this.selectedImage) {
            formData.append('image', this.selectedImage);
          }
          const newRestaurant = await this.$axios.post('/api/restaurants', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          this.restaurants.push(newRestaurant.data);
          this.resetForm();
        } catch (error) {
          console.error('Error adding restaurant:', error);
          alert(error.response?.data?.message || 'Failed to add restaurant.');
        }
      },
      async editRestaurant(restaurant) {
        this.isEditing = true;
        this.restaurantForm = { ...restaurant };
      },
      async updateRestaurant() {
        try {
          const formData = new FormData();
          formData.append('name', this.restaurantForm.name);
          formData.append('address', this.restaurantForm.address);
          formData.append('description', this.restaurantForm.description);
          if (this.selectedImage) {
            formData.append('image', this.selectedImage);
          }
          const updatedRestaurant = await this.$axios.put(`/api/restaurants/${this.restaurantForm.id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          const index = this.restaurants.findIndex(r => r.id === this.restaurantForm.id);
          if (index !== -1) {
            this.$set(this.restaurants, index, updatedRestaurant.data);
          }
          this.resetForm();
        } catch (error) {
          console.error('Error updating restaurant:', error);
          alert(error.response?.data?.message || 'Failed to update restaurant.');
        }
      },
      async deleteRestaurant(id) {
        if (!confirm('Are you sure you want to delete this restaurant?')) return;
        try {
          await this.$axios.delete(`/api/restaurants/${id}`);
          this.restaurants = this.restaurants.filter(r => r.id !== id);
        } catch (error) {
          console.error('Error deleting restaurant:', error);
          alert(error.response?.data?.message || 'Failed to delete restaurant.');
        }
      },
      onImageChange(event) {
        this.selectedImage = event.target.files[0];
      },
      cancelEdit() {
        this.resetForm();
      },
      resetForm() {
        this.restaurantForm = {
          id: null,
          name: '',
          address: '',
          description: '',
          image: ''
        };
        this.isEditing = false;
        this.selectedImage = null;
      }
    },
    mounted() {
      this.fetchRestaurants();
    }
  };
  </script>
  
  <style scoped>
  .img-thumbnail {
    height: auto;
  }
  </style>
