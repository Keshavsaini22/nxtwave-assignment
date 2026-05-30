import { TaskStatus } from '@prisma/client';
import { TaskStateFactory } from '../services/states/taskState.js';

describe('Task State Design Pattern Transitions Matrix', () => {
  describe('TodoState', () => {
    const state = TaskStateFactory.get(TaskStatus.TODO);

    it('should allow transition to IN_PROGRESS', () => {
      expect(state.canTransitionTo(TaskStatus.IN_PROGRESS)).toBe(true);
    });

    it('should allow transition to BLOCKED', () => {
      expect(state.canTransitionTo(TaskStatus.BLOCKED)).toBe(true);
    });

    it('should reject transition to DONE', () => {
      expect(state.canTransitionTo(TaskStatus.DONE)).toBe(false);
    });

    it('should reject transition to IN_REVIEW', () => {
      expect(state.canTransitionTo(TaskStatus.IN_REVIEW)).toBe(false);
    });
  });

  describe('InProgressState', () => {
    const state = TaskStateFactory.get(TaskStatus.IN_PROGRESS);

    it('should allow transition to IN_REVIEW', () => {
      expect(state.canTransitionTo(TaskStatus.IN_REVIEW)).toBe(true);
    });

    it('should allow transition to BLOCKED', () => {
      expect(state.canTransitionTo(TaskStatus.BLOCKED)).toBe(true);
    });

    it('should reject transition to TODO', () => {
      expect(state.canTransitionTo(TaskStatus.TODO)).toBe(false);
    });
  });

  describe('InReviewState', () => {
    const state = TaskStateFactory.get(TaskStatus.IN_REVIEW);

    it('should allow transition to DONE', () => {
      expect(state.canTransitionTo(TaskStatus.DONE)).toBe(true);
    });

    it('should allow transition to BLOCKED', () => {
      expect(state.canTransitionTo(TaskStatus.BLOCKED)).toBe(true);
    });
  });

  describe('BlockedState', () => {
    const state = TaskStateFactory.get(TaskStatus.BLOCKED);

    it('should allow unblocking recovery to TODO', () => {
      expect(state.canTransitionTo(TaskStatus.TODO)).toBe(true);
    });

    it('should allow unblocking recovery to IN_PROGRESS', () => {
      expect(state.canTransitionTo(TaskStatus.IN_PROGRESS)).toBe(true);
    });

    it('should allow unblocking recovery to IN_REVIEW', () => {
      expect(state.canTransitionTo(TaskStatus.IN_REVIEW)).toBe(true);
    });

    it('should reject transition to DONE', () => {
      expect(state.canTransitionTo(TaskStatus.DONE)).toBe(false);
    });
  });

  describe('DoneState', () => {
    const state = TaskStateFactory.get(TaskStatus.DONE);

    it('should be terminal and reject all transitions', () => {
      expect(state.canTransitionTo(TaskStatus.TODO)).toBe(false);
      expect(state.canTransitionTo(TaskStatus.IN_PROGRESS)).toBe(false);
      expect(state.canTransitionTo(TaskStatus.IN_REVIEW)).toBe(false);
      expect(state.canTransitionTo(TaskStatus.BLOCKED)).toBe(false);
    });
  });
});
