import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import {
  AcessoNegadoError, ConflitoError, ErroDeDominio, NaoAutenticadoError,
  NaoEncontradoError, RegraDeNegocioError, ServicoIndisponivelError,
} from '../errors';

const CODIGOS: Record<number, string> = {
  400: 'REQUISICAO_INVALIDA',
  401: 'NAO_AUTENTICADO',
  403: 'ACESSO_NEGADO',
  404: 'NAO_ENCONTRADO',
  409: 'CONFLITO',
  422: 'DADOS_INVALIDOS',
  429: 'MUITAS_REQUISICOES',
  500: 'ERRO_INTERNO',
  503: 'SERVICO_INDISPONIVEL',
};

function statusDoErroDeDominio(erro: ErroDeDominio): number {
  if (erro instanceof NaoAutenticadoError) return 401;
  if (erro instanceof AcessoNegadoError) return 403;
  if (erro instanceof NaoEncontradoError) return 404;
  if (erro instanceof ConflitoError) return 409;
  if (erro instanceof RegraDeNegocioError) return 422;
  if (erro instanceof ServicoIndisponivelError) return 503;
  return 400;
}

/** Toda resposta de erro sai como { statusCode, codigo, mensagem }. Detalhes internos só no log. */
@Catch()
export class FiltroDeExcecoes implements ExceptionFilter {
  private logger = new Logger('Erros');

  catch(erro: any, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    let status = 500;
    let mensagem: string | string[] = 'Erro interno do servidor';

    if (erro instanceof HttpException) {
      status = erro.getStatus();
      const corpo: any = erro.getResponse();
      mensagem = typeof corpo === 'string' ? corpo : corpo.message ?? erro.message;
    } else if (erro instanceof ErroDeDominio) {
      status = statusDoErroDeDominio(erro);
      mensagem = erro.message;
    } else {
      this.logger.error(erro?.message, erro?.stack);
    }

    res.status(status).json({ statusCode: status, codigo: CODIGOS[status] ?? 'ERRO', mensagem });
  }
}
