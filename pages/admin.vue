<template>
  <div class="container mt-5">
    <h2 class="text-center mb-4">Admin Dashboard</h2>

    <!-- Tombol Logout -->
    <div class="text-right mb-3">
      <button class="btn btn-danger" @click="logout">Logout</button>
    </div>

    <!-- Tab Navigation -->
    <ul class="nav nav-tabs mb-4">
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: activeTab === 'menu' }"
          href="#"
          @click.prevent="activeTab = 'menu'"
        >
          Manage Menu
        </a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: activeTab === 'categories' }"
          href="#"
          @click.prevent="activeTab = 'categories'"
        >
          Manage Categories
        </a>
      </li>
    </ul>

    <!-- Manage Menu Tab -->
    <div v-if="activeTab === 'menu'">
      <!-- Form untuk tambah/edit item menu -->
      <div class="card p-4 mb-4">
        <h5>{{ editingMenu ? 'Edit Menu Item' : 'Add New Menu Item' }}</h5>
        <form @submit.prevent="editingMenu ? updateMenuItem() : addMenuItem()">
          <div class="form-group">
            <label>Name</label>
            <input
              type="text"
              v-model="menuForm.name"
              class="form-control"
              required
            />
          </div>
          <div class="form-group">
            <label>Price</label>
            <input
              type="number"
              v-model.number="menuForm.price"
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
              v-model="menuForm.description"
              class="form-control"
              required
            />
          </div>
          <div class="form-group">
            <label>Image</label>
            <input
              type="file"
              @change="handleMenuImageUpload"
              class="form-control-file"
              accept="image/*"
              :disabled="menuIsUploading"
            />
            <div v-if="menuForm.image" class="mt-2">
              <img :src="menuForm.image" alt="Menu Image" class="img-thumbnail" style="max-width: 200px;">
            </div>
            <div v-if="menuIsUploading" class="mt-2">
              <span class="text-info">Uploading...</span>
            </div>
            <div v-if="menuUploadError" class="alert alert-danger mt-2">
              {{ menuUploadError }}
            </div>
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
          <button
            type="submit"
            class="btn btn-primary mt-3"
            :disabled="menuIsUploading"
          >
            {{ editingMenu ? 'Update' : 'Add' }} Menu Item
          </button>
          <button
            v-if="editingMenu"
            type="button"
            class="btn btn-secondary mt-3 ml-2"
            @click="resetMenuForm"
          >
            Cancel
          </button>
        </form>
      </div>

      <!-- List Menu Items dengan opsi edit/delete -->
      <table class="table table-bordered">
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Description</th>
            <th>Category</th>
            <th>Image</th>
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
              <img v-if="item.image" :src="item.image" alt="Menu Image" class="img-thumbnail" style="max-width: 100px;">
              <span v-else>-</span>
            </td>
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

    <!-- Manage Categories Tab -->
    <div v-if="activeTab === 'categories'">
      <!-- Form untuk tambah/edit kategori -->
      <div class="card p-4 mb-4">
        <h5>{{ editingCategory ? 'Edit Category' : 'Add New Category' }}</h5>
        <form @submit.prevent="editingCategory ? updateCategory() : addCategory()">
          <div class="form-group">
            <label>Name</label>
            <input
              type="text"
              v-model="categoryForm.name"
              class="form-control"
              required
            />
          </div>
          <button
            type="submit"
            class="btn btn-primary mt-3"
          >
            {{ editingCategory ? 'Update' : 'Add' }} Category
          </button>
          <button
            v-if="editingCategory"
            type="button"
            class="btn btn-secondary mt-3 ml-2"
            @click="resetCategoryForm"
          >
            Cancel
          </button>
        </form>
      </div>

      <!-- List Categories dengan opsi edit/delete -->
      <table class="table table-bordered">
        <thead>
          <tr>
            <th>Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="category in categories" :key="category.id">
            <td>{{ category.name }}</td>
            <td>
              <button
                class="btn btn-warning btn-sm"
                @click="editCategory(category)"
              >
                Edit
              </button>
              <button
                class="btn btn-danger btn-sm"
                @click="deleteCategory(category.id)"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  middleware: 'auth', // Terapkan middleware auth
  data() {
    return {
      activeTab: 'menu', // 'menu' atau 'categories'
      // Data Menu
      menuItems: [],
      categories: [],
      menuForm: {
        name: '',
        price: 0,
        description: '',
        image: '',
        category_id: ''
      },
      editingMenu: null,
      menuIsUploading: false,
      menuUploadError: '',
      // Data Categories
      categoryForm: {
        name: ''
      },
      editingCategory: null
    };
  },
  methods: {
    // --- Methods for Menu ---
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
        const response = await this.$axios.post('/menu', this.menuForm);
        this.menuItems.push(response.data);
        this.resetMenuForm();
      } catch (error) {
        console.error('Error adding menu item:', error);
      }
    },
    editMenuItem(item) {
      this.menuForm = { ...item };
      this.editingMenu = item;
    },
    async updateMenuItem() {
      try {
        const response = await this.$axios.put(`/menu/${this.editingMenu.id}`, this.menuForm);
        const index = this.menuItems.findIndex(item => item.id === this.editingMenu.id);
        if (index !== -1) {
          this.menuItems.splice(index, 1, response.data);
        }
        this.resetMenuForm();
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
    resetMenuForm() {
      this.menuForm = {
        name: '',
        price: 0,
        description: '',
        image: '',
        category_id: ''
      };
      this.editingMenu = null;
      this.menuUploadError = '';
    },
    async handleMenuImageUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      this.menuIsUploading = true;
      this.menuUploadError = '';

      const formData = new FormData();
      formData.append('image', file);

      try {
        const response = await this.$axios.post('/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        this.menuForm.image = response.data.imageUrl;
      } catch (error) {
        console.error('Error uploading image:', error);
        this.menuUploadError = 'Failed to upload image. Please try again.';
      } finally {
        this.menuIsUploading = false;
      }
    },

    // --- Methods for Categories ---
    async addCategory() {
      try {
        const response = await this.$axios.post('/categories', this.categoryForm);
        this.categories.push(response.data);
        this.resetCategoryForm();
      } catch (error) {
        console.error('Error adding category:', error);
        alert(error.response?.data?.message || 'Failed to add category.');
      }
    },
    editCategory(category) {
      this.categoryForm = { ...category };
      this.editingCategory = category;
    },
    async updateCategory() {
      try {
        const response = await this.$axios.put(`/categories/${this.editingCategory.id}`, this.categoryForm);
        const index = this.categories.findIndex(cat => cat.id === this.editingCategory.id);
        if (index !== -1) {
          this.categories.splice(index, 1, response.data);
        }
        this.resetCategoryForm();
      } catch (error) {
        console.error('Error updating category:', error);
        alert(error.response?.data?.message || 'Failed to update category.');
      }
    },
    async deleteCategory(id) {
      if (!confirm('Are you sure you want to delete this category?')) {
        return;
      }
      try {
        await this.$axios.delete(`/categories/${id}`);
        this.categories = this.categories.filter(cat => cat.id !== id);
      } catch (error) {
        console.error('Error deleting category:', error);
        alert(error.response?.data?.message || 'Failed to delete category.');
      }
    },
    resetCategoryForm() {
      this.categoryForm = {
        name: ''
      };
      this.editingCategory = null;
    },

    // --- General Methods ---
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

.img-thumbnail {
  height: auto;
}
</style>
