import { faker } from '@faker-js/faker';
import { Organization } from '@prisma/client';

export class OrganizationMother {
  public static create(overrides?: Partial<Organization>): Organization {
    return {
      id: overrides?.id || faker.number.int({ min: 1, max: 100000 }),
      uuid: overrides?.uuid || faker.string.uuid(),
      name: overrides?.name || faker.company.name(),
      createdAt: overrides?.createdAt || new Date(),
    };
  }
}
