<template>
  <div>
    <h2 class="mb-4">Manage Categories</h2>

    <!-- Form Tambah/Edit Kategori -->
    <div class="card p-4 mb-4">
      <h5>{{ isEditing ? 'Edit Category' : 'Add New Category' }}</h5>
      <form @submit.prevent="isEditing ? updateCategory() : addCategory()">
        <div class="form-group">
          <label>Name</label>
          <input type="text" v-model="categoryForm.name" class="form-control" required />
        </div>
        <button type="submit" class="btn btn-primary mt-3">
          {{ isEditing ? 'Update Category' : 'Add Category' }}
        </button>
        <button v-if="isEditing" type="button" class="btn btn-secondary mt-3 ml-2" @click="cancelEdit">
          Cancel
        </button>
      </form>
    </div>

    <!-- Daftar Kategori -->
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
            <button class="btn btn-warning btn-sm" @click="editCategory(category)">Edit</button>
            <button class="btn btn-danger btn-sm" @click="deleteCategory(category.id)">Delete</button>
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
      categories: [],
      categoryForm: {
        id: null,
        name: ''
      },
      isEditing: false
    };
  },
  methods: {
    async fetchCategories() {
      try {
        const response = await this.$axios.get('/api/categories');
        this.categories = response.data;
      } catch (error) {
        console.error('Error fetching categories:', error);
        alert('Failed to load categories.');
      }
    },
    async addCategory() {
      try {
        const newCategory = await this.$axios.post('/api/categories', {
          name: this.categoryForm.name
        });
        this.categories.push(newCategory.data);
        this.resetForm();
      } catch (error) {
        console.error('Error adding category:', error);
        alert(error.response?.data?.message || 'Failed to add category.');
      }
    },
    async editCategory(category) {
      this.isEditing = true;
      this.categoryForm = { id: category.id, name: category.name };
    },
    async updateCategory() {
      try {
        const updatedCategory = await this.$axios.put(`/api/categories/${this.categoryForm.id}`, {
          name: this.categoryForm.name
        });
        const index = this.categories.findIndex(c => c.id === this.categoryForm.id);
        if (index !== -1) {
          this.$set(this.categories, index, updatedCategory.data);
        }
        this.resetForm();
      } catch (error) {
        console.error('Error updating category:', error);
        alert(error.response?.data?.message || 'Failed to update category.');
      }
    },
    async deleteCategory(id) {
      if (!confirm('Are you sure you want to delete this category?')) return;
      try {
        await this.$axios.delete(`/api/categories/${id}`);
        this.categories = this.categories.filter(category => category.id !== id);
      } catch (error) {
        console.error('Error deleting category:', error);
        alert(error.response?.data?.message || 'Failed to delete category.');
      }
    },
    cancelEdit() {
      this.resetForm();
    },
    resetForm() {
      this.categoryForm = {
        id: null,
        name: ''
      };
      this.isEditing = false;
    }
  },
  mounted() {
    this.fetchCategories();
  }
};
</script>

<style scoped>
/* Styling khusus untuk kategori */
</style>
