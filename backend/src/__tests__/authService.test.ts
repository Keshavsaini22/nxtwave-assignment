import { jest } from '@jest/globals';
import type { AppError } from '../middlewares/error.middleware.js';

const mockPrismaInternal = {
  refreshToken: {
    findUnique: jest.fn(),
    updateMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn((arg: any) => {
    if (Array.isArray(arg)) {
      return Promise.all(arg);
    }
    return arg(mockPrisma);
  }),
};

const mockPrisma = new Proxy(mockPrismaInternal, {
  get(target: any, prop: string | symbol) {
    if (prop in target) {
      return target[prop];
    }
    if (typeof prop === 'string') {
      if (prop.startsWith('$')) {
        return undefined;
      }
      target[prop] = {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        upsert: jest.fn(),
      };
      return target[prop];
    }
    return undefined;
  }
});

jest.unstable_mockModule('../config/prisma.js', () => ({
  __esModule: true,
  default: mockPrisma,
}));

const { default: prisma } = await import('../config/prisma.js');
const { AuthService } = await import('../services/auth.service.js');
const { UserMother } = await import('./mothers/user.mother.js');

describe('AuthService Critical Flow - Refresh Session & Replay Attack Protection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully rotate tokens in a transaction when refresh token is valid', async () => {
    const user = { ...UserMother.createMember(), organization: { uuid: 'org-uuid-1' } };
    const oldToken = 'valid-refresh-token';
    const mockExpiresAt = new Date();
    mockExpiresAt.setDate(mockExpiresAt.getDate() + 1);

    (prisma.refreshToken.findUnique as any).mockResolvedValue({
      id: 'token-id-1',
      token: oldToken,
      userId: user.id,
      isRevoked: false,
      expiresAt: mockExpiresAt,
      user,
    });

    (prisma.refreshToken.delete as any).mockResolvedValue({ id: 'token-id-1' });
    (prisma.refreshToken.create as any).mockResolvedValue({
      token: 'new-refresh-token',
      userId: user.id,
    });

    const result = await AuthService.refreshSession(oldToken);

    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(prisma.refreshToken.delete).toHaveBeenCalledWith({
      where: { id: 'token-id-1' },
    });
    expect(prisma.refreshToken.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: user.id,
      }),
    }));
  });

  it('should detect replay attack and revoke all tokens when token is already revoked', async () => {
    const user = { ...UserMother.createMember(), organization: { uuid: 'org-uuid-2' } };
    const oldToken = 'revoked-refresh-token';
    const mockExpiresAt = new Date();
    mockExpiresAt.setDate(mockExpiresAt.getDate() + 1);

    (prisma.refreshToken.findUnique as any).mockResolvedValue({
      id: 'token-id-2',
      token: oldToken,
      userId: user.id,
      isRevoked: true,
      expiresAt: mockExpiresAt,
      user,
    });

    let thrownError: AppError | null = null;
    try {
      await AuthService.refreshSession(oldToken);
    } catch (error: any) {
      thrownError = error;
    }

    expect(thrownError).not.toBeNull();
    expect(thrownError!.status).toBe(401);
    expect(thrownError!.code).toBe('INVALID_SESSION');
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: user.id },
      data: { isRevoked: true },
    });
  });

  it('should detect reuse and revoke all tokens when token is expired', async () => {
    const user = { ...UserMother.createMember(), organization: { uuid: 'org-uuid-3' } };
    const oldToken = 'expired-refresh-token';
    const mockExpiresAt = new Date();
    mockExpiresAt.setDate(mockExpiresAt.getDate() - 1);

    (prisma.refreshToken.findUnique as any).mockResolvedValue({
      id: 'token-id-3',
      token: oldToken,
      userId: user.id,
      isRevoked: false,
      expiresAt: mockExpiresAt,
      user,
    });

    let thrownError: AppError | null = null;
    try {
      await AuthService.refreshSession(oldToken);
    } catch (error: any) {
      thrownError = error;
    }

    expect(thrownError).not.toBeNull();
    expect(thrownError!.status).toBe(401);
    expect(thrownError!.code).toBe('INVALID_SESSION');
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: user.id },
      data: { isRevoked: true },
    });
  });

  it('should reject refresh session if the user account has been blocked', async () => {
    const user = { ...UserMother.createMember({ isBlocked: true }), organization: { uuid: 'org-uuid-4' } };
    const oldToken = 'valid-refresh-token-blocked-user';
    const mockExpiresAt = new Date();
    mockExpiresAt.setDate(mockExpiresAt.getDate() + 1);

    (prisma.refreshToken.findUnique as any).mockResolvedValue({
      id: 'token-id-4',
      token: oldToken,
      userId: user.id,
      isRevoked: false,
      expiresAt: mockExpiresAt,
      user,
    });

    let thrownError: AppError | null = null;
    try {
      await AuthService.refreshSession(oldToken);
    } catch (error: any) {
      thrownError = error;
    }

    expect(thrownError).not.toBeNull();
    expect(thrownError!.status).toBe(403);
    expect(thrownError!.code).toBe('BLOCKED_USER');
  });

  it('should throw an error and not revoke any tokens when token is non-existent', async () => {
    const oldToken = 'non-existent-refresh-token';

    (prisma.refreshToken.findUnique as any).mockResolvedValue(null);

    let thrownError: AppError | null = null;
    try {
      await AuthService.refreshSession(oldToken);
    } catch (error: any) {
      thrownError = error;
    }

    expect(thrownError).not.toBeNull();
    expect(thrownError!.status).toBe(401);
    expect(thrownError!.code).toBe('INVALID_SESSION');
    expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
  });

  it('should successfully delete the token record upon calling logout', async () => {
    const token = 'logout-refresh-token';
    (prisma.refreshToken.delete as any).mockResolvedValue({ token });

    await AuthService.logout(token);

    expect(prisma.refreshToken.delete).toHaveBeenCalledWith({
      where: { token },
    });
  });
});
