import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IResponse extends Document {
  userId: Types.ObjectId;
  title: string;
  timestamp: string;
  discarded: boolean;
  discardedAt?: string;
  context: string;
  isDeleted: boolean;
}

const ResponseSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, required: true },
  discarded: { type: Boolean, default: false, required: true },
  discardedAt: { type: Date, default: null },
  context: { type: String, required: true },
  isDeleted: { type: Boolean, default: false, required: true },
});

export default mongoose.models.Response || mongoose.model<IResponse>('Response', ResponseSchema); 