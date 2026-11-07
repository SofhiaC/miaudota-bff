import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventSubscriber, Eventos } from '../../../shared/events/eventos';
import { NotificarFeiraCadastrada } from './notificar-feira-cadastrada.use-case';

@Injectable()
export class NotificarFeiraCadastradaHandler implements OnModuleInit {
  constructor(private eventos: EventSubscriber, private caso: NotificarFeiraCadastrada) {}

  onModuleInit() {
    this.eventos.inscrever(Eventos.FeiraCadastrada, (dados) => this.caso.executar(dados));
  }
}
