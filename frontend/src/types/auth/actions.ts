export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: any;
  permissions: string[];
}

export interface RegistrationRequest {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
}
