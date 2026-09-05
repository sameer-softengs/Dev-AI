import axios from 'axios';

export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || '/api/ai';

export const apiClient = axios.create({
  baseURL: API_BASE_URL
});
