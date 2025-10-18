import axios from 'axios';

// Use VITE_API_URL if provided (for Vercel/production), otherwise default to local backend
export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const api = axios.create({
  baseURL: API_URL,
  // You can add headers here if needed
});
