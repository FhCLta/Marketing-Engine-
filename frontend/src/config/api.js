// API Configuration
// In development: http://localhost:8000
// In production: Cloud Run URL

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default API_BASE_URL;
