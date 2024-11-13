<template>
    <div>
      <h2 class="mb-4">Manage All Restaurant Menus</h2>
  
      <!-- Filter by Restaurant -->
      <div class="mb-4">
        <label>Filter by Restaurant:</label>
        <select v-model="selectedRestaurant" class="form-control w-auto">
          <option value="">All Restaurants</option>
          <option v-for="restaurant in restaurants" :key="restaurant.id" :value="restaurant.id">
            {{ restaurant.name }}
          </option>
        </select>
      </div>
  
      <!-- Form Add/Edit Menu -->
      <div class="card p-4 mb-4">
        <h5>{{ isEditing ? 'Edit Menu Item' : 'Add New Menu Item' }}</h5>
        <form @submit.prevent="isEditing ? updateMenuItem() : addMenuItem()">
          <div class="form-group">
            <label>Restaurant</label>
            <select v-model="menuForm.restaurant_id" class="form-control" required>
              <option value="" disabled>Select Restaurant</option>
              <option v-for="restaurant in restaurants" :key="restaurant.id" :value="restaurant.id">
                {{ restaurant.name }}
              </option>
            </select>
          </div>
  
          <div class="form-group">
            <label>Category</label>
            <select v-model="menuForm.category_id" class="form-control" required>
              <option value="" disabled>Select Category</option>
              <option v-for="category in filteredCategories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Name</label>
            <input type="text" v-model="menuForm.name" class="form-control" required />
          </div>
          <div class="form-group">
            <label>Price</label>
            <input type="number" v-model="menuForm.price" class="form-control" required min="0" step="0.01" />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="menuForm.description" class="form-control" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>Image</label>
            <input type="file" @change="handleImageUpload" class="form-control" accept="image/*" />
          </div>
          <button type="submit" class="btn btn-primary mt-3">
            {{ isEditing ? 'Update Menu Item' : 'Add Menu Item' }}
          </button>
          <button v-if="isEditing" type="button" class="btn btn-secondary mt-3 ml-2" @click="cancelEdit">
            Cancel
          </button>
        </form>
      </div>
  
      <!-- Menu Items Table -->
      <div class="table-responsive">
        <table class="table table-bordered">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Restaurant</th>
              <th>Category</th>
              <th>Price</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredMenuItems" :key="item.id">
              <td>
                <img v-if="item.image" :src="item.image" style="height: 50px; width: 50px; object-fit: cover;" />
              </td>
              <td>{{ item.name }}</td>
              <td>{{ item.restaurant_name }}</td>
              <td>{{ item.category_name }}</td>
              <td>{{ formatPrice(item.price) }}</td>
              <td>{{ item.description }}</td>
              <td>
                <button class="btn btn-warning btn-sm" @click="editMenuItem(item)">Edit</button>
                <button class="btn btn-danger btn-sm ml-1" @click="deleteMenuItem(item.id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    layout: 'super-admin',
    data() {
      return {
        menuItems: [],
        restaurants: [],
        categories: [],
        selectedRestaurant: '',
        menuForm: {
          id: null,
          name: '',
          price: '',
          description: '',
          image: null,
          restaurant_id: '',
          category_id: ''
        },
        isEditing: false
      }
    },
    computed: {
      filteredMenuItems() {
        if (!this.selectedRestaurant) return this.menuItems;
        return this.menuItems.filter(item => item.restaurant_id === this.selectedRestaurant);
      },
      filteredCategories() {
        if (!this.menuForm.restaurant_id) return [];
        return this.categories.filter(cat => cat.restaurant_id === this.menuForm.restaurant_id);
      }
    },
    methods: {
      formatPrice(price) {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(price);
      },
      async fetchMenuItems() {
        try {
          const response = await this.$axios.get('/api/menu');
          this.menuItems = response.data;
        } catch (error) {
          console.error('Error fetching menu items:', error);
          this.$toast.error('Failed to load menu items');
        }
      },
      async fetchRestaurants() {
        try {
          const response = await this.$axios.get('/api/restaurants');
          this.restaurants = response.data;
        } catch (error) {
          console.error('Error fetching restaurants:', error);
          this.$toast.error('Failed to load restaurants');
        }
      },
      async fetchCategories() {
        try {
          const response = await this.$axios.get('/api/categories');
          this.categories = response.data;
        } catch (error) {
          console.error('Error fetching categories:', error);
          this.$toast.error('Failed to load categories');
        }
      },
      handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
          this.menuForm.image = file;
        }
      },
      async addMenuItem() {
        try {
          const formData = new FormData();
          formData.append('name', this.menuForm.name);
          formData.append('price', this.menuForm.price);
          formData.append('description', this.menuForm.description);
          formData.append('restaurant_id', this.menuForm.restaurant_id);
          formData.append('category_id', this.menuForm.category_id);
          if (this.menuForm.image instanceof File) {
            formData.append('image', this.menuForm.image);
          }
  
          const response = await this.$axios.post('/api/menu', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          this.menuItems.push(response.data);
          this.resetForm();
          this.$toast.success('Menu item added successfully');
        } catch (error) {
          console.error('Error adding menu item:', error);
          this.$toast.error(error.response?.data?.message || 'Failed to add menu item');
        }
      },
      async updateMenuItem() {
        try {
          const formData = new FormData();
          formData.append('name', this.menuForm.name);
          formData.append('price', this.menuForm.price);
          formData.append('description', this.menuForm.description);
          formData.append('restaurant_id', this.menuForm.restaurant_id);
          formData.append('category_id', this.menuForm.category_id);
          if (this.menuForm.image instanceof File) {
            formData.append('image', this.menuForm.image);
          }
  
          const response = await this.$axios.put(`/api/menu/${this.menuForm.id}`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          const index = this.menuItems.findIndex(item => item.id === this.menuForm.id);
          if (index !== -1) {
            this.$set(this.menuItems, index, response.data);
          }
          this.resetForm();
          this.$toast.success('Menu item updated successfully');
        } catch (error) {
          console.error('Error updating menu item:', error);
          this.$toast.error(error.response?.data?.message || 'Failed to update menu item');
        }
      },
      editMenuItem(item) {
        this.isEditing = true;
        this.menuForm = { ...item };
      },
      async deleteMenuItem(id) {
        if (!confirm('Are you sure you want to delete this menu item?')) return;
  
        try {
          await this.$axios.delete(`/api/menu/${id}`);
          this.menuItems = this.menuItems.filter(item => item.id !== id);
          alert('Menu item deleted successfully');
        } catch (error) {
          console.error('Error deleting menu item:', error);
          alert('Failed to delete menu item');
        }
      },
      resetForm() {
        this.menuForm = {
          id: null,
          name: '',
          price: '',
          description: '',
          image: null,
          restaurant_id: '',
          category_id: ''
        };
        this.isEditing = false;
      },
      cancelEdit() {
        this.resetForm();
      }
    },
    mounted() {
      this.fetchMenuItems();
      this.fetchRestaurants();
      this.fetchCategories();
    },
    watch: {
      'menuForm.restaurant_id'() {
        this.menuForm.category_id = '';
      }
    }
  }
  </script>
  
  <style scoped>
  .ml-1 {
    margin-left: 0.25rem;
  }
  .ml-2 {
    margin-left: 0.5rem;
  }
  </style>