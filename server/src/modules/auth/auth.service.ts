import jwt from 'jsonwebtoken';
import { User, IUser } from './user.model';
import { Partner, IPartner } from '../partners/partner.model';
import { LoginInput } from './auth.schemas';
import { UnauthorizedError, ForbiddenError, NotFoundError } from '../../utils/appError';
import { env } from '../../config/env';
import { AuthenticatedUserPayload } from '../../types/express';

export interface LoginResult {
  token: string;
  user: {
    id: string;
    username: string;
    status: string;
    lastLoginAt?: Date;
  };
  partner: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    status: string;
  };
}

export class AuthService {
  /**
   * Authenticates partner credentials and returns JWT session
   */
  async login(input: LoginInput): Promise<LoginResult> {
    const normalizedUsername = input.username.toLowerCase().trim();
    const normalizedPassword = input.password.trim();

    // 1. Fetch user by username including passwordHash
    const user = await User.findOne({ username: normalizedUsername }).select('+passwordHash');

    if (!user) {
      // Use generic message to prevent username enumeration
      throw new UnauthorizedError('Invalid username or password');
    }

    // 2. Validate password hash
    const isPasswordValid = await user.comparePassword(normalizedPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid username or password');
    }

    // 3. Check user account active status
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenError('Your user account has been deactivated. Please contact your partners.');
    }

    // 4. Fetch and validate associated partner record
    const partner = await Partner.findById(user.partner);
    if (!partner) {
      throw new NotFoundError('Associated partner account not found');
    }

    if (partner.status !== 'ACTIVE') {
      throw new ForbiddenError('Your partner account is currently inactive.');
    }

    // 5. Update last login timestamp
    user.lastLoginAt = new Date();
    await user.save();

    // 6. Generate signed JWT token
    const tokenPayload: AuthenticatedUserPayload = {
      userId: user._id.toString(),
      partnerId: partner._id.toString(),
      username: user.username,
    };

    const token = jwt.sign(tokenPayload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });

    return {
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
      },
      partner: {
        id: partner._id.toString(),
        name: partner.name,
        email: partner.email,
        phone: partner.phone,
        status: partner.status,
      },
    };
  }

  /**
   * Verifies and decodes JWT token
   */
  verifyToken(token: string): AuthenticatedUserPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as AuthenticatedUserPayload;
      return decoded;
    } catch {
      throw new UnauthorizedError('Invalid or expired authentication session');
    }
  }

  /**
   * Resolves currently authenticated partner and user session
   */
  async getCurrentPartner(userId: string): Promise<{ user: IUser; partner: IPartner }> {
    const user = await User.findById(userId);
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedError('User session is invalid or inactive');
    }

    const partner = await Partner.findById(user.partner);
    if (!partner || partner.status !== 'ACTIVE') {
      throw new UnauthorizedError('Partner account is invalid or inactive');
    }

    return { user, partner };
  }

  /**
   * Updates the profile (phone and optional email) of the currently authenticated partner.
   * STRICT SECURITY: Only updates the partner attached to the caller's own session.
   */
  async updatePartnerProfile(
    userId: string,
    input: { phone: string; email?: string }
  ): Promise<IPartner> {
    const { partner } = await this.getCurrentPartner(userId);

    partner.phone = input.phone;
    if (input.email !== undefined) {
      partner.email = input.email || undefined;
    }

    await partner.save();
    return partner;
  }
}

export const authService = new AuthService();
