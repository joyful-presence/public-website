// Global Application Configuration
const CONFIG = {
  API_BASE_URL: "https://api.joyfullypresent.life"
};

window.appApi = {
  baseUrl: CONFIG.API_BASE_URL,

  /**
   * Universal fetch wrapper for all database/worker interactions
   * @param {string} endpoint - The API route (e.g., '/services', '/admin/login')
   * @param {Object} options - Fetch configuration (method, body, headers)
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    
    // Default headers to JSON
    options.headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Automatically attach Admin Token if it exists in localStorage
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken && endpoint.includes('/admin')) {
      options.headers['Authorization'] = `Bearer ${adminToken}`;
    }

    // Automatically attach Customer Token if it exists (for my-appointments.html)
    const customerToken = localStorage.getItem('customer_token');
    if (customerToken && !endpoint.includes('/admin')) {
      options.headers['Authorization'] = `Bearer ${customerToken}`;
    }

    try {
      const response = await fetch(url, options);
      const data = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        // Handle session expiration
        if (response.status === 401) {
          if (endpoint.includes('/admin') && !endpoint.includes('/login')) {
            alert('Admin session expired.');
            window.location.href = '/admin-login.html';
            return null;
          }
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
