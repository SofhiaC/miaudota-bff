export const Eventos = {
  UsuarioCadastrado: 'UsuarioCadastrado',
  UsuarioExcluido: 'UsuarioExcluido',
  SolicitacaoAdocaoCriada: 'SolicitacaoAdocaoCriada',
  FeiraCadastrada: 'FeiraCadastrada',
} as const;

export type NomeEvento = (typeof Eventos)[keyof typeof Eventos];
export type ManipuladorDeEvento = (dados: any) => Promise<void> | void;

/** Porta: quem publica eventos de domínio. Hoje é em memória; depois vira RabbitMQ sem mudar os casos de uso. */
export abstract class EventPublisher {
  abstract publicar(nome: NomeEvento, dados: Record<string, unknown>): Promise<void>;
}

/** Porta: quem se inscreve para consumir eventos. */
export abstract class EventSubscriber {
  abstract inscrever(nome: NomeEvento, manipulador: ManipuladorDeEvento): void;
}

/** Conteúdo (`dados`) de cada evento. Os eventos já levam o que o e-mail precisa, para a função de notificação não consultar ninguém. */
export interface UsuarioCadastradoDados {
  usuarioId: string;
  nome: string;
  email: string;
  tipo: 'PESSOA' | 'ONG';
}

export interface SolicitacaoAdocaoCriadaDados {
  solicitacaoId: string;
  animalId: string;
  animalNome: string;
  destinatarioEmail?: string; // e-mail do dono do animal (ausente se o serviço de usuários estava fora do ar)
  adotanteNome?: string;
}

export interface FeiraCadastradaDados {
  feiraId: string;
  nome: string;
  endereco: string;
  dataInicio: string; // ISO
  dataFim: string; // ISO
  idOng: string;
  ongNome?: string;
  destinatarioEmail?: string; // e-mail da ONG
}
