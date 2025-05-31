// src/config/api.ts

export type ApiConfig = typeof apiConfig;

export const apiConfig = {
  url:
    process.env.NEXT_PUBLIC_BACKEND_APP_API_URL || 'http://localhost:5000/api/',
  timeout: 30000, // 30 seconds
};

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
  },

  // Forms endpoints
  FORMS: {
    BASE: '/forms',
    GET_ALL: '/forms',
    GET_ONE: (id: string) => `/forms/${id}`,
    CREATE: '/forms',
    UPDATE: (id: string) => `/forms/${id}`,
    DELETE: (id: string) => `/forms/${id}`,
    DUPLICATE: (id: string) => `/forms/${id}/duplicate`,
    FAVORITE: (id: string) => `/forms/${id}/favorite`,
    ARCHIVE: (id: string) => `/forms/${id}/archive`,
    TRASH: (id: string) => `/forms/${id}/trash`,
    RESTORE: (id: string) => `/forms/${id}/restore`,
    PUBLISH: (id: string) => `/forms/${id}/publish`,
    BULK: '/forms/bulk',
    BULK_ADD_LABEL: '/forms/bulk/add-label',
    BULK_REMOVE_LABEL: '/forms/bulk/remove-label',
  },

  // Labels endpoints
  LABELS: {
    BASE: '/labels',
    GET_ALL: '/labels',
    CREATE: '/labels',
    UPDATE: (id: string) => `/labels/${id}`,
    DELETE: (id: string) => `/labels/${id}`,
  },

  // Upload endpoints
  UPLOAD: {
    LOGO: '/upload/logo',
    FILE: '/upload/file',
  },

  // Public endpoints
  PUBLIC: {
    FORM: (id: string) => `/public/forms/${id}`,
    FORM_STATS: (id: string) => `/public/forms/${id}/stats`,
  },

  // Dashboard endpoints
  DASHBOARD: {
    STATS: '/dashboard/stats',
    RECENT_FORMS: '/dashboard/recent-forms',
  },
};
