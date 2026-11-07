import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { ServicoIndisponivelError } from '../shared/errors';
import { AgregarDados } from '../bff-mobile/aggregated-data/agregar-dados.use-case';
import { AnimaisFonte, FeirasFonte, IndicadorAdocao, IndicadorFonte } from '../bff-mobile/aggregated-data/portas';

const usuario = { id: 'u1', tipo: 'PESSOA' };
const indicador: IndicadorAdocao = {
  animaisDisponiveis: 2, feirasAtivas: 1, animaisPorFeira: 2, pontuacao: 14, nivel: 'BAIXA', mensagem: 'ok', geradoEm: 'agora',
};

const animais = (r: any[] | Error): AnimaisFonte => ({ listar: async () => { if (r instanceof Error) throw r; return r; } });
const feiras = (r: any[] | Error): FeirasFonte => ({ listar: async () => { if (r instanceof Error) throw r; return r; } });
const funcao = (r: IndicadorAdocao | Error) => {
  const chamadas: number[][] = [];
  const f: IndicadorFonte = { calcular: async (a, b) => { chamadas.push([a, b]); if (r instanceof Error) throw r; return r; } };
  return { f, chamadas };
};

describe('GET /aggregated-data (AgregarDados)', () => {
  test('junta as três fontes e não é parcial', async () => {
    const { f, chamadas } = funcao(indicador);
    const r = await new AgregarDados(animais([{ disponivel: true }, { disponivel: false }]), feiras([{}]), f).executar(usuario);
    assert.equal(r.parcial, false);
    assert.equal(r.animais.status, 'ok');
    assert.equal(r.feiras.status, 'ok');
    assert.equal(r.indicadorAdocao.status, 'ok');
    assert.deepEqual(chamadas, [[1, 1]]); // só conta animais disponíveis
  });
  test('Azure Function fora do ar → resposta parcial, o resto continua', async () => {
    const r = await new AgregarDados(animais([{}]), feiras([{}]), funcao(new Error('timeout')).f).executar(usuario);
    assert.equal(r.parcial, true);
    assert.equal(r.indicadorAdocao.status, 'indisponivel');
    assert.equal((r.indicadorAdocao as any).motivo, 'timeout');
    assert.equal(r.animais.status, 'ok');
  });
  test('serviço de feiras fora do ar → parcial e indicador não é calculado', async () => {
    const { f, chamadas } = funcao(indicador);
    const r = await new AgregarDados(animais([{}]), feiras(new Error('sql off')), f).executar(usuario);
    assert.equal(r.parcial, true);
    assert.equal(r.feiras.status, 'indisponivel');
    assert.equal(chamadas.length, 0);
  });
  test('limita os itens devolvidos a 10, mas informa o total', async () => {
    const muitos = Array.from({ length: 25 }, () => ({}));
    const r: any = await new AgregarDados(animais(muitos), feiras([]), funcao(indicador).f).executar(usuario);
    assert.equal(r.animais.total, 25);
    assert.equal(r.animais.itens.length, 10);
  });
  test('nenhuma fonte responde → 503', async () => {
    await assert.rejects(
      new AgregarDados(animais(new Error('a')), feiras(new Error('b')), funcao(new Error('c')).f).executar(usuario),
      ServicoIndisponivelError,
    );
  });
});
