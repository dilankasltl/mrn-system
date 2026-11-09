import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema(
  {
    itemNo: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    uom: {
      type: String,
      default: 'NOS',
      trim: true,
    },
    createdBy: {
      type: String,
      default: 'System',
      trim: true,
    },
    updatedBy: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

// Compound index for fast autocomplete search
ItemSchema.index({ itemNo: 1, description: 1 });

export default mongoose.models.Item || mongoose.model('Item', ItemSchema);
