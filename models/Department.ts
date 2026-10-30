import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDepartmentDocument extends Document {
  name: string;
  code?: string;
  category?: string;
  supervisors: Array<{
    name: string;
    email?: string;
    phone?: string;
  }>;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartmentDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      default: 'Department',
    },
    supervisors: [
      {
        name: { type: String, required: true, trim: true },
        email: { type: String, trim: true },
        phone: { type: String, trim: true },
      },
    ],
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Department: Model<IDepartmentDocument> =
  (mongoose.models.Department as Model<IDepartmentDocument>) ||
  mongoose.model<IDepartmentDocument>('Department', DepartmentSchema);

export default Department;
