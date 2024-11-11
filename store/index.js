// store/index.js

export const state = () => ({
    user: {
      token: null,
      role: null,
      restaurant_id: null
    }
  });
  
  export const mutations = {
    /**
     * Menetapkan data pengguna di store.
     * @param {Object} state - Vuex state
     * @param {Object} payload - { token, role, restaurant_id }
     */
    setUser(state, payload) {
      state.user.token = payload.token;
      state.user.role = payload.role;
      state.user.restaurant_id = payload.restaurant_id;
    },
  
    /**
     * Membersihkan data pengguna dari store.
     * @param {Object} state - Vuex state
     */
    clearUser(state) {
      state.user.token = null;
      state.user.role = null;
      state.user.restaurant_id = null;
    }
  };
  
  export const actions = {
    /**
     * Melakukan login dengan menetapkan data pengguna.
     * @param {Function} commit - Vuex commit function
     * @param {Object} payload - { token, role, restaurant_id }
     */
    login({ commit }, payload) {
      commit('setUser', payload);
    },
  
    /**
     * Melakukan logout dengan membersihkan data pengguna.
     * @param {Function} commit - Vuex commit function
     */
    logout({ commit }) {
      commit('clearUser');
    }
  };
  
  export const getters = {
    /**
     * Mengembalikan status autentikasi pengguna.
     * @param {Object} state - Vuex state
     * @returns {Boolean}
     */
    isAuthenticated(state) {
      return !!state.user.token;
    },
  
    /**
     * Mengembalikan peran pengguna.
     * @param {Object} state - Vuex state
     * @returns {String|null}
     */
    userRole(state) {
      return state.user.role;
    },
  
    /**
     * Mengembalikan ID restoran yang terkait dengan pengguna.
     * @param {Object} state - Vuex state
     * @returns {Number|null}
     */
    userRestaurantId(state) {
      return state.user.restaurant_id;
    }
  };
  