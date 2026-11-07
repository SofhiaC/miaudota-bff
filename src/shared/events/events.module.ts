import { DynamicModule, Global, Module } from '@nestjs/common';
import { EventPublisher, EventSubscriber } from './eventos';
import { NOME_SERVICO, RabbitMqEventBus } from './rabbitmq-event-bus';

@Global()
@Module({})
export class EventsModule {
  /** Cada serviço se registra com o próprio nome; ele dá nome às filas que o serviço assina. */
  static registrar(servico: string): DynamicModule {
    return {
      module: EventsModule,
      providers: [
        { provide: NOME_SERVICO, useValue: servico },
        RabbitMqEventBus,
        { provide: EventPublisher, useExisting: RabbitMqEventBus },
        { provide: EventSubscriber, useExisting: RabbitMqEventBus },
      ],
      exports: [EventPublisher, EventSubscriber],
    };
  }
}
