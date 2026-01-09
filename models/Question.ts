import mongoose, { Document, Schema } from 'mongoose';

// Define the Question interface for splash page
export interface IQuestion extends Document {
  email: string; // User's email (instead of username)
  question: string;
  response: string;
  timestamp: Date;
  
  // Optional metadata fields
  detectedGame?: string;
  detectedGenre?: string[];
  imageUrl?: string; // URL of image uploaded with this question (for future use)
}

// Define the Question schema
const QuestionSchema = new Schema<IQuestion>(
  {
    email: { type: String, required: true, index: true },
    question: { type: String, required: true },
    response: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
    
    // Optional metadata fields
    detectedGame: { type: String, required: false },
    detectedGenre: [{ type: String, required: false }],
    imageUrl: { type: String, required: false }
  },
  { collection: 'questions' } // Specifies collection name in MongoDB
);

// Compound index for efficient queries by email and timestamp
QuestionSchema.index({ email: 1, timestamp: -1 });

// Create and export model
const Question = mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);
export default Question;
