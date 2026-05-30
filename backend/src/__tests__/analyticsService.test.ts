import { jest } from '@jest/globals';

const mockPrismaInternal = {
  $queryRaw: jest.fn(),
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
const { AnalyticsService } = await import('../services/analytics.service.js');

describe('AnalyticsService SQL Aggregations Workflows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully execute queryRaw and return employee performance aggregations', async () => {
    const mockOrgId = 'org-uuid-123';
    const mockDbResult = [
      {
        userId: 'user-uuid-1',
        email: 'fast@acme.com',
        role: 'MEMBER',
        overdueCount: 0,
        avgCompletionSeconds: 1200.5,
        performanceRank: 1,
        orgWideAvgCompletionSeconds: 2400.25,
      },
      {
        userId: 'user-uuid-2',
        email: 'slow@acme.com',
        role: 'MEMBER',
        overdueCount: 3,
        avgCompletionSeconds: 3600.0,
        performanceRank: 2,
        orgWideAvgCompletionSeconds: 2400.25,
      },
    ];

    (prisma.$queryRaw as any).mockResolvedValue(mockDbResult);

    const result = await AnalyticsService.getTaskAnalytics(mockOrgId);

    expect(result).toEqual(mockDbResult);
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });
});
