import { All, Controller, NotFoundException, Req, Res, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { urlServico } from '../shared/config';
import { chamarServico } from '../shared/http/chamar-servico';

// Únicas rotas que dispensam token (decisão 9.3 do documento).
const ROTAS_PUBLICAS = new Set(['POST /usuarios', 'POST /usuarios/login']);

/**
 * Ponto único de entrada do sistema. Aqui ficam: validação do JWT, rate limit (middleware) e roteamento
 * para o BFF. Nenhuma regra de negócio. Qualquer cabeçalho interno enviado pelo cliente é descartado:
 * só repassamos o usuário que NÓS identificamos pelo token.
 */
@Controller()
export class ProxyController {
  constructor(private jwt: JwtService) {}

  @All('*')
  async encaminhar(@Req() req: Request, @Res() res: Response) {
    const caminho = req.path.replace(/\/+$/, '') || '/';
    if (caminho.startsWith('/internos')) throw new NotFoundException('Rota não encontrada');

    const usuario = ROTAS_PUBLICAS.has(`${req.method} ${caminho}`) ? undefined : await this.autenticar(req);

    const temCorpo = !['GET', 'HEAD', 'DELETE'].includes(req.method) && req.body && Object.keys(req.body).length > 0;
    const r = await chamarServico({
      url: urlServico('bff') + req.originalUrl,
      metodo: req.method,
      corpo: temCorpo ? req.body : undefined,
      usuario,
    });

    res.status(r.status);
    if (r.corpo === null || r.corpo === undefined || r.status === 204) return res.end();
    return typeof r.corpo === 'string' ? res.send(r.corpo) : res.json(r.corpo);
  }

  private async autenticar(req: Request) {
    const [esquema, token] = (req.headers.authorization || '').split(' ');
    if (esquema !== 'Bearer' || !token) throw new UnauthorizedException('Token ausente');
    try {
      const payload = await this.jwt.verifyAsync(token);
      return { id: String(payload.sub), tipo: String(payload.tipo) };
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }
}
