/**
 * O BFF encaminha estas rotas aos microsserviços sem declará-las como controllers (é um proxy), então elas não
 * aparecem sozinhas no Swagger. Esta tabela as acrescenta à documentação; o detalhe do corpo de cada uma está
 * no Swagger do microsserviço dono (/docs de cada serviço).
 */
type Rota = [metodo: string, caminho: string, tag: string, resumo: string, servico: string];

const ROTAS: Rota[] = [
  ['post', '/usuarios', 'usuarios', 'Cadastra um usuário (PESSOA ou ONG)', 'usuarios'],
  ['post', '/usuarios/login', 'usuarios', 'Login: devolve o JWT', 'usuarios'],
  ['get', '/usuarios/me', 'usuarios', 'Perfil do usuário logado', 'usuarios'],
  ['delete', '/usuarios/me', 'usuarios', 'Exclui a conta (LGPD)', 'usuarios'],
  ['get', '/animais', 'animais', 'Lista animais disponíveis de outros donos (PESSOA)', 'adocao'],
  ['post', '/animais', 'animais', 'Cadastra um animal', 'adocao'],
  ['get', '/animais/meus', 'animais', 'Lista os animais do usuário logado', 'adocao'],
  ['get', '/animais/sugestoes', 'animais', 'Sugere animais pelas espécies curtidas (PESSOA)', 'adocao'],
  ['get', '/animais/{id}', 'animais', 'Busca um animal', 'adocao'],
  ['patch', '/animais/{id}', 'animais', 'Atualiza um animal (dono)', 'adocao'],
  ['delete', '/animais/{id}', 'animais', 'Exclui um animal (dono)', 'adocao'],
  ['get', '/favoritos', 'favoritos', 'Lista os favoritos (PESSOA)', 'adocao'],
  ['post', '/favoritos', 'favoritos', 'Favorita um animal (PESSOA)', 'adocao'],
  ['delete', '/favoritos/{idAnimal}', 'favoritos', 'Remove um favorito (PESSOA)', 'adocao'],
  ['post', '/solicitacoes', 'solicitacoes', 'Abre solicitação de adoção (PESSOA)', 'adocao'],
  ['get', '/solicitacoes/enviadas', 'solicitacoes', 'Solicitações enviadas pelo adotante', 'adocao'],
  ['get', '/solicitacoes/recebidas', 'solicitacoes', 'Solicitações recebidas pelo dono dos animais', 'adocao'],
  ['get', '/solicitacoes/{id}', 'solicitacoes', 'Busca uma solicitação', 'adocao'],
  ['patch', '/solicitacoes/{id}/status', 'solicitacoes', 'Aprova ou recusa uma solicitação (dono)', 'adocao'],
  ['get', '/feiras', 'feiras', 'Lista feiras em andamento ou futuras (com os animais de cada uma)', 'geolocalizacao'],
  ['post', '/feiras', 'feiras', 'Cadastra uma feira (ONG)', 'geolocalizacao'],
  ['get', '/feiras/proximas', 'feiras', 'Feiras próximas de uma coordenada', 'geolocalizacao'],
  ['get', '/feiras/{id}', 'feiras', 'Busca uma feira', 'geolocalizacao'],
  ['patch', '/feiras/{id}', 'feiras', 'Atualiza uma feira (ONG dona)', 'geolocalizacao'],
  ['delete', '/feiras/{id}', 'feiras', 'Exclui uma feira (ONG dona)', 'geolocalizacao'],
  ['patch', '/feiras/{id}/animais', 'feiras', 'Define os animais da feira (ONG dona)', 'geolocalizacao'],
];

export function rotasEncaminhadas() {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const [metodo, caminho, tag, resumo, servico] of ROTAS) {
    const parametros = [...caminho.matchAll(/\{(\w+)\}/g)].map((m) => ({
      name: m[1], in: 'path', required: true, schema: { type: 'string' },
    }));
    paths[caminho] ??= {};
    paths[caminho][metodo] = {
      tags: [`${tag} (encaminhada)`],
      summary: resumo,
      description: `Encaminhada pelo BFF ao microsserviço de ${servico}. Corpo e validações: Swagger desse microsserviço.`,
      parameters: parametros,
      responses: { default: { description: 'Resposta do microsserviço, repassada sem alteração' } },
    };
  }
  return paths;
}
