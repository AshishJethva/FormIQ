export class ApiResponse {
  success: boolean;
  statusCode: number;
  data: any;
  message: string;

  constructor(statusCode: number, data: any, message: string = 'Success') {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

// Helper functions for common responses
export const successResponse = (
  data: any = null,
  message: string = 'Operation successful',
  statusCode: number = 200
): ApiResponse => {
  return new ApiResponse(statusCode, data, message);
};

export const errorResponse = (
  message: string = 'Operation failed',
  statusCode: number = 500,
  data: any = null
): ApiResponse => {
  return new ApiResponse(statusCode, data, message);
};
