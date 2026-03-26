import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser {
  _id: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  profileId?: mongoose.Types.ObjectId;
  squadId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserProfile', default: null },
    squadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Squad', default: null },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUser>('User', userSchema);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
