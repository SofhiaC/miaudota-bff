import { Email } from '../domain/mensagens';

/** Porta de saída: quem entrega o e-mail. Hoje é o webhook do n8n; trocar de provedor não afeta os casos de uso. */
export abstract class EnviadorDeEmail {
  abstract enviar(email: Email): Promise<void>;
}
