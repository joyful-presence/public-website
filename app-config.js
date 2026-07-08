// Global Application Configuration
const CONFIG = {
  API_BASE_URL: "https://api.joyfullypresent.life"
};

// 1. Define the exact global variable your HTML scripts are looking for
window.API_BASE = CONFIG.API_BASE_URL;

// 2. Keep the helper object for your other pages
window.appApi = {
  baseUrl: CONFIG.API_BASE_URL,

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    
    options.headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    const adminToken = localStorage.getItem('admin_token');
    if (adminToken && endpoint.includes('/admin')) {
      options.headers['Authorization'] = `Bearer ${adminToken}`;
    }

    const customerToken = localStorage.getItem('customer_token');
    if (customerToken && !endpoint.includes('/admin')) {
      options.headers['Authorization'] = `Bearer ${customerToken}`;
    }

    try {
      const response = await fetch(url, options);
      const data = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        if (response.status === 401 && endpoint.includes('/admin') && !endpoint.includes('/login')) {
          alert('Admin session expired.');
          window.location.href = '/admin-login.html';
          return null;
        }
        throw new Error(data.message || `API Error: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error(`API Request to ${endpoint} failed:`, error);
      throw error;
    }
  }
};
