<template>
    <div>
      <h2 class="mb-4">Manage Menu</h2>
  
      <!-- Form Tambah/Edit Menu -->
      <div class="card p-4 mb-4">
        <h5>{{ isEditing ? 'Edit Menu Item' : 'Add New Menu Item' }}</h5>
        <form @submit.prevent="isEditing ? updateMenu() : addMenu()" enctype="multipart/form-data">
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
            <textarea v-model="menuForm.description" class="form-control"></textarea>
          </div>
          <div class="form-group">
            <label>Image</label>
            <input type="file" @change="handleImageUpload" class="form-control" accept="image/*" />
          </div>
          <div class="form-group">
            <label>Category</label>
            <select v-model="menuForm.category_id" class="form-control" required>
              <option value="" disabled>Select Category</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary mt-3">
            {{ isEditing ? 'Update Menu Item' : 'Add Menu Item' }}
          </button>
          <button v-if="isEditing" type="button" class="btn btn-secondary mt-3 ml-2" @click="cancelEdit">
            Cancel
          </button>
        </form>
      </div>
  
      <!-- Daftar Menu -->
      <table class="table table-bordered">
        <thead>
          <tr>
            <th>Name</th>
            <th>Price (Rp)</th>
            <th>Description</th>
            <th>Image</th>
            <th>Category</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="menu in menuItems" :key="menu.id">
            <td>{{ menu.name }}</td>
            <td>{{ Number(menu.price).toFixed(2) }}</td>
            <td>{{ menu.description }}</td>
            <td>
              <img v-if="menu.image" :src="menu.image" alt="Menu Image" class="img-thumbnail" style="max-width: 100px;" />
              <span v-else>-</span>
            </td>
            <td>{{ menu.category_name }}</td>
            <td>
              <button class="btn btn-warning btn-sm" @click="editMenu(menu)">Edit</button>
              <button class="btn btn-danger btn-sm" @click="deleteMenu(menu.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        menuItems: [],
        categories: [],
        menuForm: {
          id: null,
          name: '',
          price: '',
          description: '',
          image: null, // Change from empty string to null
          category_id: ''
        },
        isEditing: false
      };
    },
    methods: {
      async fetchMenu() {
        try {
          const response = await this.$axios.get('/api/menu');
          this.menuItems = response.data;
        } catch (error) {
          console.error('Error fetching menu items:', error);
        }
      },
      async fetchCategories() {
        try {
          const response = await this.$axios.get('/api/categories');
          this.categories = response.data;
        } catch (error) {
          console.error('Error fetching categories:', error);
        }
      },
      async addMenu() {
        try {
          const formData = new FormData();
          formData.append('name', this.menuForm.name);
          formData.append('price', Number(this.menuForm.price));
          formData.append('description', this.menuForm.description);
          formData.append('category_id', this.menuForm.category_id);
          if (this.menuForm.image) {
            formData.append('image', this.menuForm.image);
          }
  
          const newMenu = await this.$axios.post('/api/menu', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          this.menuItems.push(newMenu.data);
          this.resetForm();
        } catch (error) {
          console.error('Error adding menu item:', error);
          alert(error.response?.data?.message || 'Failed to add menu item.');
        }
      },
      async editMenu(menu) {
        this.isEditing = true;
        this.menuForm = {
          ...menu,
          image: null // Reset image to null when editing
        };
      },
      async updateMenu() {
        try {
          const formData = new FormData();
          formData.append('name', this.menuForm.name);
          formData.append('price', Number(this.menuForm.price));
          formData.append('description', this.menuForm.description);
          formData.append('category_id', this.menuForm.category_id);
          if (this.menuForm.image instanceof File) {
            formData.append('image', this.menuForm.image);
          }
  
          const updatedMenu = await this.$axios.put(`/api/menu/${this.menuForm.id}`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          const index = this.menuItems.findIndex(m => m.id === this.menuForm.id);
          if (index !== -1) {
            this.$set(this.menuItems, index, updatedMenu.data);
          }
          this.resetForm();
        } catch (error) {
          console.error('Error updating menu item:', error);
          alert(error.response?.data?.message || 'Failed to update menu item.');
        }
      },
      handleImageUpload(event) {
        this.menuForm.image = event.target.files[0];
      },
      async deleteMenu(id) {
        if (!confirm('Are you sure you want to delete this menu item?')) return;
        try {
          await this.$axios.delete(`/api/menu/${id}`);
          this.menuItems = this.menuItems.filter(menu => menu.id !== id);
        } catch (error) {
          console.error('Error deleting menu item:', error);
          alert(error.response?.data?.message || 'Failed to delete menu item.');
        }
      },
      cancelEdit() {
        this.resetForm();
      },
      resetForm() {
        this.menuForm = {
          id: null,
          name: '',
          price: '',
          description: '',
          image: null,
          category_id: ''
        };
        this.isEditing = false;
      }
    },
    mounted() {
      this.fetchMenu();
      this.fetchCategories();
    }
  };
  </script>
  
  <style scoped>
  .img-thumbnail {
    height: auto;
  }
  </style>
