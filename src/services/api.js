import axios from 'axios';

// Get API URL from runtime config (config.js) - this allows changing URL without rebuilding
// Falls back to build-time env variable only if runtime config is not defined
const getApiBaseUrl = () => {
  // Check if runtime config exists and has API_URL defined (even if empty string)
  if (typeof window !== 'undefined' && window.APP_CONFIG && 'API_URL' in window.APP_CONFIG) {
    return window.APP_CONFIG.API_URL;
  }
  // Fallback to build-time env variable
  return import.meta.env.VITE_API_URL || '';
};

const API_BASE_URL = getApiBaseUrl();
const API_VERSION = '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('selectedSubject');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (data) => api.post(`${API_VERSION}/auth/login`, data),
  logout: () => api.post(`${API_VERSION}/auth/logout`),
  me: () => api.get(`${API_VERSION}/auth/me`),
};

// Users API
export const usersApi = {
  getAll: () => api.get(`${API_VERSION}/users`),
  getById: (id) => api.get(`${API_VERSION}/users/${id}`),
  create: (data) => api.post(`${API_VERSION}/users`, data),
  update: (id, data) => api.put(`${API_VERSION}/users/${id}`, data),
  delete: (id) => api.delete(`${API_VERSION}/users/${id}`),
  changePassword: (id, currentPassword, newPassword) =>
    api.patch(`${API_VERSION}/users/${id}`, { current_password: currentPassword, password: newPassword }),
};

// Bundles API
export const bundlesApi = {
  getAll: (page = 1, pageSize = 10, gradeId = null, filters = {}) => {
    const body = { gradeId: gradeId || 0, page, pageSize };
    if (filters.name) body.name = filters.name;
    if (filters.description) body.description = filters.description;
    if (filters.type) body.type = filters.type;
    if (filters.status) body.status = filters.status;
    if (filters.price !== undefined && filters.price !== null) {
      body.price = filters.price;
      if (filters.priceFilterType) body.priceFilterType = filters.priceFilterType;
    }
    if (filters.discount !== undefined && filters.discount !== null) {
      body.discount = filters.discount;
      if (filters.discountFilterType) body.discountFilterType = filters.discountFilterType;
    }
    if (filters.createdAt) body.createdAt = filters.createdAt;
    return api.post(`${API_VERSION}/bundles/search`, body);
  },
  getById: (id) => api.get(`${API_VERSION}/bundles/${id}`),
  create: (data) => api.post(`${API_VERSION}/bundles`, data),
  update: (id, data) => api.put(`${API_VERSION}/bundles/${id}`, data),
  delete: (id) => api.delete(`${API_VERSION}/bundles/${id}`),
  // Activation via PATCH with is_active field
  activate: (id) => api.patch(`${API_VERSION}/bundles/${id}`, { is_active: true }),
  deactivate: (id) => api.patch(`${API_VERSION}/bundles/${id}`, { is_active: false }),
  setActive: (id, isActive) => api.patch(`${API_VERSION}/bundles/${id}`, { is_active: isActive }),
  // Vouchers (nested under bundles)
  getVouchers: (bundleId) => api.get(`${API_VERSION}/bundles/${bundleId}/vouchers`),
  generateVouchers: (bundleId, count = 10) => api.post(`${API_VERSION}/bundles/${bundleId}/vouchers`, { count }),
};

