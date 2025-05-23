// services/labels.ts - Labels Service
import axios from 'axios';
import { apiConfig } from '@/config/api';

// Create axios instance with base URL and default headers
const api = axios.create({
  baseURL: apiConfig.url,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth tokens
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

export interface CreateLabelData {
  name: string;
  color: string;
}

export interface UpdateLabelData {
  name?: string;
  color?: string;
}

export interface LabelFilters {
  search?: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export const labelsService = {
  async getLabels() {
    const response = await api.get('/labels');
    return response.data;
  },

  async getLabel(id: string) {
    const response = await api.get(`/labels/${id}`);
    return response.data;
  },

  async createLabel(data: CreateLabelData) {
    const response = await api.post('/labels', data);
    return response.data;
  },

  async updateLabel(id: string, data: UpdateLabelData) {
    const response = await api.put(`/labels/${id}`, data);
    return response.data;
  },

  async deleteLabel(id: string) {
    const response = await api.delete(`/labels/${id}`);
    return response.data;
  },
};
