import { Injectable, Logger } from '@nestjs/common';
import { FeiraCadastradaDados } from '../../../shared/events/eventos';
import { EnviadorDeEmail } from '../../application/enviador-de-email';
import { feiraCadastrada } from '../../domain/mensagens';

@Injectable()
export class NotificarFeiraCadastrada {
  private logger = new Logger('NotificarFeiraCadastrada');

  constructor(private email: EnviadorDeEmail) {}

  async executar(dados: FeiraCadastradaDados) {
    if (!dados.destinatarioEmail) {
      this.logger.warn(`Feira ${dados.feiraId} sem e-mail da ONG; notificação ignorada`);
      return;
    }
    await this.email.enviar(feiraCadastrada({ ...dados, destinatarioEmail: dados.destinatarioEmail }));
  }
}
