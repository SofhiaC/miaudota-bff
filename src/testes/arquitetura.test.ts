import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, dirname, sep } from 'node:path';

/**
 * Testes de arquitetura: leem o código-fonte (src/) e verificam as regras de dependência da
 * Clean Architecture e do Vertical Slice. Se alguém violar uma regra, o teste falha e diz qual arquivo.
 *   domain  ←  application / casos-de-uso  ←  infrastructure / presentation
 * (a seta aponta para quem pode ser importado: o domínio não depende de nada de fora dele).
 */
const SRC = resolve(__dirname, '..', '..', 'src');
// cada repositório leva só alguns serviços: as regras valem para os que existem na pasta src
const MODULOS = ['usuarios', 'adocao', 'geolocalizacao', 'notificacao'].filter((m) => existsSync(join(SRC, m)));
const SERVICOS_COM_CAMADAS = MODULOS.filter((m) => m !== 'notificacao');

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? arquivos(p) : p.endsWith('.ts') ? [p] : [];
  });
}
const todos = arquivos(SRC).filter((p) => !p.includes(`${sep}testes${sep}`));
const rel = (p: string) => relative(SRC, p).split(sep).join('/');

type Import = { de: string; alvo: string; bruto: string };
function importsDe(arquivo: string): Import[] {
  const texto = readFileSync(arquivo, 'utf8');
  const out: Import[] = [];
  for (const m of texto.matchAll(/(?:import|export)\s[^;]*?from\s+['"]([^'"]+)['"]/g)) {
    const bruto = m[1];
    const alvo = bruto.startsWith('.') ? rel(resolve(dirname(arquivo), bruto)) : bruto;
    out.push({ de: rel(arquivo), alvo, bruto });
  }
  return out;
}
const pasta = (caminho: string, nome: string) => caminho.split('/').includes(nome);
const violacoes = (lista: string[]) => lista.length ? `Violações:\n  - ${lista.join('\n  - ')}` : '';

