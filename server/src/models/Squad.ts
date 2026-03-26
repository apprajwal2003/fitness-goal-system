import mongoose from 'mongoose';

export interface ISquad {
  _id: mongoose.Types.ObjectId;
  name: string;
  memberIds: mongoose.Types.ObjectId[];
  createdById: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const squadSchema = new mongoose.Schema<ISquad>(
  {
    name: { type: String, required: true, trim: true },
    memberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const SquadModel = mongoose.model<ISquad>('Squad', squadSchema);
