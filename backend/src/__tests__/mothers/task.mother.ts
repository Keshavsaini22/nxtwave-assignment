import { faker } from '@faker-js/faker';
import { Task, TaskStatus, Priority } from '@prisma/client';

export class TaskMother {
  public static create(overrides?: Partial<Task>): Task {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);

    return {
      id: overrides?.id || faker.string.uuid(),
      title: overrides?.title || faker.lorem.sentence(3),
      description: overrides?.description || faker.lorem.paragraph(),
      priority: overrides?.priority || Priority.LOW,
      status: overrides?.status || TaskStatus.TODO,
      organizationId: overrides?.organizationId || faker.string.uuid(),
      projectId: overrides?.projectId || faker.string.uuid(),
      assigneeId: overrides?.assigneeId || null,
      dueDate: overrides?.dueDate !== undefined ? overrides.dueDate : futureDate,
      completedAt: overrides?.completedAt || null,
      createdAt: overrides?.createdAt || new Date(),
      updatedAt: overrides?.updatedAt || new Date(),
    };
  }
}
