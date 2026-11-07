import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventSubscriber, Eventos } from '../../../shared/events/eventos';
import { NotificarSolicitacaoAdocao } from './notificar-solicitacao-adocao.use-case';

@Injectable()
export class NotificarSolicitacaoAdocaoHandler implements OnModuleInit {
  constructor(private eventos: EventSubscriber, private caso: NotificarSolicitacaoAdocao) {}

  onModuleInit() {
    this.eventos.inscrever(Eventos.SolicitacaoAdocaoCriada, (dados) => this.caso.executar(dados));
  }
}
