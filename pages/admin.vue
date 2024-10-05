<template>
  <div class="container mt-5">
    <h2 class="text-center mb-4">Admin Menu Management</h2>

    <!-- Tombol Logout -->
    <div class="text-right mb-3">
      <button class="btn btn-danger" @click="logout">Logout</button>
    </div>

    <!-- Form untuk tambah/edit item menu -->
    <div class="card p-4 mb-4">
      <h5>{{ editingItem ? 'Edit Menu Item' : 'Add New Menu Item' }}</h5>
      <form @submit.prevent="editingItem ? updateMenuItem() : addMenuItem()">
        <div class="form-group">
          <label>Name</label>
          <input
            type="text"
            v-model="form.name"
            class="form-control"
            required
          />
        </div>
        <div class="form-group">
          <label>Price</label>
          <input
            type="number"
            v-model.number="form.price"
            class="form-control"
            required
            min="0"
            step="0.01"
          />
        </div>
        <div class="form-group">
          <label>Description</label>
          <input
            type="text"
            v-model="form.description"
            class="form-control"
            required
          />
        </div>
        <div class="form-group">
          <label>Image URL</label>
          <input
            type="url"
            v-model="form.image"
            class="form-control"
          />
        </div>
        <div class="form-group">
          <label>Category</label>
          <select v-model="form.category_id" class="form-control" required>
            <option value="" disabled>Select Category</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </div>
        <button
          type="submit"
          class="btn btn-primary mt-3"
        >
          {{ editingItem ? 'Update' : 'Add' }} Menu Item
        </button>
        <button
          v-if="editingItem"
          type="button"
          class="btn btn-secondary mt-3 ml-2"
          @click="resetForm"
        >
          Cancel
        </button>
      </form>
    </div>

    <!-- List Menu Items dengan opsi edit/delete -->
    <table class="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Price</th>
          <th>Description</th>
          <th>Category</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in menuItems" :key="item.id">
          <td>{{ item.name }}</td>
          <td>Rp{{ parseFloat(item.price).toFixed(2) }}</td>
          <td>{{ item.description }}</td>
          <td>{{ item.category_name }}</td>
          <td>
            <button
              class="btn btn-warning btn-sm"
              @click="editMenuItem(item)"
            >
              Edit
            </button>
            <button
              class="btn btn-danger btn-sm"
              @click="deleteMenuItem(item.id)"
            >
              Delete
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  middleware: 'auth', // Terapkan middleware auth
  data() {
    return {
      menuItems: [],
      categories: [],
      form: {
        name: '',
        price: 0,
        description: '',
        image: '',
        category_id: ''
      },
      editingItem: null
    };
  },
  methods: {
    async fetchMenu() {
      try {
        const response = await this.$axios.get('/menu');
        this.menuItems = response.data;
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
    async addMenuItem() {
      try {
        const response = await this.$axios.post('/menu', this.form);
        this.menuItems.push(response.data);
        this.resetForm();
      } catch (error) {
        console.error('Error adding menu item:', error);
      }
    },
    editMenuItem(item) {
      this.form = { ...item };
      this.editingItem = item;
    },
    async updateMenuItem() {
      try {
        const response = await this.$axios.put(`/menu/${this.editingItem.id}`, this.form);
        const index = this.menuItems.findIndex(item => item.id === this.editingItem.id);
        if (index !== -1) {
          this.menuItems.splice(index, 1, response.data);
        }
        this.resetForm();
      } catch (error) {
        console.error('Error updating menu item:', error);
      }
    },
    async deleteMenuItem(id) {
      if (!confirm('Are you sure you want to delete this menu item?')) {
        return;
      }
      try {
        await this.$axios.delete(`/menu/${id}`);
        this.menuItems = this.menuItems.filter(item => item.id !== id);
      } catch (error) {
        console.error('Error deleting menu item:', error);
      }
    },
    resetForm() {
      this.form = {
        name: '',
        price: 0,
        description: '',
        image: '',
        category_id: ''
      };
      this.editingItem = null;
    },
    logout() {
      // Hapus token dari localStorage
      localStorage.removeItem('token');

      // Reset token di Axios
      this.$axios.setToken(false);

      // Redirect ke halaman login
      this.$router.push('/login');
    }
  },
  mounted() {
    this.fetchMenu();
    this.fetchCategories();
  }
};
</script>

<style scoped>
.table th,
.table td {
  vertical-align: middle;
}

.btn-sm {
  margin-right: 5px;
}

.ml-2 {
  margin-left: 0.5rem;
}
</style>
