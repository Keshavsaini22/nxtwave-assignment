import { faker } from '@faker-js/faker';
import { Task, TaskStatus, Priority } from '@prisma/client';

export class TaskMother {
  public static create(overrides?: Partial<Task>): Task {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);

    return {
      id: overrides?.id || faker.number.int({ min: 1, max: 100000 }),
      uuid: overrides?.uuid || faker.string.uuid(),
      title: overrides?.title || faker.lorem.sentence(3),
      description: overrides?.description || faker.lorem.paragraph(),
      priority: overrides?.priority || Priority.LOW,
      status: overrides?.status || TaskStatus.TODO,
      organizationId: overrides?.organizationId || faker.number.int({ min: 1, max: 100000 }),
      projectId: overrides?.projectId || faker.number.int({ min: 1, max: 100000 }),
      assigneeId: overrides?.assigneeId !== undefined ? overrides.assigneeId : null,
      dueDate: overrides?.dueDate !== undefined ? overrides.dueDate : futureDate,
      completedAt: overrides?.completedAt || null,
      createdAt: overrides?.createdAt || new Date(),
      updatedAt: overrides?.updatedAt || new Date(),
    };
  }
}
