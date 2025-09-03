import axios from "axios";

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(
      import.meta.env.VITE_JWT_STORAGE_KEY || "dko_auth_token"
    );

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem(
          import.meta.env.VITE_REFRESH_TOKEN_KEY || "dko_refresh_token"
        );

        if (refreshToken) {
          const response = await axios.post(
            `${
              import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
            }/auth/refresh-token`,
            { refreshToken }
          );

          if (response.data.success) {
            const { token, refreshToken: newRefreshToken } = response.data.data;

            // Update tokens in localStorage
            localStorage.setItem(
              import.meta.env.VITE_JWT_STORAGE_KEY || "dko_auth_token",
              token
            );
            localStorage.setItem(
              import.meta.env.VITE_REFRESH_TOKEN_KEY || "dko_refresh_token",
              newRefreshToken
            );

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);

        // Clear tokens and redirect to login
        localStorage.removeItem(
          import.meta.env.VITE_JWT_STORAGE_KEY || "dko_auth_token"
        );
        localStorage.removeItem(
          import.meta.env.VITE_REFRESH_TOKEN_KEY || "dko_refresh_token"
        );

        // Redirect to login page
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

// API methods
export const apiService = {
  // Generic methods
  get: (url, config = {}) => api.get(url, config),
  post: (url, data = {}, config = {}) => api.post(url, data, config),
  put: (url, data = {}, config = {}) => api.put(url, data, config),
  patch: (url, data = {}, config = {}) => api.patch(url, data, config),
  delete: (url, config = {}) => api.delete(url, config),

  // File upload
  upload: (url, formData, config = {}) => {
    return api.post(url, formData, {
      ...config,
      headers: {
        ...config.headers,
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Streaming request
  stream: (url, data = {}, config = {}) => {
    return api.post(url, data, {
      ...config,
      responseType: "stream",
    });
  },
};

export default api;
