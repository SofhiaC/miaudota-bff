/** Erros de domínio: o domínio e os casos de uso não conhecem HTTP. O filtro global traduz para status. */
export class ErroDeDominio extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = new.target.name;
  }
}
export class NaoAutenticadoError extends ErroDeDominio {} // 401
export class AcessoNegadoError extends ErroDeDominio {} // 403
export class NaoEncontradoError extends ErroDeDominio {} // 404
export class ConflitoError extends ErroDeDominio {} // 409
export class RegraDeNegocioError extends ErroDeDominio {} // 422
export class ServicoIndisponivelError extends ErroDeDominio {} // 503
