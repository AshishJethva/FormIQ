import { Types } from 'mongoose';

export interface AuthUser {
  _id: Types.ObjectId;
  id?: string;
  name?: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
