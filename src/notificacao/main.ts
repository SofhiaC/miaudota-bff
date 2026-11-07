import 'dotenv/config'; // precisa ser o primeiro import
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NotificacaoModule } from './notificacao.module';

// Sem porta HTTP: o processo só fica ligado ao RabbitMQ esperando eventos.
async function iniciar() {
  const app = await NestFactory.createApplicationContext(NotificacaoModule);
  app.enableShutdownHooks();
  new Logger('notificacao').log('"notificacao" aguardando eventos do RabbitMQ');
}
iniciar();
