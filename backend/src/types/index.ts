import mongoose from 'mongoose';
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

export interface JwtPayload {
  id: string;
  email: string;
  iat: number;
  exp: number;
}

export interface UserPayload {
  _id: string | mongoose.Types.ObjectId;
  password?: string;
  otpCode?: string;
  otpExpires?: Date;
}
