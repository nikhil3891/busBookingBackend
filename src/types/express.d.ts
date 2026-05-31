// src/types/express.d.ts
import { IUser } from '../models/usersModel';

declare global {
  namespace Express {
    interface Request {
      user?: IUser; // set by passport, keep any for now
    }
  }
}
export {};
