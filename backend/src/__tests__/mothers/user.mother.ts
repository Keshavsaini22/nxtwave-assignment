import { faker } from '@faker-js/faker';
import { User, Role } from '@prisma/client';

export class UserMother {
  public static create(overrides?: Partial<User>): User {
    return {
      id: overrides?.id || faker.number.int({ min: 1, max: 100000 }),
      uuid: overrides?.uuid || faker.string.uuid(),
      email: overrides?.email || faker.internet.email(),
      passwordHash: overrides?.passwordHash || faker.string.alphanumeric(60),
      role: overrides?.role || Role.MEMBER,
      isBlocked: overrides?.isBlocked ?? false,
      organizationId: overrides?.organizationId || faker.number.int({ min: 1, max: 100000 }),
      createdAt: overrides?.createdAt || new Date(),
    };
  }

  public static createAdmin(overrides?: Partial<User>): User {
    return this.create({ role: Role.ADMIN, ...overrides });
  }

  public static createManager(overrides?: Partial<User>): User {
    return this.create({ role: Role.MANAGER, ...overrides });
  }

  public static createMember(overrides?: Partial<User>): User {
    return this.create({ role: Role.MEMBER, ...overrides });
  }
}
