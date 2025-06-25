export type ApiConfig = typeof apiConfig;

export const apiConfig = {
  url:
    process.env.NEXT_PUBLIC_BACKEND_APP_API_URL || 'http://localhost:5000/api/',
  timeout: 30000,
};
