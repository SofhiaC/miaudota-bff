import { All, Controller, NotFoundException, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { Public } from '../shared/auth/auth';
import { NomeServico, urlServico } from '../shared/config';
import { chamarServico } from '../shared/http/chamar-servico';
import { agregarAnimaisNasFeiras } from './agregar-feiras';

// Primeiro trecho do caminho -> serviço dono daquele assunto. Só o que está aqui passa; o resto é 404
// (inclusive /internos/*, que nunca pode ser alcançado a partir do app).
const DESTINOS = new Map<string, NomeServico>([
  ['usuarios', 'usuarios'],
  ['animais', 'adocao'],
  ['favoritos', 'adocao'],
  ['solicitacoes', 'adocao'],
  ['feiras', 'geolocalizacao'],
]);

/**
 * BFF do app mobile: recebe as requisições do gateway, chama o serviço certo e adapta a resposta ao
 * formato que o app espera. Hoje só a resposta de feiras precisa de agregação; regras de negócio
 * ficam nos serviços.
 */
@Public() // a identificação do usuário é conferida pelos serviços; aqui só exigimos a chave interna
@Controller()
export class BffController {
  @All('*')
  async encaminhar(@Req() req: Request, @Res() res: Response) {
    const segmento = req.path.split('/')[1];
    const destino = DESTINOS.get(segmento);
    if (!destino) throw new NotFoundException('Rota não encontrada');

    const id = req.headers['x-usuario-id'];
    const tipo = req.headers['x-usuario-tipo'];
    const usuario = typeof id === 'string' && typeof tipo === 'string' ? { id, tipo } : undefined;

    const temCorpo = !['GET', 'HEAD', 'DELETE'].includes(req.method) && req.body && Object.keys(req.body).length > 0;
    const r = await chamarServico({
      url: urlServico(destino) + req.originalUrl,
      metodo: req.method,
      corpo: temCorpo ? req.body : undefined,
      usuario,
    });

    let corpo = r.corpo;
    if (segmento === 'feiras' && r.status >= 200 && r.status < 300 && corpo) {
      corpo = await agregarAnimaisNasFeiras(corpo);
    }

    res.status(r.status);
    if (corpo === null || corpo === undefined || r.status === 204) return res.end();
    return typeof corpo === 'string' ? res.send(corpo) : res.json(corpo);
  }
}
