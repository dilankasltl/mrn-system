import mongoose, { Schema, Document, Model } from 'mongoose';
import { IMRNItem, MRNStatus, IApprovalDetail, IStoresIssueDetail } from '../types';

export interface IMRNDocument extends Document {
  mrnNo: string;
  department: string;
  requestedBy: string;
  shift?: string;
  date: Date;
  generalRemarks?: string;
  items: IMRNItem[];
  status: MRNStatus;
  supervisorApproval: IApprovalDetail;
  niranjanApproval: IApprovalDetail;
  vinodApproval: IApprovalDetail;
  storesIssue: IStoresIssueDetail;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MRNItemSchema = new Schema<IMRNItem>(
  {
    itemNo: { type: Number, required: true },
    description: { type: String, required: true, trim: true },
    requestQty: { type: Number, required: true, min: 0 },
    unit: { type: String, default: 'Nos', trim: true },
    issueQty: { type: Number, default: 0, min: 0 },
    remarks: { type: String, default: '', trim: true },
    isIssued: { type: Boolean, default: false },
    issuedAt: { type: Date },
  },
  { _id: true }
);

const ApprovalDetailSchema = new Schema<IApprovalDetail>(
  {
    approved: { type: Boolean, default: false },
    approvedBy: { type: String, default: '' },
    approvedAt: { type: Date },
    comments: { type: String, default: '' },
    withoutNiranjan: { type: Boolean, default: false },
  },
  { _id: false }
);

const StoresIssueDetailSchema = new Schema<IStoresIssueDetail>(
  {
    issued: { type: Boolean, default: false },
    issuedBy: { type: String, default: '' },
    issuedAt: { type: Date },
    storesRemarks: { type: String, default: '' },
  },
  { _id: false }
);

const MRNSchema = new Schema<IMRNDocument>(
  {
    mrnNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    requestedBy: {
      type: String,
      required: true,
      trim: true,
    },
    shift: {
      type: String,
      default: 'General',
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    generalRemarks: {
      type: String,
      default: '',
      trim: true,
    },
    items: {
      type: [MRNItemSchema],
      validate: [(val: IMRNItem[]) => val.length > 0, 'At least one item is required'],
    },
    status: {
      type: String,
      enum: [
        'PENDING_SUPERVISOR',
        'SUPERVISOR_APPROVED',
        'NIRANJAN_APPROVED',
        'VINOD_APPROVED',
        'APPROVED',
        'ISSUED',
        'PARTIALLY_ISSUED',
        'REJECTED',
      ],
      default: 'PENDING_SUPERVISOR',
      index: true,
    },
    supervisorApproval: {
      type: ApprovalDetailSchema,
      default: () => ({ approved: false }),
    },
    niranjanApproval: {
      type: ApprovalDetailSchema,
      default: () => ({ approved: false }),
    },
    vinodApproval: {
      type: ApprovalDetailSchema,
      default: () => ({ approved: false, withoutNiranjan: false }),
    },
    storesIssue: {
      type: StoresIssueDetailSchema,
      default: () => ({ issued: false }),
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const MRN: Model<IMRNDocument> =
  (mongoose.models.MRN as Model<IMRNDocument>) ||
  mongoose.model<IMRNDocument>('MRN', MRNSchema);

export default MRN;
