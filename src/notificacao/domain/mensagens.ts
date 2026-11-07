import { FeiraCadastradaDados, SolicitacaoAdocaoCriadaDados, UsuarioCadastradoDados } from '../../shared/events/eventos';

export type TipoDeEmail = 'BOAS_VINDAS' | 'SOLICITACAO_ADOCAO' | 'FEIRA_CADASTRADA';

/** O que é entregue ao n8n. O n8n só envia; o texto padrão sai daqui, mas ele pode trocar por outro se quiser. */
export type Email = {
  tipo: TipoDeEmail;
  destinatario: string;
  assunto: string;
  texto: string;
  html: string;
  dados: Record<string, unknown>;
};

function escaparHtml(texto: string) {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Monta texto e HTML a partir das mesmas linhas. Tudo que vem do usuário é escapado no HTML. */
function montar(tipo: TipoDeEmail, destinatario: string, assunto: string, linhas: string[], dados: object): Email {
  const paragrafos = linhas.map((l) => `<p style="margin:0 0 12px">${escaparHtml(l)}</p>`).join('');
  return {
    tipo,
    destinatario,
    assunto,
    texto: linhas.join('\n\n'),
    html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#222"><h2 style="margin:0 0 16px">🐾 Miaudota</h2>${paragrafos}</div>`,
    dados: dados as Record<string, unknown>,
  };
}

const formatarData = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' });

export function boasVindas(d: UsuarioCadastradoDados): Email {
  const o_que_fazer =
    d.tipo === 'ONG'
      ? 'Agora você pode cadastrar os animais disponíveis para adoção, divulgar feiras de adoção no mapa e escolher quais animais levará a cada uma.'
      : 'Agora você pode conhecer animais que esperam por um lar, curtir seus favoritos e abrir pedidos de adoção. Se tiver um animal para doar, é só cadastrá-lo em "Meus animais".';
  return montar('BOAS_VINDAS', d.email, `Bem-vindo(a) ao Miaudota, ${d.nome}!`, [
    `Olá, ${d.nome}!`,
    'Sua conta no Miaudota foi criada com sucesso.',
    o_que_fazer,
    'Obrigado por ajudar a dar um lar a quem precisa!',
  ], d);
}

export function solicitacaoAdocao(d: SolicitacaoAdocaoCriadaDados & { destinatarioEmail: string }): Email {
  return montar('SOLICITACAO_ADOCAO', d.destinatarioEmail, `Novo pedido de adoção para ${d.animalNome}`, [
    'Olá!',
    `${d.adotanteNome ?? 'Alguém'} quer adotar ${d.animalNome}.`,
    'Abra o Miaudota, vá em "Pedidos" e depois "Recebidos" para ver o contato e aprovar ou recusar o pedido.',
  ], d);
}

export function feiraCadastrada(d: FeiraCadastradaDados & { destinatarioEmail: string }): Email {
  return montar('FEIRA_CADASTRADA', d.destinatarioEmail, `Feira cadastrada: ${d.nome}`, [
    d.ongNome ? `Olá, ${d.ongNome}!` : 'Olá!',
    `A feira de adoção "${d.nome}" foi cadastrada e já aparece no mapa para quem está por perto.`,
    `Local: ${d.endereco}`,
    `Período: ${formatarData(d.dataInicio)} até ${formatarData(d.dataFim)}`,
    'Para escolher quais animais você levará, abra a aba "Feiras" do app.',
  ], d);
}
