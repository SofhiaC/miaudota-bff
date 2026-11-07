import 'dotenv/config'; // precisa ser o primeiro import
import { iniciarServico } from '../shared/http/iniciar-servico';
import { BffMobileModule } from './bff-mobile.module';
import { rotasEncaminhadas } from './documentacao-rotas';

iniciarServico(BffMobileModule, 'bff-mobile', Number(process.env.PORTA_BFF || process.env.PORT) || 3001, {
  swagger: {
    titulo: 'Miaudota - BFF Mobile',
    descricao:
      'Backend for Frontend: agrega dados (GET /aggregated-data) e encaminha as demais rotas aos microsserviços. ' +
      'Chamado pelo API Gateway; exige a chave interna.',
    ajustar: (documento) => {
      documento.paths = { ...documento.paths, ...rotasEncaminhadas() };
    },
  },
});
