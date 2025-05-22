// src/types/express.d.ts

import { Types } from 'mongoose';

// Define the AuthUser interface
export interface AuthUser {
  _id: Types.ObjectId;
  id?: string;
  name?: string;
  email: string;
}

// Important: When using ES modules, module augmentation needs to be done differently
// Method 1: Global augmentation
declare global {
  namespace Express {
    // Augment the Request interface
    interface Request {
      user?: AuthUser;
    }
  }
}
