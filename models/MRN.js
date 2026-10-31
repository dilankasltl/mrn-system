import mongoose from 'mongoose';

const MRNItemSchema = new mongoose.Schema(
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

const ApprovalDetailSchema = new mongoose.Schema(
  {
    approved: { type: Boolean, default: false },
    approvedBy: { type: String, default: '' },
    approvedAt: { type: Date },
    comments: { type: String, default: '' },
    withoutNiranjan: { type: Boolean, default: false },
  },
  { _id: false }
);

const StoresIssueDetailSchema = new mongoose.Schema(
  {
    issued: { type: Boolean, default: false },
    issuedBy: { type: String, default: '' },
    issuedAt: { type: Date },
    storesRemarks: { type: String, default: '' },
  },
  { _id: false }
);

const MRNSchema = new mongoose.Schema(
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
      validate: [(val) => val.length > 0, 'At least one item is required'],
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

const MRN = mongoose.models.MRN || mongoose.model('MRN', MRNSchema);

export default MRN;
