import { Injectable } from '@nestjs/common';
import { ServicoIndisponivelError } from '../../shared/errors';
import { AnimaisFonte, FeirasFonte, IndicadorFonte, Usuario } from './portas';

const LIMITE_ITENS = 10;

const motivo = (erro: unknown) => (erro instanceof Error ? erro.message : 'Falha desconhecida');

/**
 * GET /aggregated-data: junta, numa resposta só, o que o app precisaria de três chamadas:
 * animais (microsserviço de adoção / MongoDB), feiras (microsserviço de geolocalização / Azure SQL) e o
 * indicador calculado pela Azure Function. Se uma fonte cair, as outras continuam e a resposta vem com parcial=true.
 */
@Injectable()
export class AgregarDados {
  constructor(
    private animais: AnimaisFonte,
    private feiras: FeirasFonte,
    private indicador: IndicadorFonte,
  ) {}

  async executar(usuario: Usuario) {
    const [animaisR, feirasR] = await Promise.allSettled([this.animais.listar(usuario), this.feiras.listar(usuario)]);
    const animais = animaisR.status === 'fulfilled' ? animaisR.value : null;
    const feiras = feirasR.status === 'fulfilled' ? feirasR.value : null;

    // a função precisa das duas contagens; sem uma das fontes, não há o que calcular
    let indicador: Awaited<ReturnType<IndicadorFonte['calcular']>> | null = null;
    let erroIndicador = 'Não calculado: depende dos animais e das feiras';
    if (animais && feiras) {
      const disponiveis = animais.filter((a) => a?.disponivel !== false).length;
      try {
        indicador = await this.indicador.calcular(disponiveis, feiras.length);
      } catch (erro) {
        erroIndicador = motivo(erro);
      }
    }

    if (!animais && !feiras && !indicador) throw new ServicoIndisponivelError('Nenhuma fonte de dados respondeu');

    return {
      usuario,
      animais: animais
        ? { origem: 'microsservico-adocao (MongoDB)', status: 'ok', total: animais.length, itens: animais.slice(0, LIMITE_ITENS) }
        : { origem: 'microsservico-adocao (MongoDB)', status: 'indisponivel', motivo: motivo((animaisR as PromiseRejectedResult).reason) },
      feiras: feiras
        ? { origem: 'microsservico-geolocalizacao (Azure SQL)', status: 'ok', total: feiras.length, itens: feiras.slice(0, LIMITE_ITENS) }
        : { origem: 'microsservico-geolocalizacao (Azure SQL)', status: 'indisponivel', motivo: motivo((feirasR as PromiseRejectedResult).reason) },
      indicadorAdocao: indicador
        ? { origem: 'azure-function', status: 'ok', ...indicador }
        : { origem: 'azure-function', status: 'indisponivel', motivo: erroIndicador },
      parcial: !(animais && feiras && indicador),
      geradoEm: new Date().toISOString(),
    };
  }
}
