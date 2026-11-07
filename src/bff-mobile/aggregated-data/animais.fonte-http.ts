import { Injectable } from '@nestjs/common';
import { urlServico } from '../../shared/config';
import { ServicoIndisponivelError } from '../../shared/errors';
import { chamarServico } from '../../shared/http/chamar-servico';
import { AnimaisFonte, Usuario } from './portas';

@Injectable()
export class AnimaisFonteHttp implements AnimaisFonte {
  async listar(usuario: Usuario) {
    const rota = usuario.tipo === 'ONG' ? '/animais/meus' : '/animais';
    const r = await chamarServico({ url: urlServico('adocao') + rota, usuario });
    if (r.status !== 200 || !Array.isArray(r.corpo)) throw new ServicoIndisponivelError('Serviço de adoção indisponível');
    return r.corpo;
  }
}
