import { Injectable, Logger } from '@nestjs/common';
import { EnviadorDeEmail } from '../application/enviador-de-email';
import { Email } from '../domain/mensagens';

const TENTATIVAS = 3;
const TIMEOUT_MS = 10_000;
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Entrega o e-mail ao n8n por webhook (HTTPS/JSON): timeout curto e poucas tentativas.
 * Se não der, lança erro: o barramento manda a mensagem para a fila de descarte (".dlq"),
 * de onde ela pode ser reenviada depois (npm run notificacao:reenviar). A ação do usuário nunca é desfeita.
 */
@Injectable()
export class EnviadorN8nWebhook implements EnviadorDeEmail {
  private logger = new Logger('N8nWebhook');

  async enviar(email: Email) {
    const url = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/miaudota-email';
    const cabecalhos: Record<string, string> = { 'content-type': 'application/json' };
    if (process.env.N8N_WEBHOOK_TOKEN) cabecalhos['x-miaudota-token'] = process.env.N8N_WEBHOOK_TOKEN;

    let ultimoErro = '';
    for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa++) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: cabecalhos,
          body: JSON.stringify(email),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (res.ok) {
          this.logger.log(`E-mail "${email.tipo}" entregue ao n8n`); // sem endereço no log
          return;
        }
        ultimoErro = `n8n respondeu ${res.status}`;
        // erro do nosso lado (ex.: 404 = workflow não ativado): repetir não adianta
        if (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429) break;
      } catch (e: any) {
        ultimoErro = e?.message ?? 'falha de rede';
      }
      if (tentativa < TENTATIVAS) await esperar(tentativa * 1000);
    }
    throw new Error(`Falha ao acionar o webhook do n8n: ${ultimoErro}`);
  }
}
