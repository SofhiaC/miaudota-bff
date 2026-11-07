/** Limite de requisições por IP (janela fixa de 1 minuto, em memória). Login e cadastro têm limite menor. */
const JANELA_MS = 60_000;
const LIMITE_GERAL = Number(process.env.LIMITE_REQUISICOES_POR_MINUTO) || 300;
const LIMITE_AUTENTICACAO = Number(process.env.LIMITE_AUTENTICACAO_POR_MINUTO) || 30;

const contadores = new Map<string, { inicio: number; total: number }>();

setInterval(() => {
  const agora = Date.now();
  for (const [chave, c] of contadores) if (agora - c.inicio >= JANELA_MS) contadores.delete(chave);
}, JANELA_MS).unref();

export function limitarRequisicoes(req: any, res: any, next: () => void) {
  const ehAutenticacao = req.method === 'POST' && (req.path === '/usuarios' || req.path === '/usuarios/login');
  const limite = ehAutenticacao ? LIMITE_AUTENTICACAO : LIMITE_GERAL;
  const chave = `${ehAutenticacao ? 'auth' : 'geral'}:${req.ip}`;
  const agora = Date.now();

  const c = contadores.get(chave);
  if (!c || agora - c.inicio >= JANELA_MS) {
    contadores.set(chave, { inicio: agora, total: 1 });
    return next();
  }
  c.total += 1;
  if (c.total > limite) {
    res.setHeader('Retry-After', String(Math.ceil((c.inicio + JANELA_MS - agora) / 1000)));
    return res.status(429).json({
      statusCode: 429,
      codigo: 'MUITAS_REQUISICOES',
      mensagem: 'Muitas requisições. Tente novamente em instantes.',
    });
  }
  next();
}
