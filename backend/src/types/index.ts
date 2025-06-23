import mongoose from 'mongoose';

export interface JwtPayload {
  id: string;
  iat: number;
}

export interface UserPayload {
  _id: string | mongoose.Types.ObjectId;
  password?: string;
  otpCode?: string;
  otpExpires?: Date;
}
