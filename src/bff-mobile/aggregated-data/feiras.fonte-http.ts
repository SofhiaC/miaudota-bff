import { Injectable } from '@nestjs/common';
import { urlServico } from '../../shared/config';
import { ServicoIndisponivelError } from '../../shared/errors';
import { chamarServico } from '../../shared/http/chamar-servico';
import { FeirasFonte, Usuario } from './portas';

@Injectable()
export class FeirasFonteHttp implements FeirasFonte {
  async listar(usuario: Usuario) {
    const r = await chamarServico({ url: urlServico('geolocalizacao') + '/feiras', usuario });
    if (r.status !== 200 || !Array.isArray(r.corpo)) throw new ServicoIndisponivelError('Serviço de geolocalização indisponível');
    return r.corpo;
  }
}
