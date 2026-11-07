import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

export type UsuarioLogado = { id: string; tipo: 'PESSOA' | 'ONG' };

export const PUBLICA = 'rota_publica';
export const PERFIS = 'perfis';

/** Libera a rota da exigência de usuário identificado (login, cadastro e rotas internas). */
export const Public = () => SetMetadata(PUBLICA, true);

/** Restringe a rota a um ou mais perfis. Ex.: @Roles('ONG') */
export const Roles = (...perfis: string[]) => SetMetadata(PERFIS, perfis);

/** Injeta { id, tipo } do usuário que o API Gateway autenticou. */
export const UsuarioAtual = createParamDecorator(
  (_dado: unknown, ctx: ExecutionContext): UsuarioLogado => ctx.switchToHttp().getRequest().usuario,
);
