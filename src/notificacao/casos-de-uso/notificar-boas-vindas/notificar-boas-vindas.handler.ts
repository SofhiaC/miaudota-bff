import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventSubscriber, Eventos } from '../../../shared/events/eventos';
import { NotificarBoasVindas } from './notificar-boas-vindas.use-case';

@Injectable()
export class NotificarBoasVindasHandler implements OnModuleInit {
  constructor(private eventos: EventSubscriber, private caso: NotificarBoasVindas) {}

  onModuleInit() {
    this.eventos.inscrever(Eventos.UsuarioCadastrado, (dados) => this.caso.executar(dados));
  }
}
