import mongoose, { Document, Schema } from 'mongoose';

// Define an interface for the User document
export interface IUser extends Document {
  email: string;
  position: number | null; // Allow null for the position
  isApproved: boolean; // Add this field to track approval status
  _id: mongoose.Types.ObjectId;
}

// Define the User schema
const userSchema: Schema<IUser> = new Schema({
  email: { type: String, required: true, unique: true },
  position: { type: Number, default: null }, // Allow null for the position
  isApproved: { type: Boolean, default: false },
});

const User = mongoose.model<IUser>('User', userSchema, 'users');

export default User;