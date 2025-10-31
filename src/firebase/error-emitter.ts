import { EventEmitter } from 'events';
import type { FirestorePermissionError } from './errors';

type Events = {
  'permission-error': (error: FirestorePermissionError) => void;
};

// We can't use the generic EventEmitter<Events> because of a bug in the
// DefinitelyTyped definition.
// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/62217
export const errorEmitter = new EventEmitter() as unknown as {
  on<E extends keyof Events>(event: E, listener: Events[E]): void;
  off<E extends keyof Events>(event: E, listener: Events[E]): void;
  emit<E extends keyof Events>(event: E, ...args: Parameters<Events[E]>): void;
};
