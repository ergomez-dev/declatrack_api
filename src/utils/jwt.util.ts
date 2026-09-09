import jwt, { JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthPayload extends JwtPayload {
  sub: string;
  email: string;
  rol: string; // nombre del rol (p.ej. 'SUPERADMIN'), tomado de roles.nombre
  rolId: string;
  tenantId: string | null;
}

export function signToken(payload: Omit<AuthPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): AuthPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as AuthPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new Error('TOKEN_EXPIRED');
    }
    throw new Error('TOKEN_INVALID');
  }
}
