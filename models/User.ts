import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserDocument extends Document {
  username: string;
  name: string;
  role: 'admin' | 'management_niranjan' | 'management_vinod' | 'stores' | 'supervisor';
  department?: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'management_niranjan', 'management_vinod', 'stores', 'supervisor'],
      required: true,
    },
    department: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUserDocument> =
  (mongoose.models.User as Model<IUserDocument>) ||
  mongoose.model<IUserDocument>('User', UserSchema);

export default User;
