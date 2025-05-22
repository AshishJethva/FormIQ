// In src/middleware/auth.ts
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}
