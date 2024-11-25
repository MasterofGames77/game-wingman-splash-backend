import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  userId: string; // Unique identifier for linking with the assistant database
  position: number | null; // Position on the waitlist
  isApproved: boolean; // Approval status for accessing the main assistant app
  hasProAccess: boolean; // Pro access status for users signing up early
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    userId: { 
      type: String, 
      unique: true, 
      required: true, 
      default: () => `user-${Date.now()}` 
    }, // Generate a unique identifier by default
    position: { type: Number, default: null }, // Waitlist position, initially null
    isApproved: { type: Boolean, default: false }, // Default approval status
    hasProAccess: { type: Boolean, default: false } // Pro access status, initially false
  },
  { collection: 'users' } // Specify the collection name in MongoDB
);

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;