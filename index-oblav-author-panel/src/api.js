const API_URL = '/api';

const api = {
  login: async (handle, password) => {
    const response = await fetch(`${API_URL}/author/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ handle, password }),
    });
    return response.json();
  },
  // Add other API methods here
};

export default api;
