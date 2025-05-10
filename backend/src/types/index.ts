import { Request, Response, NextFunction } from 'express';
import { Document } from 'mongoose';

export interface JwtPayload {
  id: string;
  iat: number;
}

export interface RequestWithUser extends Request {
  user?: Document;
}

export interface UserPayload {
  _id: string;
  password?: string;
}
