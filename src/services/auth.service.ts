import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/User.ts';
import { UserRole } from '../constants/index.ts';
import { env } from '../config/environment.ts';
import { AppError } from '../middleware/errorHandler.ts';

export interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  static generateTokens(payload: TokenPayload) {
    const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
  }

  static async register(name: string, email: string, password: string, role?: UserRole): Promise<AuthResponse> {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email address is already in use.', 409);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      passwordHash,
      role: role || UserRole.FAN,
    });

    const payload: TokenPayload = {
      id: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role,
    };

    const tokens = this.generateTokens(payload);

    return {
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      ...tokens,
    };
  }

  static async login(email: string, password: string): Promise<AuthResponse> {
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    const payload: TokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const tokens = this.generateTokens(payload);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  static refresh(token: string) {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
      const newPayload: TokenPayload = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };
      return this.generateTokens(newPayload);
    } catch (err) {
      throw new AppError('Invalid or expired refresh token.', 401);
    }
  }
}