// Vouchers API (standalone endpoints)
export const vouchersApi = {
  // Search vouchers by grade with optional filters and pagination
  // filters: { code, bundleName, status, createdAt, usedAt } for server-side filtering
  getByGrade: (gradeId, bundleId = null, status = null, page = 1, pageSize = 20, filters = {}) => {
    const body = { gradeId, page, pageSize };
    if (bundleId) body.bundleId = bundleId;
    // AG Grid status filter takes precedence over sidebar status filter
    if (filters.status) body.status = filters.status;
    else if (status) body.status = status;
    if (filters.code) body.code = filters.code;
    if (filters.bundleName) body.bundleName = filters.bundleName;
    if (filters.createdAt) body.createdAt = filters.createdAt;
    if (filters.usedAt) body.usedAt = filters.usedAt;
    return api.post(`${API_VERSION}/vouchers/search`, body);
  },
  // Get vouchers by bundle (alternative to bundlesApi.getVouchers)
  getByBundle: (bundleId) => api.get(`${API_VERSION}/vouchers/bundle/${bundleId}`),
  // Generate vouchers (alternative to bundlesApi.generateVouchers)
  generate: (data) => api.post(`${API_VERSION}/vouchers`, data),
  // Get/validate voucher by code
  getByCode: (code) => api.get(`${API_VERSION}/vouchers/${code}`),
  validate: (code) => api.get(`${API_VERSION}/vouchers/${code}`), // Alias for getByCode
  // Export vouchers to Excel
  // POST /api/v1/vouchers/export
  // Body: { gradeId: number, bundleGuids?: string[], createdFrom?: string, createdTo?: string, isUsed?: boolean }
  // Returns: Excel file blob
  exportToExcel: (gradeId, bundleGuids = null, createdFrom = null, createdTo = null, isUsed = null) =>
    api.post(
      `${API_VERSION}/vouchers/export`,
      { gradeId, bundleGuids, createdFrom, createdTo, isUsed },
      { responseType: 'blob' }
    ),
  // Statistics endpoints
  getGradeStats: (gradeId) => api.get(`${API_VERSION}/vouchers/stats/grade/${gradeId}`),
  getBundleStats: (bundleId) => api.get(`${API_VERSION}/vouchers/stats/bundle/${bundleId}`),
  // Bulk operations
  deactivateUnused: (bundleId) => api.post(`${API_VERSION}/vouchers/bulk/deactivate-unused`, { bundleId }),
  deleteUnused: (bundleId) => api.post(`${API_VERSION}/vouchers/bulk/delete-unused`, { bundleId }),
  // Single voucher operations
  deactivateVoucher: (voucherId) => api.patch(`${API_VERSION}/vouchers/${voucherId}/deactivate`),
  activateVoucher: (voucherId) => api.patch(`${API_VERSION}/vouchers/${voucherId}/activate`),
  setVoucherActive: (voucherId, isActive) => api.patch(`${API_VERSION}/vouchers/${voucherId}/set-active?isActive=${isActive}`),
  // Bulk voucher operations by IDs
  bulkActivate: (voucherIds) => api.post(`${API_VERSION}/vouchers/bulk/activate`, { voucherIds }),
  bulkDeactivate: (voucherIds) => api.post(`${API_VERSION}/vouchers/bulk/deactivate`, { voucherIds }),
  bulkSetActive: (voucherIds, isActive) => api.post(`${API_VERSION}/vouchers/bulk/set-active`, { voucherIds, isActive }),
};

// Subject Services API
export const subjectServicesApi = {
  getAll: () => api.get(`${API_VERSION}/subject-services`),
  getBySubject: (subjectId) => api.get(`${API_VERSION}/subject-services/${subjectId}`),
  create: (data) => api.post(`${API_VERSION}/subject-services`, data),
  delete: (id) => api.delete(`${API_VERSION}/subject-services/${id}`),
};

// Services API
export const servicesApi = {
  getAll: () => api.get(`${API_VERSION}/services`),
};

// Filters API - Hierarchical filtering (Country -> Curriculum -> Stage -> Grade -> Subject)
export const filtersApi = {
  getCountries: () => api.get(`${API_VERSION}/filters/countries`),
  getCurriculums: (countryId) => api.get(`${API_VERSION}/filters/curriculums`, { params: { countryId } }),
  getStages: (curriculumId) => api.get(`${API_VERSION}/filters/stages`, { params: { curriculumId } }),
  getGrades: (stageId) => api.get(`${API_VERSION}/filters/grades`, { params: { stageId } }),
  getSubjects: (gradeId) => api.get(`${API_VERSION}/filters/subjects`, { params: { gradeId } }),
  getHierarchy: (filters) => api.get(`${API_VERSION}/filters/hierarchy`, { params: filters }),
};

// Rows API
export const rowsApi = {
  getAll: (page = 1, pageSize = 10, gradeId = null, filters = {}) => {
    const body = { gradeId: gradeId || 0, page, pageSize };
    if (filters.id !== undefined && filters.id !== null) {
      body.id = filters.id;
      if (filters.idFilterType) body.idFilterType = filters.idFilterType;
    }
    if (filters.name) body.name = filters.name;
    if (filters.description) body.description = filters.description;
    if (filters.status) body.status = filters.status;
    if (filters.createdAt) body.createdAt = filters.createdAt;
    return api.post(`${API_VERSION}/rows/search`, body);
  },
  getById: (id) => api.get(`${API_VERSION}/rows/${id}`),
  create: (data) => api.post(`${API_VERSION}/rows`, data),
  update: (id, data) => api.put(`${API_VERSION}/rows/${id}`, data),
  delete: (id) => api.delete(`${API_VERSION}/rows/${id}`),
  // Activation via PATCH with is_active field
  activate: (id) => api.patch(`${API_VERSION}/rows/${id}`, { is_active: true }),
  deactivate: (id) => api.patch(`${API_VERSION}/rows/${id}`, { is_active: false }),
  setActive: (id, isActive) => api.patch(`${API_VERSION}/rows/${id}`, { is_active: isActive }),
  // Bundle assignment endpoints
  getBundles: (rowId) => api.get(`${API_VERSION}/rows/${rowId}/bundles`),
  assignBundles: (rowId, bundleAssignments) =>
    api.post(`${API_VERSION}/rows/${rowId}/bundles`, { bundleAssignments }),
  reorderBundles: (rowId, bundleOrders) =>
    api.put(`${API_VERSION}/rows/${rowId}/bundles/reorder`, { bundleOrders }),
  removeBundle: (rowId, rowBundleId) =>
    api.delete(`${API_VERSION}/rows/${rowId}/bundles/${rowBundleId}`),
};

export default api;
