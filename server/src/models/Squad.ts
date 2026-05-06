import mongoose from 'mongoose';

export type SquadPrivacy = 'public' | 'invite_only';

export interface ISquad {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  privacy: SquadPrivacy;
  inviteCode?: string;
  leaderId: mongoose.Types.ObjectId;
  memberIds: mongoose.Types.ObjectId[];
  createdById: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/** Generates a 6-character uppercase alphanumeric invite code (excludes ambiguous chars). */
export function generateInviteCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return out;
}

const squadSchema = new mongoose.Schema<ISquad>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    privacy: { type: String, enum: ['public', 'invite_only'], default: 'invite_only' },
    inviteCode: { type: String, trim: true, uppercase: true },
    leaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    memberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Sparse unique: only enforces uniqueness among docs that actually have an inviteCode.
// This keeps backward compatibility with existing squads created before this field existed.
squadSchema.index({ inviteCode: 1 }, { unique: true, sparse: true });

export const SquadModel = mongoose.model<ISquad>('Squad', squadSchema);
