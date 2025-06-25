export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export const successResponse = (
  data: any,
  message = 'Operation successful'
): ApiResponse => ({
  success: true,
  data,
  message,
});

export const errorResponse = (
  error: string,
  statusCode = 500
): ApiResponse => ({
  success: false,
  error,
});
