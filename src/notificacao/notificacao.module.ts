import { Module } from '@nestjs/common';
import { EventsModule } from '../shared/events/events.module';
import { EnviadorDeEmail } from './application/enviador-de-email';
import { EnviadorN8nWebhook } from './infrastructure/n8n-webhook.enviador';
import { NotificarBoasVindas } from './casos-de-uso/notificar-boas-vindas/notificar-boas-vindas.use-case';
import { NotificarBoasVindasHandler } from './casos-de-uso/notificar-boas-vindas/notificar-boas-vindas.handler';
import { NotificarSolicitacaoAdocao } from './casos-de-uso/notificar-solicitacao-adocao/notificar-solicitacao-adocao.use-case';
import { NotificarSolicitacaoAdocaoHandler } from './casos-de-uso/notificar-solicitacao-adocao/notificar-solicitacao-adocao.handler';
import { NotificarFeiraCadastrada } from './casos-de-uso/notificar-feira-cadastrada/notificar-feira-cadastrada.use-case';
import { NotificarFeiraCadastradaHandler } from './casos-de-uso/notificar-feira-cadastrada/notificar-feira-cadastrada.handler';

/** Função de notificação: sem HTTP, sem banco. Só consome eventos e aciona o n8n. */
@Module({
  imports: [EventsModule.registrar('notificacao')],
  providers: [
    NotificarBoasVindas, NotificarBoasVindasHandler,
    NotificarSolicitacaoAdocao, NotificarSolicitacaoAdocaoHandler,
    NotificarFeiraCadastrada, NotificarFeiraCadastradaHandler,
    { provide: EnviadorDeEmail, useClass: EnviadorN8nWebhook },
  ],
})
export class NotificacaoModule {}
