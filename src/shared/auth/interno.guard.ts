import {
  CanActivate, ExecutionContext, ForbiddenException, Injectable, Module, UnauthorizedException,
} from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { timingSafeEqual } from 'crypto';
import { chaveInterna } from '../config';
import { PERFIS, PUBLICA, UsuarioLogado } from './auth';

function iguais(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * Guard dos serviços internos. O JWT já foi validado no API Gateway, que repassa o usuário
 * nos cabeçalhos x-usuario-id e x-usuario-tipo. Aqui conferimos:
 *  1) a chave interna (só gateway/BFF/serviços conseguem chamar);
 *  2) o usuário identificado (exceto rotas @Public);
 *  3) o perfil exigido pela rota (@Roles).
 */
@Injectable()
export class InternoGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();

    if (!iguais(String(req.headers['x-internal-key'] ?? ''), chaveInterna())) {
      throw new UnauthorizedException('Chamada interna não autorizada');
    }

    const alvos = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(PUBLICA, alvos)) return true;

    const id = String(req.headers['x-usuario-id'] ?? '');
    const tipo = String(req.headers['x-usuario-tipo'] ?? '');
    if (!id || (tipo !== 'PESSOA' && tipo !== 'ONG')) throw new UnauthorizedException('Usuário não identificado');
    req.usuario = { id, tipo } as UsuarioLogado;

    const perfis = this.reflector.getAllAndOverride<string[]>(PERFIS, alvos);
    if (perfis && !perfis.includes(tipo)) throw new ForbiddenException('Acesso negado para este perfil');
    return true;
  }
}

@Module({ providers: [{ provide: APP_GUARD, useClass: InternoGuard }] })
export class AuthInternoModule {}
