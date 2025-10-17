// src/types/express.d.ts
import { IUser } from '../models/user.model';
declare global {
  namespace Express {
    interface Request {
      user?: any; // set by passport, keep any for now
    }
  }
}
export {};
