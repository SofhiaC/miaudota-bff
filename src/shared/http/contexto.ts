import { AsyncLocalStorage } from 'async_hooks';

/** Guarda o identificador de correlação da requisição atual, para as chamadas entre serviços o repassarem. */
export const contexto = new AsyncLocalStorage<{ correlacaoId: string }>();
export const correlacaoAtual = () => contexto.getStore()?.correlacaoId;
