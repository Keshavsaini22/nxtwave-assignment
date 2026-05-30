import { faker } from '@faker-js/faker';
import { Organization } from '@prisma/client';

export class OrganizationMother {
  public static create(overrides?: Partial<Organization>): Organization {
    return {
      id: overrides?.id || faker.string.uuid(),
      name: overrides?.name || faker.company.name(),
      createdAt: overrides?.createdAt || new Date(),
    };
  }
}
