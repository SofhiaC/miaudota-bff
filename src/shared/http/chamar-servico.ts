import { Logger } from '@nestjs/common';
import { chaveInterna } from '../config';
import { ServicoIndisponivelError } from '../errors';
import { correlacaoAtual } from './contexto';

export type RespostaServico = { status: number; corpo: any };

const logger = new Logger('ChamadaInterna');

/**
 * Chamada HTTP entre componentes internos (gateway -> BFF -> serviços).
 * Devolve status e corpo sem lançar para respostas 4xx/5xx (quem chama decide);
 * só lança ServicoIndisponivelError quando não consegue falar com o serviço.
 */
export async function chamarServico(opcoes: {
  url: string;
  metodo?: string;
  corpo?: unknown;
  usuario?: { id: string; tipo: string };
  timeoutMs?: number;
}): Promise<RespostaServico> {
  const cabecalhos: Record<string, string> = { 'x-internal-key': chaveInterna() };
  if (opcoes.corpo !== undefined) cabecalhos['content-type'] = 'application/json';
  const correlacaoId = correlacaoAtual();
  if (correlacaoId) cabecalhos['x-correlation-id'] = correlacaoId;
  if (opcoes.usuario) {
    cabecalhos['x-usuario-id'] = opcoes.usuario.id;
    cabecalhos['x-usuario-tipo'] = opcoes.usuario.tipo;
  }

  try {
    const res = await fetch(opcoes.url, {
      method: opcoes.metodo ?? 'GET',
      headers: cabecalhos,
      body: opcoes.corpo !== undefined ? JSON.stringify(opcoes.corpo) : undefined,
      signal: AbortSignal.timeout(opcoes.timeoutMs ?? 8000),
    });
    const texto = await res.text();
    let corpo: any = null;
    if (texto) {
      try { corpo = JSON.parse(texto); } catch { corpo = texto; }
    }
    return { status: res.status, corpo };
  } catch (e: any) {
    logger.warn(`Falha ao chamar ${opcoes.url.split('?')[0]}: ${e?.message}`);
    throw new ServicoIndisponivelError('Serviço indisponível no momento');
  }
}
