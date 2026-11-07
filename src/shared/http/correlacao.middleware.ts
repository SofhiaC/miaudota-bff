import { Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { contexto } from './contexto';

/**
 * Gera (ou reaproveita) o x-correlation-id e registra uma linha por requisição.
 * Só o caminho vai para o log: query string pode ter localização e outros dados pessoais.
 */
export function correlacao(servico: string) {
  const logger = new Logger(servico);
  return (req: any, res: any, next: () => void) => {
    const recebido = String(req.headers['x-correlation-id'] ?? '');
    const id = /^[\w-]{8,64}$/.test(recebido) ? recebido : randomUUID();
    res.setHeader('x-correlation-id', id);
    const inicio = Date.now();
    res.on('finish', () => logger.log(`[${id.slice(0, 8)}] ${req.method} ${req.path} -> ${res.statusCode} (${Date.now() - inicio}ms)`));
    contexto.run({ correlacaoId: id }, next);
  };
}
