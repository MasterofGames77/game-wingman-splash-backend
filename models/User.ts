import mongoose, { Document, Schema } from 'mongoose';

// Define an interface for the User document
export interface IUser extends Document {
  userId: any;
  hasProAccess: boolean;
  email: string;
  position: number | null; // Allow null for the position
  isApproved: boolean; // Add this field to track approval status
  _id: mongoose.Types.ObjectId;
}

// Define the User schema
const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  position: { type: Number, default: null },
  isApproved: { type: Boolean, default: false },
  hasProAccess: { type: Boolean, default: false }, // Add Pro access tracking
  userId: { type: String, required: true }, // Add unique userId
});

const User = mongoose.model<IUser>('User', userSchema, 'users');

export default User;