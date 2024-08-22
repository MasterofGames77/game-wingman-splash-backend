import { UserDocument } from './models/User'; // Import your User model type

declare module 'express-serve-static-core' {
  interface Request {
    user?: UserDocument; // Add the `user` property to the Request interface
  }
}