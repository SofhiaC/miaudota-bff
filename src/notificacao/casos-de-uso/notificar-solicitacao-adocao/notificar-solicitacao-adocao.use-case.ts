import { Injectable, Logger } from '@nestjs/common';
import { SolicitacaoAdocaoCriadaDados } from '../../../shared/events/eventos';
import { EnviadorDeEmail } from '../../application/enviador-de-email';
import { solicitacaoAdocao } from '../../domain/mensagens';

@Injectable()
export class NotificarSolicitacaoAdocao {
  private logger = new Logger('NotificarSolicitacaoAdocao');

  constructor(private email: EnviadorDeEmail) {}

  async executar(dados: SolicitacaoAdocaoCriadaDados) {
    if (!dados.destinatarioEmail) {
      // o serviço de usuários estava fora do ar quando o pedido foi criado: não há para quem enviar
      this.logger.warn(`Pedido ${dados.solicitacaoId} sem e-mail do dono do animal; notificação ignorada`);
      return;
    }
    await this.email.enviar(solicitacaoAdocao({ ...dados, destinatarioEmail: dados.destinatarioEmail }));
  }
}