describe('Clean Architecture: regra de dependência', () => {
  test('a estrutura esperada existe em cada serviço', () => {
    for (const m of SERVICOS_COM_CAMADAS) {
      for (const camada of ['domain', 'infrastructure', 'casos-de-uso']) {
        assert.ok(statSync(join(SRC, m, camada)).isDirectory(), `${m}/${camada} não existe`);
      }
    }
  });

  test('domain não importa frameworks nem outras camadas', () => {
    const ruins: string[] = [];
    const proibidos = /^(@nestjs|mongoose|mssql|amqplib|express|bcryptjs|rxjs|class-validator|class-transformer)/;
    for (const f of todos.filter((p) => pasta(rel(p), 'domain'))) {
      for (const i of importsDe(f)) {
        const ok =
          i.alvo.startsWith('shared/errors') || // erros de domínio compartilhados
          i.alvo.startsWith('shared/events/eventos') || // contratos (interfaces) dos eventos: shared kernel
          (!i.bruto.startsWith('.') ? false : /\/domain\//.test(`/${i.alvo}`) || i.bruto.startsWith('./')); // só o próprio domain
        if (proibidos.test(i.alvo) || !ok) ruins.push(`${i.de} → ${i.bruto}`);
      }
    }
    assert.equal(ruins.length, 0, violacoes(ruins));
  });

  test('casos de uso e application não dependem de infrastructure nem de presentation', () => {
    const ruins: string[] = [];
    for (const f of todos.filter((p) => pasta(rel(p), 'casos-de-uso') || pasta(rel(p), 'application'))) {
      if (/\.(controller|handler)\.ts$/.test(f)) continue; // controllers e handlers são a borda (entrada), não o núcleo
      for (const i of importsDe(f)) {
        if (/\/(infrastructure|presentation)(\/|$)/.test(`/${i.alvo}`) || /^(mongoose|mssql|amqplib|@nestjs\/mongoose)/.test(i.alvo)) {
          ruins.push(`${i.de} → ${i.bruto}`);
        }
      }
    }
    assert.equal(ruins.length, 0, violacoes(ruins));
  });

  test('application e casos de uso dependem de portas (abstract class), não de adaptadores concretos', () => {
    const ruins: string[] = [];
    const adaptador = /(mongo-repository|sql-repository|gateway-http|fonte-http|fonte-azure-function|n8n-webhook)/;
    for (const f of todos.filter((p) => /\.use-case\.ts$/.test(p) || pasta(rel(p), 'application'))) {
      for (const i of importsDe(f)) if (adaptador.test(i.alvo)) ruins.push(`${i.de} → ${i.bruto}`);
    }
    assert.equal(ruins.length, 0, violacoes(ruins));
  });

  test('infrastructure não importa casos de uso nem controllers', () => {
    const ruins: string[] = [];
    for (const f of todos.filter((p) => pasta(rel(p), 'infrastructure'))) {
      for (const i of importsDe(f)) if (/casos-de-uso/.test(i.alvo)) ruins.push(`${i.de} → ${i.bruto}`);
    }
    assert.equal(ruins.length, 0, violacoes(ruins));
  });
});

describe('Isolamento entre microsserviços', () => {
  test('um serviço não importa o código de outro (só `shared`)', () => {
    const ruins: string[] = [];
    for (const m of MODULOS) {
      for (const f of todos.filter((p) => rel(p).startsWith(`${m}/`))) {
        for (const i of importsDe(f)) {
          const outro = MODULOS.find((x) => x !== m && i.alvo.startsWith(`${x}/`));
          if (outro) ruins.push(`${i.de} → ${i.bruto}`);
        }
      }
    }
    assert.equal(ruins.length, 0, violacoes(ruins));
  });

  test('o BFF e o gateway não importam domínio nem infraestrutura dos serviços', () => {
    const ruins: string[] = [];
    for (const f of todos.filter((p) => rel(p).startsWith('bff-mobile/') || rel(p).startsWith('api-gateway/'))) {
      for (const i of importsDe(f)) {
        if (MODULOS.some((x) => i.alvo.startsWith(`${x}/`))) ruins.push(`${i.de} → ${i.bruto}`);
      }
    }
    assert.equal(ruins.length, 0, violacoes(ruins));
  });
});

describe('Vertical Slice', () => {
  test('um caso de uso (pasta em casos-de-uso) não importa outro caso de uso', () => {
    const ruins: string[] = [];
    for (const f of todos.filter((p) => pasta(rel(p), 'casos-de-uso'))) {
      const partes = rel(f).split('/');
      const fatia = partes[partes.indexOf('casos-de-uso') + 1];
      for (const i of importsDe(f)) {
        const p = i.alvo.split('/');
        const k = p.indexOf('casos-de-uso');
        if (k >= 0 && p[k + 1] !== fatia && p.slice(0, k).join('/') === partes.slice(0, partes.indexOf('casos-de-uso')).join('/')) {
          ruins.push(`${i.de} → ${i.bruto}`);
        }
      }
    }
    assert.equal(ruins.length, 0, violacoes(ruins));
  });

  test('cada fatia tem um use-case e, quando exposta por HTTP, o controller na mesma pasta', () => {
    const ruins: string[] = [];
    for (const m of SERVICOS_COM_CAMADAS) {
      const base = join(SRC, m, 'casos-de-uso');
      for (const fatia of readdirSync(base)) {
        const nomes = readdirSync(join(base, fatia));
        if (!nomes.some((n) => n.endsWith('.use-case.ts'))) ruins.push(`${m}/casos-de-uso/${fatia}: falta *.use-case.ts`);
        if (!nomes.some((n) => /\.(controller|handler)\.ts$/.test(n))) ruins.push(`${m}/casos-de-uso/${fatia}: falta controller/handler`);
      }
    }
    assert.equal(ruins.length, 0, violacoes(ruins));
  });
});
