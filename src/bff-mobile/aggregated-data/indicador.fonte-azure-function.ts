import { Injectable } from '@nestjs/common';
import { configFuncao } from '../../shared/config';
import { ServicoIndisponivelError } from '../../shared/errors';
import { correlacaoAtual } from '../../shared/http/contexto';
import { IndicadorAdocao, IndicadorFonte } from './portas';

/**
 * Chama a Azure Function por HTTP. Não usa chamarServico de propósito: aquele helper envia a chave interna do
 * sistema, e ela não pode sair para um serviço externo. Aqui só vai a chave da função (x-functions-key).
 */
@Injectable()
export class IndicadorFonteAzureFunction implements IndicadorFonte {
  async calcular(animaisDisponiveis: number, feirasAtivas: number): Promise<IndicadorAdocao> {
    const { url, chave } = configFuncao();
    const alvo = new URL(url);
    alvo.searchParams.set('animais', String(animaisDisponiveis));
    alvo.searchParams.set('feiras', String(feirasAtivas));

    const cabecalhos: Record<string, string> = {};
    if (chave) cabecalhos['x-functions-key'] = chave;
    const correlacao = correlacaoAtual();
    if (correlacao) cabecalhos['x-correlation-id'] = correlacao;

    let res: Response;
    try {
      // a primeira chamada depois de um tempo parada (cold start) pode demorar
      res = await fetch(alvo, { headers: cabecalhos, signal: AbortSignal.timeout(20000) });
    } catch {
      throw new ServicoIndisponivelError('Azure Function indisponível');
    }
    if (!res.ok) throw new ServicoIndisponivelError(`Azure Function respondeu ${res.status}`);
    return (await res.json()) as IndicadorAdocao;
  }
}
