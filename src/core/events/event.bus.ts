import { EventEmitter } from 'events';
import { DomainEvent, DomainEventPayload } from './event.types';
import { logger } from '../logger/logger';

class TypedEventBus extends EventEmitter {
  emit<E extends DomainEvent>(
    event: E,
    payload: DomainEventPayload[E],
  ): boolean {
    logger.debug(`[EventBus] ${event}`, { payload });
    return super.emit(event, payload);
  }

  on<E extends DomainEvent>(
    event: E,
    listener: (payload: DomainEventPayload[E]) => void,
  ): this {
    return super.on(event, listener);
  }

  once<E extends DomainEvent>(
    event: E,
    listener: (payload: DomainEventPayload[E]) => void,
  ): this {
    return super.once(event, listener);
  }

  off<E extends DomainEvent>(
    event: E,
    listener: (payload: DomainEventPayload[E]) => void,
  ): this {
    return super.off(event, listener);
  }
}

export const eventBus = new TypedEventBus();
eventBus.setMaxListeners(50);
