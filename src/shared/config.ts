/** Configuração lida das variáveis de ambiente (o .env é carregado pelo main.ts de cada serviço). */

const avisos = new Set<string>();
function avisarUmaVez(chave: string, mensagem: string) {
  if (avisos.has(chave)) return;
  avisos.add(chave);
  console.warn(`[AVISO] ${mensagem}`);
}

export function segredoJwt() {
  const s = process.env.JWT_SECRET;
  if (!s && process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET é obrigatório em produção');
  if (!s) avisarUmaVez('jwt', 'JWT_SECRET não definido, usando segredo de desenvolvimento.');
  return s || 'segredo-apenas-para-desenvolvimento';
}

/** Chave compartilhada entre gateway, BFF e serviços: sem ela, os serviços recusam a chamada. */
export function chaveInterna() {
  const s = process.env.INTERNAL_API_KEY;
  if (!s && process.env.NODE_ENV === 'production') throw new Error('INTERNAL_API_KEY é obrigatório em produção');
  if (!s) avisarUmaVez('interna', 'INTERNAL_API_KEY não definido, usando chave de desenvolvimento.');
  return s || 'chave-interna-apenas-para-desenvolvimento';
}

export function urlRabbit() {
  return process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
}

export function uriMongo(dominio: 'USUARIOS' | 'ADOCAO') {
  return process.env[`MONGO_URI_${dominio}`] || `mongodb://localhost:27017/miaudota_${dominio.toLowerCase()}`;
}

export type NomeServico = 'usuarios' | 'adocao' | 'geolocalizacao' | 'bff';

const URLS_PADRAO: Record<NomeServico, string> = {
  usuarios: 'http://localhost:3101',
  adocao: 'http://localhost:3102',
  geolocalizacao: 'http://localhost:3103',
  bff: 'http://localhost:3001',
};

export function urlServico(nome: NomeServico) {
  return process.env[`URL_${nome.toUpperCase()}`] || URLS_PADRAO[nome];
}

/** Conexão com o Azure SQL (ou SQL Server local). No Azure, Encrypt é obrigatório. */
export function configSql() {
  const servidor = process.env.SQL_SERVER || 'localhost';
  if (!process.env.SQL_PASSWORD && process.env.NODE_ENV === 'production') throw new Error('SQL_PASSWORD é obrigatório em produção');
  return {
    server: servidor,
    port: Number(process.env.SQL_PORT) || 1433,
    database: process.env.SQL_DATABASE || 'miaudota_geolocalizacao',
    user: process.env.SQL_USER || 'sa',
    password: process.env.SQL_PASSWORD || 'Miaudota#Dev2026',
    encrypt: (process.env.SQL_ENCRYPT ?? (servidor === 'localhost' ? 'false' : 'true')) === 'true',
    // só para o SQL Server local do docker compose (certificado autoassinado)
    trustServerCertificate: process.env.SQL_TRUST_CERT === 'true',
    // local: cria o banco se não existir. No Azure o banco já é criado pelo portal.
    criarBanco: (process.env.SQL_CRIAR_BANCO ?? (servidor === 'localhost' ? 'true' : 'false')) === 'true',
  };
}

/** Azure Function de enriquecimento (HTTP Trigger). A chave só é necessária na nuvem (authLevel "function"). */
export function configFuncao() {
  return {
    url: process.env.FUNCTION_URL || 'http://localhost:7071/api/indicador-adocao',
    chave: process.env.FUNCTION_KEY,
  };
}
