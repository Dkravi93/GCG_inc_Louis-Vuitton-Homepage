    import jwt from 'jsonwebtoken';
    import bcrypt from 'bcrypt';

    const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change';
    const JWT_EXPIRES_IN = '7d';

    export async function hashPassword(plain: string): Promise<string> {
      const rounds = 10;
      return bcrypt.hash(plain, rounds);
    }

    export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
      return bcrypt.compare(plain, hash);
    }

    export function signToken(payload: object): string {
      return jwt.sign(payload as any, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    }

    export function verifyToken<T = any>(token: string): T {
      return jwt.verify(token, JWT_SECRET) as T;
    }


