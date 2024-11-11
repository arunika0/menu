<template>
    <div>
      <h2 class="mb-4">Manage Restaurant Admins</h2>
  
      <!-- Form Tambah/Edit Admin Restoran -->
      <div class="card p-4 mb-4">
        <h5>{{ isEditing ? 'Edit Admin' : 'Add New Admin' }}</h5>
        <form @submit.prevent="isEditing ? updateAdmin() : addAdmin()">
          <div class="form-group">
            <label>Username</label>
            <input type="text" v-model="adminForm.username" class="form-control" required />
          </div>
          <div class="form-group">
            <label>Password</label>
            <input
              type="password"
              v-model="adminForm.password"
              class="form-control"
              :required="!isEditing"
              :placeholder="isEditing ? 'Leave blank to keep current password' : 'Enter password'"
            />
          </div>
          <div class="form-group">
            <label>Restaurant</label>
            <select v-model="adminForm.restaurant_id" class="form-control" required>
              <option value="" disabled>Select Restaurant</option>
              <option v-for="restaurant in restaurants" :key="restaurant.id" :value="restaurant.id">
                {{ restaurant.name }}
              </option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary mt-3">
            {{ isEditing ? 'Update Admin' : 'Add Admin' }}
          </button>
          <button v-if="isEditing" type="button" class="btn btn-secondary mt-3 ml-2" @click="cancelEdit">
            Cancel
          </button>
        </form>
      </div>
  
      <!-- Daftar Admin Restoran -->
      <table class="table table-bordered">
        <thead>
          <tr>
            <th>Username</th>
            <th>Restaurant</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="admin in admins" :key="admin.id">
            <td>{{ admin.username }}</td>
            <td>{{ admin.restaurant_name }}</td>
            <td>
              <button class="btn btn-warning btn-sm" @click="editAdmin(admin)">Edit</button>
              <button class="btn btn-danger btn-sm" @click="deleteAdmin(admin.id)">Delete</button>
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
        admins: [],
        restaurants: [],
        adminForm: {
          id: null,
          username: '',
          password: '',
          restaurant_id: ''
        },
        isEditing: false
      };
    },
    methods: {
      async fetchAdmins() {
        try {
          const response = await this.$axios.get('/api/users');
          this.admins = response.data.filter(user => user.role === 'restaurant_admin');
        } catch (error) {
          console.error('Error fetching admins:', error);
          alert('Failed to load admins.');
        }
      },
      async fetchRestaurants() {
        try {
          const response = await this.$axios.get('/api/restaurants');
          this.restaurants = response.data;
        } catch (error) {
          console.error('Error fetching restaurants:', error);
          alert('Failed to load restaurants.');
        }
      },
      async addAdmin() {
        try {
          const payload = {
            username: this.adminForm.username,
            password: this.adminForm.password,
            role: 'restaurant_admin',
            restaurant_id: this.adminForm.restaurant_id
          };
          const newAdmin = await this.$axios.post('/api/users', payload);
          this.admins.push(newAdmin.data);
          this.resetForm();
        } catch (error) {
          console.error('Error adding admin:', error);
          alert(error.response?.data?.message || 'Failed to add admin.');
        }
      },
      async editAdmin(admin) {
        this.isEditing = true;
        this.adminForm = {
          id: admin.id,
          username: admin.username,
          password: '',
          restaurant_id: admin.restaurant_id
        };
      },
      async updateAdmin() {
        try {
          const payload = {
            username: this.adminForm.username,
            // Hanya kirim password jika diisi
            ...(this.adminForm.password && { password: this.adminForm.password }),
            restaurant_id: this.adminForm.restaurant_id
          };
          const updatedAdmin = await this.$axios.put(`/api/users/${this.adminForm.id}`, payload);
          const index = this.admins.findIndex(a => a.id === this.adminForm.id);
          if (index !== -1) {
            this.$set(this.admins, index, updatedAdmin.data);
          }
          this.resetForm();
        } catch (error) {
          console.error('Error updating admin:', error);
          alert(error.response?.data?.message || 'Failed to update admin.');
        }
      },
      async deleteAdmin(id) {
        if (!confirm('Are you sure you want to delete this admin?')) return;
        try {
          await this.$axios.delete(`/api/users/${id}`);
          this.admins = this.admins.filter(admin => admin.id !== id);
        } catch (error) {
          console.error('Error deleting admin:', error);
          alert(error.response?.data?.message || 'Failed to delete admin.');
        }
      },
      cancelEdit() {
        this.resetForm();
      },
      resetForm() {
        this.adminForm = {
          id: null,
          username: '',
          password: '',
          restaurant_id: ''
        };
        this.isEditing = false;
      }
    },
    mounted() {
      this.fetchAdmins();
      this.fetchRestaurants();
    }
  };
  </script>
  
  <style scoped>
  .img-thumbnail {
    height: auto;
  }
  </style>
  