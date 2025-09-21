    import { Schema, model } from 'mongoose';

    export type UserRole = 'user' | 'admin' | 'superadmin';

    export interface UserDocument {
      email: string;
      passwordHash: string;
      firstName?: string;
      lastName?: string;
      role: UserRole;
      avatarUrl?: string;
      preferences?: {
        theme?: 'light' | 'dark' | 'system';
        locale?: string;
      };
      createdAt?: Date;
      updatedAt?: Date;
    }

    const userSchema = new Schema<UserDocument>(
      {
        email: { type: String, required: true, unique: true, index: true },
        passwordHash: { type: String, required: true },
        firstName: String,
        lastName: String,
        role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user', index: true },
        avatarUrl: { type: String },
        preferences: {
          theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
          locale: { type: String, default: 'en' },
        },
      },
      { timestamps: true }
    );

    export const UserModel = model<UserDocument>('User', userSchema);


