import { TaskStatus } from '@prisma/client';

export interface ITaskState {
  canTransitionTo(target: TaskStatus): boolean;
}

class TodoState implements ITaskState {
  public canTransitionTo(target: TaskStatus): boolean {
    return target === TaskStatus.IN_PROGRESS || target === TaskStatus.BLOCKED;
  }
}

class InProgressState implements ITaskState {
  public canTransitionTo(target: TaskStatus): boolean {
    return target === TaskStatus.IN_REVIEW || target === TaskStatus.BLOCKED;
  }
}

class InReviewState implements ITaskState {
  public canTransitionTo(target: TaskStatus): boolean {
    return target === TaskStatus.DONE || target === TaskStatus.BLOCKED;
  }
}

class BlockedState implements ITaskState {
  public canTransitionTo(target: TaskStatus): boolean {
    return target === TaskStatus.TODO || target === TaskStatus.IN_PROGRESS || target === TaskStatus.IN_REVIEW;
  }
}

class DoneState implements ITaskState {
  public canTransitionTo(target: TaskStatus): boolean {
    return false;
  }
}

export class TaskStateFactory {
  public static get(status: TaskStatus): ITaskState {
    switch (status) {
      case TaskStatus.TODO:
        return new TodoState();
      case TaskStatus.IN_PROGRESS:
        return new InProgressState();
      case TaskStatus.IN_REVIEW:
        return new InReviewState();
      case TaskStatus.BLOCKED:
        return new BlockedState();
      case TaskStatus.DONE:
        return new DoneState();
      default:
        throw new Error('Unsupported task status state');
    }
  }
}
