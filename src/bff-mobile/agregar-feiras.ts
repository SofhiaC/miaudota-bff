import { Logger } from '@nestjs/common';
import { urlServico } from '../shared/config';
import { chamarServico } from '../shared/http/chamar-servico';

const logger = new Logger('BFF');

/**
 * A geolocalização devolve a feira com os ids dos animais; o app precisa dos dados deles.
 * O BFF busca tudo no serviço de adoção em UMA chamada e troca os ids pelos animais.
 * Se a adoção estiver fora do ar, as feiras ainda aparecem, só sem os animais.
 */
export async function agregarAnimaisNasFeiras(corpo: any): Promise<any> {
  const feiras: any[] = Array.isArray(corpo) ? corpo : [corpo];
  const ids = [...new Set(feiras.flatMap((f) => (Array.isArray(f?.animais) ? f.animais : [])))] as string[];

  let porId = new Map<string, any>();
  if (ids.length) {
    try {
      const r = await chamarServico({
        url: `${urlServico('adocao')}/internos/animais/disponiveis`,
        metodo: 'POST',
        corpo: { ids },
      });
      if (r.status === 200 && Array.isArray(r.corpo)) porId = new Map(r.corpo.map((a: any) => [a._id, a]));
    } catch {
      logger.warn('Serviço de adoção indisponível: feiras sem os detalhes dos animais');
    }
  }

  const montar = (f: any) => ({
    ...f,
    animais: (Array.isArray(f?.animais) ? f.animais : []).map((id: string) => porId.get(id)).filter(Boolean),
  });
  return Array.isArray(corpo) ? feiras.map(montar) : montar(corpo);
}
