export interface JwtPayload {
  id: string;
  iat: number;
}

export interface UserPayload {
  _id: string;
  password?: string;
  otpCode?: string;
  otpExpires?: Date;
}
