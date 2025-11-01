import mongoose, { Document, Schema } from 'mongoose';
import { generateUserId } from '../utils/generateUserId';

// Define user interface
export interface IUser extends Document {
  email: string;
  userId: string; // Links to main app
  position: number | null; // Waitlist position
  isApproved: boolean; // Access approval
  hasProAccess: boolean; // Pro status
}

// Define MongoDB schema
const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    userId: { 
      type: String, 
      unique: true, 
      required: true, 
      default: generateUserId // Generates unique ID with timestamp + random suffix
    },
    position: { type: Number, default: null },
    isApproved: { type: Boolean, default: false },
    hasProAccess: { type: Boolean, default: false }
  },
  { collection: 'users' } // Specifies collection name in MongoDB
);

// Create and export model
const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;